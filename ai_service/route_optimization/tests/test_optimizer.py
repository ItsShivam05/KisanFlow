"""
Tests for the primary optimize_route function and edge case handling.
"""

from ai_service.route_optimization.models import Buyer, Location, RouteRequest, Supplier, Vehicle
from ai_service.route_optimization.optimizer import optimize_route
from ai_service.route_optimization.sample_data import (
    INSUFFICIENT_SUPPLY_SCENARIO_DICT,
    UNMET_DEADLINE_SCENARIO_DICT,
    get_sample_request_dict,
    get_sample_request_model,
)


def test_feasible_route_basic():
    """Verify standard single-vehicle feasible route execution."""
    data = get_sample_request_dict()
    result = optimize_route(data)

    assert result.status == "success"
    assert result.routes is not None
    assert len(result.routes) == 1

    route = result.routes[0]
    assert route.vehicle_id == "V001"
    assert route.stops[0].type == "depot"
    assert route.stops[-1].type == "buyer"
    assert route.deadline_met is True
    assert route.total_distance_km > 0.0
    assert route.capacity_used_kg == 2000.0


def test_dict_and_model_input_equivalence():
    """Verify optimize_route accepts both raw dict and RouteRequest model with identical outputs."""
    dict_input = get_sample_request_dict()
    model_input = get_sample_request_model()

    res_from_dict = optimize_route(dict_input)
    res_from_model = optimize_route(model_input)

    assert res_from_dict.status == res_from_model.status == "success"
    assert res_from_dict.routes[0].total_distance_km == res_from_model.routes[0].total_distance_km
    assert res_from_dict.routes[0].estimated_transport_cost == res_from_model.routes[0].estimated_transport_cost


def test_insufficient_supply_handling():
    """Verify that buyer demand exceeding total supplier capacity is flagged as INSUFFICIENT_SUPPLY."""
    result = optimize_route(INSUFFICIENT_SUPPLY_SCENARIO_DICT)

    assert result.status == "infeasible"
    assert result.reason == "INSUFFICIENT_SUPPLY"
    assert "insufficient" in result.message.lower() or "supply" in result.message.lower()


def test_deadline_cannot_be_met_handling():
    """Verify that unrealistic delivery deadlines return DEADLINE_CANNOT_BE_MET."""
    result = optimize_route(UNMET_DEADLINE_SCENARIO_DICT)

    assert result.status == "infeasible"
    assert result.reason == "DEADLINE_CANNOT_BE_MET"


def test_multiple_suppliers_five_farmers():
    """Verify that 5 farmers are all visited and cargo collected."""
    depot = Location(id="D001", name="Depot", latitude=31.60, longitude=74.80)
    buyer = Buyer(id="B001", name="Buyer", latitude=31.62, longitude=74.92, required_quantity_kg=2500)
    suppliers = [
        Supplier(id=f"F00{i}", name=f"Farmer {i}", latitude=31.60 + 0.02 * i, longitude=74.82 + 0.02 * i, available_quantity_kg=500.0)
        for i in range(1, 6)
    ]
    vehicle = Vehicle(id="V001", capacity_kg=3000, cost_per_km=20.0, average_speed_kmph=40.0)

    req = RouteRequest(buyer=buyer, suppliers=suppliers, vehicle=vehicle, depot=depot)
    result = optimize_route(req)

    assert result.status == "success"
    assert len(result.routes) == 1
    route = result.routes[0]

    collected_farmer_ids = [s.id for s in route.stops if s.type == "supplier"]
    assert len(collected_farmer_ids) == 5
    assert set(collected_farmer_ids) == {f"F00{i}" for i in range(1, 6)}
    assert route.capacity_used_kg == 2500.0


def test_validation_errors():
    """Verify that malformed inputs produce clear invalid_input status rather than crashing."""
    # Negative quantity
    bad_dict = get_sample_request_dict()
    bad_dict["buyer"]["required_quantity_kg"] = -100

    res = optimize_route(bad_dict)
    assert res.status == "invalid_input"

    # Out of range coordinates
    bad_coords = get_sample_request_dict()
    bad_coords["buyer"]["latitude"] = 999.0

    res_coords = optimize_route(bad_coords)
    assert res_coords.status == "invalid_input"


def test_to_dict_schema():
    """Verify result.to_dict() matches Section 17 schema."""
    data = get_sample_request_dict()
    res = optimize_route(data)
    d = res.to_dict()

    assert d["status"] == "success"
    assert "routes" in d
    assert "comparison" in d
    assert isinstance(d["routes"], list)
    assert "stops" in d["routes"][0]
    assert "total_distance_km" in d["routes"][0]
    assert "estimated_travel_time_hours" in d["routes"][0]
    assert "estimated_transport_cost" in d["routes"][0]
    assert "capacity_used_kg" in d["routes"][0]
    assert "capacity_utilization_percent" in d["routes"][0]
    assert "deadline_met" in d["routes"][0]
    assert "distance_reduction_percent" in d["comparison"]
