"""
Core route optimization engine using Google OR-Tools.
Implements Capacitated Vehicle Routing Problem (CVRP) with open Depot-to-Buyer topology.
"""

from typing import Any, Dict, List, Optional, Union
from ortools.constraint_solver import pywrapcp, routing_enums_pb2

from ai_service.route_optimization.baseline import calculate_baseline_route
from ai_service.route_optimization.comparison import compare_routes
from ai_service.route_optimization.cost import calculate_transport_cost, calculate_travel_time
from ai_service.route_optimization.distance import build_distance_matrix, calculate_distance
from ai_service.route_optimization.exceptions import InfeasibleRouteError, ValidationError
from ai_service.route_optimization.models import (
    Location,
    RouteRequest,
    RouteResult,
    Stop,
    VehicleRoute,
)
from ai_service.route_optimization.validators import calculate_allowed_time_hours, validate_request


def optimize_route(request: Union[RouteRequest, Dict[str, Any]]) -> RouteResult:
    """
    Optimize collection route from depot across selected suppliers to the buyer destination.

    Accepts:
      request: RouteRequest model or equivalent dictionary.

    Returns:
      RouteResult matching the standardized Section 17 output schema.
    """
    # 1. Parse and coerce input
    try:
        if isinstance(request, dict):
            req_model = RouteRequest(**request)
        elif isinstance(request, RouteRequest):
            req_model = request
        else:
            return RouteResult(
                status="invalid_input",
                reason="INVALID_INPUT_TYPE",
                message=f"Expected RouteRequest or dict, received {type(request).__name__}",
            )
    except Exception as exc:
        return RouteResult(
            status="invalid_input",
            reason="VALIDATION_ERROR",
            message=str(exc),
        )

    # 2. Run domain validators and feasibility pre-checks
    try:
        validate_request(req_model)
    except ValidationError as val_err:
        return RouteResult(
            status="invalid_input",
            reason=val_err.reason,
            message=val_err.message,
        )
    except InfeasibleRouteError as inf_err:
        return RouteResult(
            status="infeasible",
            reason=inf_err.reason,
            message=inf_err.message,
        )

    # 3. Assemble indexed location topology:
    #    Node 0       : Depot (Vehicle origin)
    #    Nodes 1 .. N : Suppliers (Pickups)
    #    Node N + 1   : Buyer (Delivery destination)
    depot = req_model.depot
    suppliers = list(req_model.suppliers)
    buyer = req_model.buyer
    vehicles = list(req_model.vehicles)

    all_locations: List[Location] = [depot] + suppliers + [buyer]
    num_locations = len(all_locations)
    depot_node = 0
    buyer_node = num_locations - 1

    # 4. Build distance matrix (in integer meters for OR-Tools solver precision)
    matrix_km = build_distance_matrix(all_locations)
    matrix_meters = [
        [int(round(km * 1000.0)) for km in row]
        for row in matrix_km
    ]

    # 5. Demands array
    demands = [0] * num_locations
    for idx, s in enumerate(suppliers, start=1):
        demands[idx] = int(round(s.available_quantity_kg))

    # 6. OR-Tools Routing Model Setup
    num_vehicles = len(vehicles)
    starts = [depot_node] * num_vehicles
    ends = [buyer_node] * num_vehicles

    manager = pywrapcp.RoutingIndexManager(num_locations, num_vehicles, starts, ends)
    routing = pywrapcp.RoutingModel(manager)

    # Transit distance callback
    def distance_callback(from_index: int, to_index: int) -> int:
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return matrix_meters[from_node][to_node]

    transit_callback_index = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

    # Fixed vehicle mobilization cost to incentivize using minimum fleet size
    for v_idx in range(num_vehicles):
        routing.SetFixedCostOfVehicle(50000, v_idx)

    # Capacity dimension
    def demand_callback(from_index: int) -> int:
        from_node = manager.IndexToNode(from_index)
        return demands[from_node]

    demand_callback_index = routing.RegisterUnaryTransitCallback(demand_callback)
    vehicle_capacities = [int(round(v.capacity_kg)) for v in vehicles]

    routing.AddDimensionWithVehicleCapacity(
        demand_callback_index,
        0,  # null capacity slack
        vehicle_capacities,
        True,  # start cumul to zero
        "Capacity",
    )

    # 7. Solver Parameters
    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    )
    search_parameters.local_search_metaheuristic = (
        routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    )
    search_parameters.time_limit.seconds = 3

    # 8. Solve VRP
    solution = routing.SolveWithParameters(search_parameters)

    if not solution:
        return RouteResult(
            status="infeasible",
            reason="NO_FEASIBLE_ROUTE",
            message="OR-Tools could not find a feasible route satisfying all constraints.",
        )

    # 9. Extract Optimized Vehicle Routes
    allowed_time_hours = calculate_allowed_time_hours(
        deadline=buyer.delivery_deadline,
        departure=req_model.departure_time,
        explicit_max_hours=req_model.max_travel_time_hours,
    )

    optimized_routes: List[VehicleRoute] = []

    for vehicle_idx, vehicle in enumerate(vehicles):
        node_indices: List[int] = []
        index = routing.Start(vehicle_idx)
        while not routing.IsEnd(index):
            node_indices.append(manager.IndexToNode(index))
            index = solution.Value(routing.NextVar(index))
        node_indices.append(manager.IndexToNode(index))

        # Check if vehicle actually picked up from any supplier
        supplier_stops_in_route = [n for n in node_indices if 1 <= n <= len(suppliers)]
        if not supplier_stops_in_route:
            # Unused vehicle
            continue

        # Reconstruct high-precision stops
        stops: List[Stop] = []
        cumulative_dist = 0.0
        cumulative_load = 0.0

        for seq, n_idx in enumerate(node_indices):
            loc = all_locations[n_idx]
            if seq == 0:
                # Depot
                stops.append(
                    Stop(
                        sequence=seq,
                        type="depot",
                        id=loc.id,
                        name=loc.name,
                        latitude=loc.latitude,
                        longitude=loc.longitude,
                        quantity_collected_kg=0.0,
                        quantity_delivered_kg=0.0,
                        cumulative_distance_km=0.0,
                        arrival_time_hours=0.0,
                    )
                )
            elif n_idx == buyer_node:
                # Buyer
                prev_loc = all_locations[node_indices[seq - 1]]
                leg_dist = calculate_distance(prev_loc, loc)
                cumulative_dist += leg_dist
                arr_time = calculate_travel_time(cumulative_dist, vehicle.average_speed_kmph)
                stops.append(
                    Stop(
                        sequence=seq,
                        type="buyer",
                        id=loc.id,
                        name=loc.name,
                        latitude=loc.latitude,
                        longitude=loc.longitude,
                        quantity_collected_kg=0.0,
                        quantity_delivered_kg=round(cumulative_load, 2),
                        cumulative_distance_km=round(cumulative_dist, 2),
                        arrival_time_hours=arr_time,
                    )
                )
            else:
                # Supplier
                supplier_obj = suppliers[n_idx - 1]
                prev_loc = all_locations[node_indices[seq - 1]]
                leg_dist = calculate_distance(prev_loc, loc)
                cumulative_dist += leg_dist
                cumulative_load += supplier_obj.available_quantity_kg
                arr_time = calculate_travel_time(cumulative_dist, vehicle.average_speed_kmph)
                stops.append(
                    Stop(
                        sequence=seq,
                        type="supplier",
                        id=supplier_obj.id,
                        name=supplier_obj.name,
                        latitude=supplier_obj.latitude,
                        longitude=supplier_obj.longitude,
                        quantity_collected_kg=supplier_obj.available_quantity_kg,
                        quantity_delivered_kg=0.0,
                        cumulative_distance_km=round(cumulative_dist, 2),
                        arrival_time_hours=arr_time,
                    )
                )

        total_route_dist = round(cumulative_dist, 2)
        route_time = calculate_travel_time(total_route_dist, vehicle.average_speed_kmph)
        route_cost = calculate_transport_cost(total_route_dist, vehicle.cost_per_km)
        capacity_util = round((cumulative_load / vehicle.capacity_kg) * 100.0, 2)

        deadline_met = True
        if allowed_time_hours is not None:
            deadline_met = route_time <= allowed_time_hours

        optimized_routes.append(
            VehicleRoute(
                vehicle_id=vehicle.id,
                stops=stops,
                total_distance_km=total_route_dist,
                estimated_travel_time_hours=route_time,
                estimated_transport_cost=route_cost,
                capacity_used_kg=round(cumulative_load, 2),
                capacity_utilization_percent=capacity_util,
                deadline_met=deadline_met,
            )
        )

    # 10. Deadline Feasibility Check
    if any(not r.deadline_met for r in optimized_routes):
        max_duration = max(r.estimated_travel_time_hours for r in optimized_routes)
        return RouteResult(
            status="infeasible",
            reason="DEADLINE_CANNOT_BE_MET",
            message=(
                f"Optimized route transit time ({max_duration:.2f} hrs) exceeds "
                f"allowable deadline window ({allowed_time_hours:.2f} hrs)."
            ),
        )

    # 11. Compute Baseline and Comparison
    baseline_result = calculate_baseline_route(req_model)
    comparison = compare_routes(
        baseline_result=baseline_result,
        optimized_result=RouteResult(status="success", routes=optimized_routes),
    )

    return RouteResult(
        status="success",
        routes=optimized_routes,
        comparison=comparison,
        message=f"Optimal route found using {len(optimized_routes)} vehicle(s).",
    )
