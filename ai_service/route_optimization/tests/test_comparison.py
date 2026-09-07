"""
Tests for baseline route generation, cost/time calculations, and comparison metrics.
"""

import pytest
from ai_service.route_optimization.baseline import calculate_baseline_route
from ai_service.route_optimization.comparison import calculate_percentage_reduction, compare_routes
from ai_service.route_optimization.cost import calculate_transport_cost, calculate_travel_time
from ai_service.route_optimization.models import RouteComparison, RouteResult
from ai_service.route_optimization.optimizer import optimize_route
from ai_service.route_optimization.sample_data import get_sample_request_dict


def test_transport_cost_calculation():
    """Verify cost formula: distance_km * cost_per_km."""
    cost = calculate_transport_cost(distance_km=73.4, cost_per_km=20.0)
    assert cost == 1468.0

    with pytest.raises(ValueError):
        calculate_transport_cost(-10.0, 20.0)

    with pytest.raises(ValueError):
        calculate_transport_cost(50.0, -5.0)


def test_travel_time_calculation():
    """Verify travel time formula: distance_km / average_speed_kmph."""
    time_hours = calculate_travel_time(distance_km=80.0, average_speed_kmph=40.0)
    assert time_hours == 2.0

    with pytest.raises(ValueError):
        calculate_travel_time(50.0, 0.0)

    with pytest.raises(ValueError):
        calculate_travel_time(-10.0, 40.0)


def test_percentage_reduction():
    """Verify reduction percentage calculation and zero baseline guard."""
    assert calculate_percentage_reduction(100.0, 75.0) == 25.0
    assert calculate_percentage_reduction(94.2, 73.4) == 22.08
    assert calculate_percentage_reduction(0.0, 50.0) == 0.0


def test_baseline_route_follows_input_order():
    """Verify baseline visits suppliers strictly in the input order."""
    data = get_sample_request_dict()
    res = calculate_baseline_route(data)

    assert res.status == "success"
    assert res.routes is not None
    route = res.routes[0]

    # Expected order: Depot (D001) -> F001 -> F002 -> F003 -> Buyer (B001)
    stop_ids = [s.id for s in route.stops]
    assert stop_ids == ["D001", "F001", "F002", "F003", "B001"]


def test_baseline_vs_optimized_comparison():
    """Verify that optimization yields lower distance than baseline on criss-crossing sample data."""
    data = get_sample_request_dict()
    res = optimize_route(data)

    assert res.status == "success"
    comp: RouteComparison = res.comparison

    assert comp.optimized_distance_km < comp.baseline_distance_km
    assert comp.distance_reduction_percent > 20.0
    assert comp.cost_reduction_percent > 20.0
    assert comp.time_reduction_percent > 20.0
