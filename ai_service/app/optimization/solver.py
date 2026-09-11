"""
Google OR-Tools Route Optimization Engine (Issue #10).

Formulation: Capacitated Vehicle Routing Problem (CVRP)
- Depot: Central Buyer Warehouse / Mandi Procurement Hub
- Nodes: Matched farm/FPO pickup points
- Constraints: Vehicle cargo payload capacity (kg), all nodes visited, delivery deadline
- Objective: Minimize total network road distance and vehicle dispatch cost
- Benchmarking: Naive independent round-trips vs OR-Tools optimized route
- Invariants: Strict quantity conservation and route completeness guarantees
"""

from datetime import datetime
from typing import List, Optional
from ortools.constraint_solver import pywrapcp, routing_enums_pb2

from ai_service.app.config import settings
from ai_service.app.optimization.baseline import calculate_baseline_metrics
from ai_service.app.optimization.distance import build_routing_distance_matrix
from ai_service.app.schemas.routing import (
    PickupLocation,
    RouteOptimizeRequest,
    RouteOptimizeResponse,
    StopPoint,
    VehicleRoute,
)
from ai_service.app.utils.logger import logger


def _parse_deadline_to_hours(deadline_str: Optional[str]) -> Optional[float]:
    """Parse delivery deadline string into allowable hours from route start."""
    if not deadline_str:
        return None
    cleaned = deadline_str.strip()
    # 1. Try ISO datetime
    try:
        dt = datetime.fromisoformat(cleaned.replace("Z", "+00:00"))
        # Default departure today at current/morning hour if only deadline specified
        now = datetime.now(dt.tzinfo) if dt.tzinfo else datetime.now()
        diff_hours = (dt - now).total_seconds() / 3600.0
        if diff_hours > 0:
            return round(diff_hours, 2)
    except Exception:
        pass

    # 2. Try time strings e.g. "4:00 PM", "16:00"
    for fmt in ("%I:%M %p", "%I:%M%p", "%H:%M", "%H:%M:%S"):
        try:
            t = datetime.strptime(cleaned, fmt).time()
            # Assume 8:00 AM dispatch
            deadline_h = t.hour + t.minute / 60.0
            return max(0.1, round(deadline_h - 8.0, 2))
        except ValueError:
            pass

    return None


