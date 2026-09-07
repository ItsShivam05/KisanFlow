"""
Tests for Issue #10: Google OR-Tools Route Optimization.
Includes tests for capacity limits, quantity conservation, route completeness,
temporal calculations, deadline enforcement, and dual-contract compatibility.
"""

import pytest
from pydantic import ValidationError
from ai_service.app.schemas.routing import RouteOptimizeRequest, PickupLocation
from ai_service.app.schemas.common import Coordinates
from ai_service.app.optimization.solver import solve_cvrp

@pytest.fixture
def depot_coordinates():
    return Coordinates(latitude=25.5941, longitude=85.1376)  # Patna

@pytest.fixture
def sample_pickups():
    return [
        PickupLocation(
            supplier_id="SUP-A",
            name="Phulwari Farm",
            latitude=25.5786,
            longitude=85.0743,
            quantity_kg=1500.0
        ),
        PickupLocation(
            supplier_id="SUP-B",
            name="Danapur Farm",
            latitude=25.6324,
            longitude=85.0441,
            quantity_kg=1200.0
        ),
        PickupLocation(
            supplier_id="SUP-C",
            name="Hajipur Hub",
            latitude=25.6858,
            longitude=85.2146,
            quantity_kg=1800.0
        )
    ]

def test_single_vehicle_cvrp_feasible(depot_coordinates, sample_pickups):
    """Test standard CVRP with 1 vehicle capable of carrying total load (4500 kg < 5000 kg)."""
    req = RouteOptimizeRequest(
        depot_coordinates=depot_coordinates,
        depot_name="Patna Depot",
        pickups=sample_pickups,
        vehicle_capacity_kg=5000.0,
        fleet_size=2
    )
    result = solve_cvrp(req)
    
    assert result.status in ["OPTIMAL", "FEASIBLE"]
    assert result.active_vehicles_count == 1
    assert result.total_quantity_collected_kg == 4500.0
    
    # Check stops
    route = result.routes[0]
    assert route.total_carried_kg == 4500.0
    assert route.stops[0].stop_type == "depot_start"
    assert route.stops[-1].stop_type == "depot_end"
    
    # Verify baseline comparison
    bc = result.baseline_comparison
    assert bc.baseline_distance_km > result.total_distance_km
    assert bc.distance_saved_km > 0.0
    assert bc.distance_savings_percent > 0.0
    assert bc.cost_saved_inr > 0.0

def test_multi_vehicle_dispatch_capacity_split(depot_coordinates, sample_pickups):
    """Test that when truck capacity is smaller (e.g. 2500 kg), 2 vehicles are dispatched."""
    req = RouteOptimizeRequest(
        depot_coordinates=depot_coordinates,
        depot_name="Patna Depot",
        pickups=sample_pickups,
        vehicle_capacity_kg=2500.0,  # 4500 kg total requires >= 2 trucks
        fleet_size=4
    )
    result = solve_cvrp(req)
    
    assert result.status in ["OPTIMAL", "FEASIBLE"]
    assert result.active_vehicles_count >= 2
    assert result.total_quantity_collected_kg == 4500.0
    
    # Verify no truck exceeds 2500 kg
    for v in result.routes:
        assert v.total_carried_kg <= 2500.0

def test_infeasible_when_cargo_exceeds_total_fleet(depot_coordinates, sample_pickups):
    """Test INFEASIBLE returned when total demand exceeds total fleet capacity."""
    req = RouteOptimizeRequest(
        depot_coordinates=depot_coordinates,
        depot_name="Patna Depot",
        pickups=sample_pickups,
        vehicle_capacity_kg=1000.0,
        fleet_size=2  # max 2000 kg capacity < 4500 kg needed
    )
    result = solve_cvrp(req)
    assert result.status == "INFEASIBLE"
    assert "exceeds total fleet capacity" in result.message

def test_infeasible_when_single_pickup_exceeds_truck_capacity(depot_coordinates):
    """Test INFEASIBLE returned when a single supplier quantity exceeds truck payload."""
    req = RouteOptimizeRequest(
        depot_coordinates=depot_coordinates,
        depot_name="Patna Depot",
        pickups=[
            PickupLocation(
                supplier_id="HUGE-01",
                name="Giant Farm",
                latitude=25.5786,
                longitude=85.0743,
                quantity_kg=8000.0  # > 5000 kg capacity
            )
        ],
        vehicle_capacity_kg=5000.0,
        fleet_size=3
    )
    result = solve_cvrp(req)
    assert result.status == "INFEASIBLE"
    assert "exceeds single truck capacity" in result.message

