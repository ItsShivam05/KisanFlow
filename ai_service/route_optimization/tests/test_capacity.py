"""
Tests for vehicle capacity constraints and multi-vehicle allocation.
"""

from ai_service.route_optimization.models import Buyer, Location, RouteRequest, Supplier, Vehicle
from ai_service.route_optimization.optimizer import optimize_route
from ai_service.route_optimization.sample_data import (
    INSUFFICIENT_CAPACITY_SCENARIO_DICT,
    MULTI_VEHICLE_SCENARIO_DICT,
    get_sample_request_dict,
)


def test_capacity_not_exceeded_on_feasible_route():
    """Verify that cumulative payload never exceeds vehicle capacity at any point."""
    data = get_sample_request_dict()
    result = optimize_route(data)

    assert result.status == "success"
    assert result.routes is not None
    assert len(result.routes) >= 1

    for r in result.routes:
        assert r.capacity_used_kg <= 2500.0
        assert r.capacity_utilization_percent <= 100.0


def test_insufficient_vehicle_capacity_error():
    """Verify that insufficient fleet capacity returns clear infeasible status."""
    result = optimize_route(INSUFFICIENT_CAPACITY_SCENARIO_DICT)

    assert result.status == "infeasible"
    assert result.reason == "INSUFFICIENT_VEHICLE_CAPACITY"
    assert "insufficient" in result.message.lower()


def test_multi_vehicle_capacity_partitioning():
    """
    Verify multi-vehicle fleet:
    Total demand 3,500 kg with two 2,000 kg capacity vehicles.
    OR-Tools must split the farmers across both vehicles without exceeding 2,000 kg each.
    """
    result = optimize_route(MULTI_VEHICLE_SCENARIO_DICT)

    assert result.status == "success"
    assert result.routes is not None
    assert len(result.routes) == 2

    total_cargo_collected = 0.0
    for route in result.routes:
        assert route.capacity_used_kg <= 2000.0
        assert route.capacity_used_kg > 0.0
        total_cargo_collected += route.capacity_used_kg

    assert total_cargo_collected == 3500.0