def solve_cvrp(request: RouteOptimizeRequest) -> RouteOptimizeResponse:
    """
    Solves Capacitated Vehicle Routing Problem using Google OR-Tools.
    Enforces quantity conservation, vehicle capacities, route completeness, and temporal metrics.
    """
    pickups = request.pickups
    total_pickup_demand = sum(p.quantity_kg for p in pickups)
    vehicle_capacity = int(round(request.vehicle_capacity_kg or settings.VEHICLE_CAPACITY_KG))
    num_vehicles = request.fleet_size or 4
    circuity = settings.ROAD_CIRCUITY_FACTOR
    cost_per_km = request.cost_per_km or settings.COST_PER_KM
    fixed_cost = request.fixed_cost_per_vehicle or settings.FIXED_VEHICLE_COST
    speed_kmph = request.average_speed_kmph or 40.0
    allowed_deadline_hours = _parse_deadline_to_hours(request.delivery_deadline)

    # 1. Duplicate Supplier Validation
    seen_ids = set()
    for p in pickups:
        if p.supplier_id in seen_ids:
            err_msg = f"Duplicate supplier ID '{p.supplier_id}' detected in route request."
            logger.warning(err_msg)
            return RouteOptimizeResponse(
                status="INFEASIBLE",
                total_distance_km=0.0,
                total_transport_cost_inr=0.0,
                active_vehicles_count=0,
                total_quantity_collected_kg=0.0,
                routes=[],
                baseline_comparison=calculate_baseline_metrics(
                    request.depot_coordinates, pickups, 0.0, cost_per_km, fixed_cost, 0, circuity, speed_kmph
                ),
                message=err_msg,
            )
        seen_ids.add(p.supplier_id)

    # 2. Total Fleet Capacity Check
    total_fleet_capacity = vehicle_capacity * num_vehicles
    if total_pickup_demand > total_fleet_capacity:
        err_msg = (
            f"Infeasible demand: total quantity to collect ({total_pickup_demand:,.0f} kg) "
            f"exceeds total fleet capacity ({total_fleet_capacity:,.0f} kg across {num_vehicles} trucks)."
        )
        logger.warning(err_msg)
        return RouteOptimizeResponse(
            status="INFEASIBLE",
            total_distance_km=0.0,
            total_transport_cost_inr=0.0,
            active_vehicles_count=0,
            total_quantity_collected_kg=0.0,
            routes=[],
            baseline_comparison=calculate_baseline_metrics(
                request.depot_coordinates, pickups, 0.0, cost_per_km, fixed_cost, 0, circuity, speed_kmph
            ),
            message=err_msg,
        )

    # 3. Empty Pickups Check
    if not pickups:
        return RouteOptimizeResponse(
            status="OPTIMAL",
            total_distance_km=0.0,
            total_transport_cost_inr=0.0,
            active_vehicles_count=0,
            total_quantity_collected_kg=0.0,
            routes=[],
            baseline_comparison=calculate_baseline_metrics(
                request.depot_coordinates, [], 0.0, cost_per_km, fixed_cost, 0, circuity, speed_kmph
            ),
            message="No pickups requested.",
        )

    # 4. Check Single Supplier vs Vehicle Capacity
    for p in pickups:
        if p.quantity_kg > vehicle_capacity:
            err_msg = (
                f"Infeasible: Supplier '{p.name}' quantity ({p.quantity_kg:,.0f} kg) "
                f"exceeds single truck capacity ({vehicle_capacity:,.0f} kg)."
            )
            logger.warning(err_msg)
            return RouteOptimizeResponse(
                status="INFEASIBLE",
                total_distance_km=0.0,
                total_transport_cost_inr=0.0,
                active_vehicles_count=0,
                total_quantity_collected_kg=0.0,
                routes=[],
                baseline_comparison=calculate_baseline_metrics(
                    request.depot_coordinates, pickups, 0.0, cost_per_km, fixed_cost, 0, circuity, speed_kmph
                ),
                message=err_msg,
            )

    # 5. Build Distance Matrix & Demands
    distance_matrix, coords, demands = build_routing_distance_matrix(
        request.depot_coordinates, pickups, circuity
    )

    # 6. Initialize OR-Tools Routing Model
    num_nodes = len(distance_matrix)
    depot_index = 0

    manager = pywrapcp.RoutingIndexManager(num_nodes, num_vehicles, depot_index)
    routing = pywrapcp.RoutingModel(manager)

    # Distance Callback
    def distance_callback(from_index: int, to_index: int) -> int:
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return distance_matrix[from_node][to_node]

    transit_callback_index = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

    # Capacity Constraint Callback
    def demand_callback(from_index: int) -> int:
        from_node = manager.IndexToNode(from_index)
        return demands[from_node]

    demand_callback_index = routing.RegisterUnaryTransitCallback(demand_callback)
    routing.AddDimensionWithVehicleCapacity(
        demand_callback_index,
        0,  # null capacity slack
        [vehicle_capacity] * num_vehicles,  # vehicle maximum capacities
        True,  # start cumul to zero
        "Capacity",
    )

    # Search Parameters
    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    )
    search_parameters.local_search_metaheuristic = (
        routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    )
    search_parameters.time_limit.FromSeconds(3)

    # 7. Solve Problem with OR-Tools
    solution = routing.SolveWithParameters(search_parameters)

    if not solution:
        err_msg = "OR-Tools solver could not find a feasible route solution within time limit."
        logger.error(err_msg)
        return RouteOptimizeResponse(
            status="INFEASIBLE",
            total_distance_km=0.0,
            total_transport_cost_inr=0.0,
            active_vehicles_count=0,
            total_quantity_collected_kg=0.0,
            routes=[],
            baseline_comparison=calculate_baseline_metrics(
                request.depot_coordinates, pickups, 0.0, cost_per_km, fixed_cost, 0, circuity, speed_kmph
            ),
            message=err_msg,
        )

    # 8. Extract Solution Routes
    vehicle_routes: List[VehicleRoute] = []
    total_network_distance_m = 0
    total_quantity_collected = 0.0
    active_vehicles = 0

    for v_id in range(num_vehicles):
        index = routing.Start(v_id)
        if routing.IsEnd(solution.Value(routing.NextVar(index))):
            continue  # Vehicle not used

        active_vehicles += 1
        v_stops: List[StopPoint] = []
        ordered_ids: List[str] = []
        route_dist_m = 0
        current_load = 0.0
        seq = 0

        # Start at depot
        prev_node = depot_index
        v_stops.append(
            StopPoint(
                sequence=seq,
                node_id="depot_start",
                name=request.depot_name,
                stop_type="depot_start",
                latitude=request.depot_coordinates.latitude,
                longitude=request.depot_coordinates.longitude,
                pickup_quantity_kg=0.0,
                cumulative_load_kg=0.0,
                distance_from_prev_km=0.0,
                arrival_time_hours=0.0,
            )
        )
        ordered_ids.append("depot")
        seq += 1

        index = solution.Value(routing.NextVar(index))
        while not routing.IsEnd(index):
            node = manager.IndexToNode(index)
            pickup_obj = pickups[node - 1]
            dist_seg_m = distance_matrix[prev_node][node]
            route_dist_m += dist_seg_m
            current_load += pickup_obj.quantity_kg
            cumul_km = round(route_dist_m / 1000.0, 2)
            arr_time = round(cumul_km / speed_kmph, 2)

            v_stops.append(
                StopPoint(
                    sequence=seq,
                    node_id=pickup_obj.supplier_id,
                    name=pickup_obj.name,
                    stop_type="pickup",
                    latitude=pickup_obj.latitude,
                    longitude=pickup_obj.longitude,
                    pickup_quantity_kg=pickup_obj.quantity_kg,
                    cumulative_load_kg=round(current_load, 1),
                    distance_from_prev_km=round(dist_seg_m / 1000.0, 2),
                    arrival_time_hours=arr_time,
                )
            )
            ordered_ids.append(pickup_obj.supplier_id)
            seq += 1
            prev_node = node
            index = solution.Value(routing.NextVar(index))

        # Return to depot
        end_seg_m = distance_matrix[prev_node][depot_index]
        route_dist_m += end_seg_m
        total_route_km = round(route_dist_m / 1000.0, 2)
        total_v_time = round(total_route_km / speed_kmph, 2)

        v_stops.append(
            StopPoint(
                sequence=seq,
                node_id="depot_end",
                name=request.depot_name,
                stop_type="depot_end",
                latitude=request.depot_coordinates.latitude,
                longitude=request.depot_coordinates.longitude,
                pickup_quantity_kg=0.0,
                cumulative_load_kg=round(current_load, 1),
                distance_from_prev_km=round(end_seg_m / 1000.0, 2),
                arrival_time_hours=total_v_time,
            )
        )
        ordered_ids.append("depot")

        total_network_distance_m += route_dist_m
        total_quantity_collected += current_load

        v_cost = round((total_route_km * cost_per_km) + fixed_cost, 2)
        utilization = round((current_load / vehicle_capacity) * 100.0, 2)

        v_deadline_met = True
        if allowed_deadline_hours is not None:
            v_deadline_met = total_v_time <= allowed_deadline_hours

        vehicle_routes.append(
            VehicleRoute(
                vehicle_id=f"truck-{v_id + 1:02d}",
                vehicle_capacity_kg=float(vehicle_capacity),
                total_carried_kg=round(current_load, 1),
                capacity_utilization_percent=utilization,
                stops=v_stops,
                ordered_stop_ids=ordered_ids,
                route_distance_km=total_route_km,
                transport_cost_inr=v_cost,
                estimated_travel_time_hours=total_v_time,
                deadline_met=v_deadline_met,
            )
        )

    # 9. Invariant Checks: Quantity Conservation & Route Completeness
    routed_qty = round(sum(r.total_carried_kg for r in vehicle_routes), 1)
    if abs(routed_qty - round(total_pickup_demand, 1)) > 0.05:
        err_msg = (
            f"Quantity conservation failure: total routed {routed_qty} kg "
            f"!= total allocated {total_pickup_demand} kg."
        )
        logger.error(err_msg)
        return RouteOptimizeResponse(
            status="INFEASIBLE",
            total_distance_km=0.0,
            total_transport_cost_inr=0.0,
            active_vehicles_count=0,
            total_quantity_collected_kg=0.0,
            routes=[],
            baseline_comparison=calculate_baseline_metrics(
                request.depot_coordinates, pickups, 0.0, cost_per_km, fixed_cost, 0, circuity, speed_kmph
            ),
            message=err_msg,
        )

    visited_suppliers = {
        stop.node_id for r in vehicle_routes for stop in r.stops if stop.stop_type == "pickup"
    }
    required_suppliers = {p.supplier_id for p in pickups}
    if visited_suppliers != required_suppliers:
        err_msg = f"Route completeness failure: missing suppliers {required_suppliers - visited_suppliers}."
        logger.error(err_msg)
        return RouteOptimizeResponse(
            status="INFEASIBLE",
            total_distance_km=0.0,
            total_transport_cost_inr=0.0,
            active_vehicles_count=0,
            total_quantity_collected_kg=0.0,
            routes=[],
            baseline_comparison=calculate_baseline_metrics(
                request.depot_coordinates, pickups, 0.0, cost_per_km, fixed_cost, 0, circuity, speed_kmph
            ),
            message=err_msg,
        )

    # 10. Temporal Deadline Feasibility Check
    overall_deadline_met = all(r.deadline_met for r in vehicle_routes)
    max_travel_time = max((r.estimated_travel_time_hours for r in vehicle_routes), default=0.0)

    if allowed_deadline_hours is not None and not overall_deadline_met:
        err_msg = (
            f"DEADLINE_CANNOT_BE_MET: Maximum route duration ({max_travel_time:.2f} hrs) "
            f"exceeds allowable delivery window ({allowed_deadline_hours:.2f} hrs)."
        )
        logger.warning(err_msg)
        return RouteOptimizeResponse(
            status="INFEASIBLE",
            total_distance_km=0.0,
            total_transport_cost_inr=0.0,
            active_vehicles_count=0,
            total_quantity_collected_kg=0.0,
            routes=[],
            baseline_comparison=calculate_baseline_metrics(
                request.depot_coordinates, pickups, 0.0, cost_per_km, fixed_cost, 0, circuity, speed_kmph
            ),
            total_travel_time_hours=max_travel_time,
            deadline_met=False,
            message=err_msg,
        )

    total_km = round(total_network_distance_m / 1000.0, 2)
    total_cost = sum(r.transport_cost_inr for r in vehicle_routes)

    # 11. Baseline Metrics Calculation
    baseline_comp = calculate_baseline_metrics(
        depot_coords=request.depot_coordinates,
        pickups=pickups,
        optimized_distance_km=total_km,
        cost_per_km=cost_per_km,
        fixed_cost_per_vehicle=fixed_cost,
        optimized_active_vehicles=active_vehicles,
        circuity_factor=circuity,
        speed_kmph=speed_kmph,
        optimized_time_hours=max_travel_time,
    )

    summary_msg = (
        f"Optimized route generated using {active_vehicles} vehicle(s). "
        f"Total distance: {total_km} km (Saved {baseline_comp.distance_saved_km} km, "
        f"{baseline_comp.distance_savings_percent}% vs baseline). "
        f"Total cost: ₹{total_cost:,.2f} (Saved ₹{baseline_comp.cost_saved_inr:,.2f}). "
        f"Estimated duration: {max_travel_time:.2f} hrs."
    )

    return RouteOptimizeResponse(
        status="FEASIBLE" if routing.status() == 1 else "OPTIMAL",
        total_distance_km=total_km,
        total_transport_cost_inr=round(total_cost, 2),
        active_vehicles_count=active_vehicles,
        total_quantity_collected_kg=round(total_quantity_collected, 1),
        routes=vehicle_routes,
        baseline_comparison=baseline_comp,
        total_travel_time_hours=max_travel_time,
        deadline_met=overall_deadline_met,
        message=summary_msg,
    )
