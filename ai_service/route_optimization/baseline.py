"""
Baseline route calculator.
Computes a naive, unoptimized route following the exact input order:
Depot -> Farmer 1 -> Farmer 2 -> ... -> Farmer N -> Buyer.
Does NOT use OR-Tools. Used as a benchmark to measure optimization improvements.
"""

from typing import List, Union
from ai_service.route_optimization.cost import calculate_transport_cost, calculate_travel_time
from ai_service.route_optimization.distance import calculate_distance
from ai_service.route_optimization.models import (
    Location,
    RouteRequest,
    RouteResult,
    Stop,
    VehicleRoute,
)
from ai_service.route_optimization.validators import calculate_allowed_time_hours


def calculate_baseline_route(request: Union[RouteRequest, dict]) -> RouteResult:
    """
    Calculate the baseline route by visiting suppliers in their exact input order.
    
    If total supplier quantity exceeds a single vehicle's capacity, routes are
    partitioned across available vehicles sequentially.
    """
    if isinstance(request, dict):
        request = RouteRequest(**request)

    depot = request.depot
    buyer = request.buyer
    suppliers = list(request.suppliers)
    vehicles = request.vehicles

    allowed_time_hours = calculate_allowed_time_hours(
        deadline=buyer.delivery_deadline,
        departure=request.departure_time,
        explicit_max_hours=request.max_travel_time_hours,
    )

    routes: List[VehicleRoute] = []
    supplier_idx = 0
    num_suppliers = len(suppliers)

    for vehicle in vehicles:
        if supplier_idx >= num_suppliers:
            break

        stops: List[Stop] = []
        current_loc: Location = depot
        current_distance = 0.0
        current_load = 0.0
        seq = 0

        # 1. Start Stop at Depot
        stops.append(
            Stop(
                sequence=seq,
                type="depot",
                id=depot.id,
                name=depot.name,
                latitude=depot.latitude,
                longitude=depot.longitude,
                quantity_collected_kg=0.0,
                quantity_delivered_kg=0.0,
                cumulative_distance_km=0.0,
                arrival_time_hours=0.0,
            )
        )
        seq += 1

        # 2. Sequential Farmer Pickups
        while supplier_idx < num_suppliers:
            supplier = suppliers[supplier_idx]
            # Check if this supplier fits in current vehicle
            if (
                current_load + supplier.available_quantity_kg > vehicle.capacity_kg
                and current_load > 0
            ):
                # Vehicle full, must deliver to buyer
                break

            leg_dist = calculate_distance(current_loc, supplier)
            current_distance += leg_dist
            current_load += supplier.available_quantity_kg
            current_loc = supplier

            leg_time = calculate_travel_time(current_distance, vehicle.average_speed_kmph)
            stops.append(
                Stop(
                    sequence=seq,
                    type="supplier",
                    id=supplier.id,
                    name=supplier.name,
                    latitude=supplier.latitude,
                    longitude=supplier.longitude,
                    quantity_collected_kg=supplier.available_quantity_kg,
                    quantity_delivered_kg=0.0,
                    cumulative_distance_km=round(current_distance, 2),
                    arrival_time_hours=leg_time,
                )
            )
            seq += 1
            supplier_idx += 1

        # 3. Final Stop at Buyer
        final_leg_dist = calculate_distance(current_loc, buyer)
        current_distance += final_leg_dist
        current_loc = buyer
        total_time = calculate_travel_time(current_distance, vehicle.average_speed_kmph)

        stops.append(
            Stop(
                sequence=seq,
                type="buyer",
                id=buyer.id,
                name=buyer.name,
                latitude=buyer.latitude,
                longitude=buyer.longitude,
                quantity_collected_kg=0.0,
                quantity_delivered_kg=current_load,
                cumulative_distance_km=round(current_distance, 2),
                arrival_time_hours=total_time,
            )
        )

        total_cost = calculate_transport_cost(current_distance, vehicle.cost_per_km)
        capacity_pct = round((current_load / vehicle.capacity_kg) * 100.0, 2)
        deadline_met = True
        if allowed_time_hours is not None:
            deadline_met = total_time <= allowed_time_hours

        routes.append(
            VehicleRoute(
                vehicle_id=vehicle.id,
                stops=stops,
                total_distance_km=round(current_distance, 2),
                estimated_travel_time_hours=total_time,
                estimated_transport_cost=total_cost,
                capacity_used_kg=round(current_load, 2),
                capacity_utilization_percent=capacity_pct,
                deadline_met=deadline_met,
            )
        )

    return RouteResult(
        status="success",
        routes=routes,
        message="Baseline route calculated following original input order.",
    )
