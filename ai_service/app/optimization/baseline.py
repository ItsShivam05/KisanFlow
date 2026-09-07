"""
Naive Baseline Routing Calculator (Issue #10).

Calculates the unoptimized procurement distance where a vehicle performs 
independent round-trips to each supplier from the central depot.
"""

from typing import List, Optional
from ai_service.app.schemas.routing import BaselineComparison, PickupLocation
from ai_service.app.schemas.common import Coordinates
from ai_service.app.utils.geo import road_distance_km

def calculate_baseline_metrics(
    depot_coords: Coordinates,
    pickups: List[PickupLocation],
    optimized_distance_km: float,
    cost_per_km: float = 20.0,
    fixed_cost_per_vehicle: float = 1000.0,
    optimized_active_vehicles: int = 1,
    circuity_factor: float = 1.28,
    speed_kmph: float = 40.0,
    optimized_time_hours: Optional[float] = None
) -> BaselineComparison:
    """
    Compute naive round-trip baseline metrics vs optimized CVRP results.
    """
    if not pickups:
        return BaselineComparison(
            baseline_distance_km=0.0,
            optimized_distance_km=0.0,
            distance_saved_km=0.0,
            distance_savings_percent=0.0,
            baseline_cost_inr=0.0,
            optimized_cost_inr=0.0,
            cost_saved_inr=0.0,
            cost_savings_percent=0.0,
            baseline_time_hours=0.0,
            time_saved_hours=0.0,
            time_savings_percent=0.0
        )
        
    # Baseline: Independent direct trips to each supplier: Depot -> Supplier -> Depot
    baseline_dist = 0.0
    for p in pickups:
        one_way = road_distance_km(
            depot_coords.latitude, depot_coords.longitude,
            p.latitude, p.longitude,
            circuity_factor=circuity_factor
        )
        baseline_dist += (2.0 * one_way)
        
    baseline_dist = round(baseline_dist, 2)
    optimized_dist = round(optimized_distance_km, 2)
    
    dist_saved = round(max(0.0, baseline_dist - optimized_dist), 2)
    dist_saved_pct = round((dist_saved / baseline_dist) * 100.0, 2) if baseline_dist > 0 else 0.0
    
    # Cost comparison: Each separate trip incurs fixed vehicle fee in naive model
    baseline_cost = round((baseline_dist * cost_per_km) + (len(pickups) * fixed_cost_per_vehicle), 2)
    optimized_cost = round((optimized_dist * cost_per_km) + (optimized_active_vehicles * fixed_cost_per_vehicle), 2)
    
    cost_saved = round(max(0.0, baseline_cost - optimized_cost), 2)
    cost_saved_pct = round((cost_saved / baseline_cost) * 100.0, 2) if baseline_cost > 0 else 0.0

    # Temporal comparison
    baseline_time = round(baseline_dist / speed_kmph, 2)
    time_saved = 0.0
    time_saved_pct = 0.0
    if optimized_time_hours is not None and baseline_time > 0:
        time_saved = round(max(0.0, baseline_time - optimized_time_hours), 2)
        time_saved_pct = round((time_saved / baseline_time) * 100.0, 2)
    
    return BaselineComparison(
        baseline_distance_km=baseline_dist,
        optimized_distance_km=optimized_dist,
        distance_saved_km=dist_saved,
        distance_savings_percent=dist_saved_pct,
        baseline_cost_inr=baseline_cost,
        optimized_cost_inr=optimized_cost,
        cost_saved_inr=cost_saved,
        cost_savings_percent=cost_saved_pct,
        baseline_time_hours=baseline_time,
        time_saved_hours=time_saved,
        time_savings_percent=time_saved_pct
    )
