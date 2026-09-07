"""
Runnable command-line demonstration for the Route Optimization sub-module.
Execute with:
    python -m route_optimization
"""

import sys
from typing import List

# Ensure safe UTF-8 output on Windows terminals
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

from ai_service.route_optimization.baseline import calculate_baseline_route
from ai_service.route_optimization.models import Stop
from ai_service.route_optimization.optimizer import optimize_route
from ai_service.route_optimization.sample_data import get_sample_request_dict


def _format_arrow_route(stops: List[Stop]) -> str:
    """Format a list of stops into an indented vertical arrow flow."""
    lines = []
    for idx, stop in enumerate(stops):
        label = stop.name or stop.id
        lines.append(f"  {label}")
        if idx < len(stops) - 1:
            lines.append("    \u2193")
    return "\n".join(lines)


def run_demo() -> None:
    sample_request = get_sample_request_dict()

    # 1. Calculate baseline and optimized routes
    baseline_res = calculate_baseline_route(sample_request)
    optimized_res = optimize_route(sample_request)

    if optimized_res.status != "success":
        print(f"Optimization failed: {optimized_res.reason} - {optimized_res.message}")
        return

    comp = optimized_res.comparison
    opt_route = optimized_res.routes[0]
    base_route = baseline_res.routes[0]

    buyer_qty = int(sample_request["buyer"]["required_quantity_kg"])
    deadline = sample_request["buyer"].get("delivery_deadline", "N/A")
    vehicle_cap = int(sample_request["vehicle"]["capacity_kg"])

    print("=====================================")
    print(" FARM-TO-BUYER ROUTE OPTIMIZATION")
    print("=====================================")
    print()
    print("BUYER")
    print(f"Required quantity: {buyer_qty} kg")
    print(f"Deadline: {deadline}")
    print()
    print("VEHICLE")
    print(f"Capacity: {vehicle_cap} kg")
    print()
    print("-------------------------------------")
    print("BASELINE ROUTE")
    print("-------------------------------------")
    print()
    print(_format_arrow_route(base_route.stops))
    print()
    print(f"Distance: {base_route.total_distance_km:.1f} km")
    print(f"Time: {base_route.estimated_travel_time_hours:.2f} hours")
    print(f"Cost: \u20b9{base_route.estimated_transport_cost:.2f}")
    print()
    print("-------------------------------------")
    print("OPTIMIZED ROUTE")
    print("-------------------------------------")
    print()
    print(_format_arrow_route(opt_route.stops))
    print()
    print(f"Distance: {opt_route.total_distance_km:.1f} km")
    print(f"Time: {opt_route.estimated_travel_time_hours:.2f} hours")
    print(f"Cost: \u20b9{opt_route.estimated_transport_cost:.2f}")
    print()
    print("-------------------------------------")
    print("IMPROVEMENT")
    print("-------------------------------------")
    print()
    print(f"Distance reduction: {comp.distance_reduction_percent:.2f}%")
    print(f"Cost reduction: {comp.cost_reduction_percent:.2f}%")
    print(f"Time reduction: {comp.time_reduction_percent:.2f}%")
    print()
    cap_status = "PASSED" if opt_route.capacity_used_kg <= vehicle_cap else "FAILED"
    deadline_status = "MET" if opt_route.deadline_met else "MISSED"
    print(f"Capacity constraint: {cap_status}")
    print(f"Deadline: {deadline_status}")
    print("=====================================")


if __name__ == "__main__":
    run_demo()
