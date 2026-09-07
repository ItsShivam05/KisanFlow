"""
Route comparison module.
Calculates absolute and percentage improvements in distance, transportation cost, and travel time.
"""

from typing import Union
from ai_service.route_optimization.models import RouteComparison, RouteResult


def calculate_percentage_reduction(baseline: float, optimized: float) -> float:
    """
    Calculate the percentage reduction: ((baseline - optimized) / baseline) * 100.
    Guards against division by zero.
    """
    if baseline <= 0.0:
        return 0.0
    reduction = ((baseline - optimized) / baseline) * 100.0
    return round(reduction, 2)


def compare_routes(
    baseline_result: Union[RouteResult, dict],
    optimized_result: Union[RouteResult, dict],
) -> RouteComparison:
    """
    Compare baseline and optimized routing results.
    
    Returns RouteComparison containing distance, cost, and time savings.
    """
    if isinstance(baseline_result, dict):
        baseline_result = RouteResult(**baseline_result)
    if isinstance(optimized_result, dict):
        optimized_result = RouteResult(**optimized_result)

    b_routes = baseline_result.routes or []
    o_routes = optimized_result.routes or []

    # Aggregate metrics across all active vehicles in each solution
    b_distance = sum(r.total_distance_km for r in b_routes)
    o_distance = sum(r.total_distance_km for r in o_routes)

    b_cost = sum(r.estimated_transport_cost for r in b_routes)
    o_cost = sum(r.estimated_transport_cost for r in o_routes)

    # For travel time: max route duration represents completion makespan
    b_time = max((r.estimated_travel_time_hours for r in b_routes), default=0.0)
    o_time = max((r.estimated_travel_time_hours for r in o_routes), default=0.0)

    dist_pct = calculate_percentage_reduction(b_distance, o_distance)
    cost_pct = calculate_percentage_reduction(b_cost, o_cost)
    time_pct = calculate_percentage_reduction(b_time, o_time)

    return RouteComparison(
        baseline_distance_km=round(b_distance, 2),
        optimized_distance_km=round(o_distance, 2),
        distance_reduction_percent=dist_pct,
        baseline_cost=round(b_cost, 2),
        optimized_cost=round(o_cost, 2),
        cost_reduction_percent=cost_pct,
        baseline_time_hours=round(b_time, 2),
        optimized_time_hours=round(o_time, 2),
        time_reduction_percent=time_pct,
    )