def test_quantity_conservation(depot_coordinates, sample_pickups):
    """Phase 5: Verify routed quantity strictly equals allocated input quantity."""
    req = RouteOptimizeRequest(
        depot_coordinates=depot_coordinates,
        pickups=sample_pickups,
        vehicle_capacity_kg=3000.0,
        fleet_size=3
    )
    result = solve_cvrp(req)
    assert result.status in ["OPTIMAL", "FEASIBLE"]

    input_total = sum(p.quantity_kg for p in sample_pickups)
    collected_total = sum(
        stop.pickup_quantity_kg
        for r in result.routes
        for stop in r.stops
        if stop.stop_type == "pickup"
    )
    assert collected_total == input_total == result.total_quantity_collected_kg == 4500.0

def test_route_completeness(depot_coordinates, sample_pickups):
    """Phase 11: Verify every input supplier is visited in the generated routes."""
    req = RouteOptimizeRequest(
        depot_coordinates=depot_coordinates,
        pickups=sample_pickups,
        vehicle_capacity_kg=2500.0,
        fleet_size=3
    )
    result = solve_cvrp(req)
    assert result.status in ["OPTIMAL", "FEASIBLE"]

    visited_suppliers = {
        stop.node_id
        for r in result.routes
        for stop in r.stops
        if stop.stop_type == "pickup"
    }
    expected_suppliers = {p.supplier_id for p in sample_pickups}
    assert visited_suppliers == expected_suppliers

def test_duplicate_supplier_rejection(depot_coordinates):
    """Phase 4: Verify duplicate supplier IDs return INFEASIBLE."""
    dups = [
        PickupLocation(supplier_id="SUP-01", name="Farm 1", latitude=25.58, longitude=85.07, quantity_kg=1000.0),
        PickupLocation(supplier_id="SUP-01", name="Farm 1 Dup", latitude=25.59, longitude=85.08, quantity_kg=1000.0),
    ]
    req = RouteOptimizeRequest(
        depot_coordinates=depot_coordinates,
        pickups=dups,
        vehicle_capacity_kg=3000.0,
        fleet_size=2
    )
    result = solve_cvrp(req)
    assert result.status == "INFEASIBLE"
    assert "Duplicate supplier ID" in result.message

def test_temporal_calculations(depot_coordinates, sample_pickups):
    """Phase 15: Verify travel time is calculated correctly (distance / speed)."""
    speed = 50.0  # km/h
    req = RouteOptimizeRequest(
        depot_coordinates=depot_coordinates,
        pickups=sample_pickups,
        vehicle_capacity_kg=5000.0,
        average_speed_kmph=speed,
        fleet_size=2
    )
    result = solve_cvrp(req)
    assert result.status in ["OPTIMAL", "FEASIBLE"]
    assert result.total_travel_time_hours is not None
    assert result.total_travel_time_hours > 0.0

    route = result.routes[0]
    expected_time = round(route.route_distance_km / speed, 2)
    assert pytest.approx(route.estimated_travel_time_hours, abs=0.05) == expected_time

def test_deadline_cannot_be_met(depot_coordinates, sample_pickups):
    """Phase 17 & 18: Verify impossible delivery deadline returns INFEASIBLE."""
    req = RouteOptimizeRequest(
        depot_coordinates=depot_coordinates,
        pickups=sample_pickups,
        vehicle_capacity_kg=5000.0,
        delivery_deadline="8:05 AM",  # Only 5 mins (0.08 hrs) allowed for ~50km trip
        average_speed_kmph=40.0,
        fleet_size=2
    )
    result = solve_cvrp(req)
    assert result.status == "INFEASIBLE"
    assert "DEADLINE_CANNOT_BE_MET" in result.message

def test_dual_contract_schema_compatibility():
    """Phase 2: Verify the Phase 2 contract ('buyer', 'suppliers', 'vehicles') parses and solves."""
    payload = {
        "buyer": {
            "id": "buyer_1",
            "name": "Patna Central Mandi",
            "latitude": 25.5941,
            "longitude": 85.1376
        },
        "suppliers": [
            {
                "id": "supplier_a",
                "name": "FPO A Phulwari",
                "latitude": 25.5786,
                "longitude": 85.0743,
                "allocated_quantity_kg": 2000.0
            },
            {
                "id": "supplier_b",
                "name": "FPO B Danapur",
                "latitude": 25.6324,
                "longitude": 85.0441,
                "allocated_quantity_kg": 1500.0
            }
        ],
        "vehicles": [
            {
                "id": "vehicle_1",
                "capacity_kg": 5000.0,
                "cost_per_km": 20.0,
                "average_speed_kmph": 40.0
            }
        ]
    }
    req = RouteOptimizeRequest(**payload)
    result = solve_cvrp(req)
    assert result.status in ["OPTIMAL", "FEASIBLE"]
    assert result.total_quantity_collected_kg == 3500.0
    assert result.active_vehicles_count == 1

def test_coordinate_validation_bounds():
    """Phase 4: Verify out-of-range coordinates are rejected at schema level."""
    with pytest.raises(ValidationError):
        PickupLocation(
            supplier_id="BAD-01",
            name="Bad Lat Farm",
            latitude=95.0,  # Invalid > 90
            longitude=85.0,
            quantity_kg=500.0
        )
