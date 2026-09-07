"""
Curated realistic sample datasets for testing and demonstration of the route optimization sub-module.
Includes Amritsar agricultural district scenarios representing farmers, buyer, depot, and vehicles.
"""

import copy
from typing import Any, Dict
from ai_service.route_optimization.models import Buyer, Location, RouteRequest, Supplier, Vehicle

# -------------------------------------------------------------------------
# Primary Scenario: 1 Depot, 3 Farmers, 1 Buyer, 1 Vehicle
# Demonstrates significant savings (~38%) when re-ordering a criss-crossing baseline.
# -------------------------------------------------------------------------
PRIMARY_SCENARIO_DICT: Dict[str, Any] = {
    "depot": {
        "id": "D001",
        "name": "Amritsar Central Agro Hub",
        "latitude": 31.6000,
        "longitude": 74.8400,
    },
    "buyer": {
        "id": "B001",
        "name": "FreshMart Aggregation Buyer",
        "latitude": 31.6150,
        "longitude": 74.9450,
        "required_quantity_kg": 2000.0,
        "delivery_deadline": "4:00 PM",
    },
    "suppliers": [
        {
            "id": "F001",
            "name": "Farmer A",
            "latitude": 31.6600,
            "longitude": 74.8300,
            "available_quantity_kg": 800.0,
        },
        {
            "id": "F002",
            "name": "Farmer B",
            "latitude": 31.6100,
            "longitude": 74.9100,
            "available_quantity_kg": 700.0,
        },
        {
            "id": "F003",
            "name": "Farmer C",
            "latitude": 31.6700,
            "longitude": 74.8600,
            "available_quantity_kg": 500.0,
        },
    ],
    "vehicle": {
        "id": "V001",
        "capacity_kg": 2500.0,
        "cost_per_km": 20.0,
        "average_speed_kmph": 40.0,
    },
    "departure_time": "1:00 PM",
}


def get_sample_request_dict() -> Dict[str, Any]:
    """Return a dictionary representation of the standard demonstration scenario."""
    return copy.deepcopy(PRIMARY_SCENARIO_DICT)


def get_sample_request_model() -> RouteRequest:
    """Return a validated RouteRequest model of the standard demonstration scenario."""
    return RouteRequest(**copy.deepcopy(PRIMARY_SCENARIO_DICT))


# -------------------------------------------------------------------------
# Multi-Vehicle Scenario: 2 Trucks, 4 Farmers (Total Cargo 3,500 kg)
# Demonstrates fleet partitioning when total cargo exceeds 1 truck capacity.
# -------------------------------------------------------------------------
MULTI_VEHICLE_SCENARIO_DICT: Dict[str, Any] = {
    "depot": {
        "id": "D001",
        "name": "Amritsar Logistics Center",
        "latitude": 31.6000,
        "longitude": 74.8400,
    },
    "buyer": {
        "id": "B001",
        "name": "Punjab Agro Wholesale",
        "latitude": 31.6200,
        "longitude": 74.9500,
        "required_quantity_kg": 3500.0,
        "delivery_deadline": "2026-09-07T18:00:00",
    },
    "suppliers": [
        {
            "id": "F001",
            "name": "Farmer A",
            "latitude": 31.6600,
            "longitude": 74.8300,
            "available_quantity_kg": 1200.0,
        },
        {
            "id": "F002",
            "name": "Farmer B",
            "latitude": 31.6100,
            "longitude": 74.9100,
            "available_quantity_kg": 900.0,
        },
        {
            "id": "F003",
            "name": "Farmer C",
            "latitude": 31.6700,
            "longitude": 74.8600,
            "available_quantity_kg": 800.0,
        },
        {
            "id": "F004",
            "name": "Farmer D",
            "latitude": 31.5900,
            "longitude": 74.8900,
            "available_quantity_kg": 600.0,
        },
    ],
    "vehicles": [
        {
            "id": "V001",
            "capacity_kg": 2000.0,
            "cost_per_km": 20.0,
            "average_speed_kmph": 40.0,
        },
        {
            "id": "V002",
            "capacity_kg": 2000.0,
            "cost_per_km": 20.0,
            "average_speed_kmph": 40.0,
        },
    ],
    "departure_time": "2026-09-07T13:00:00",
}


# -------------------------------------------------------------------------
# Infeasible Scenarios for Edge Case Validation
# -------------------------------------------------------------------------
INSUFFICIENT_SUPPLY_SCENARIO_DICT: Dict[str, Any] = {
    "buyer": {
        "id": "B001",
        "name": "Large Retail Chain",
        "latitude": 31.6250,
        "longitude": 74.8850,
        "required_quantity_kg": 2000.0,
    },
    "suppliers": [
        {
            "id": "F001",
            "name": "Farmer Small A",
            "latitude": 31.6400,
            "longitude": 74.8600,
            "available_quantity_kg": 700.0,
        },
        {
            "id": "F002",
            "name": "Farmer Small B",
            "latitude": 31.6500,
            "longitude": 74.8700,
            "available_quantity_kg": 500.0,
        },
    ],  # Total supply = 1200 kg < 2000 kg required!
    "vehicle": {
        "id": "V001",
        "capacity_kg": 2500.0,
        "cost_per_km": 20.0,
        "average_speed_kmph": 40.0,
    },
}

INSUFFICIENT_CAPACITY_SCENARIO_DICT: Dict[str, Any] = {
    "buyer": {
        "id": "B001",
        "name": "Large Retail Chain",
        "latitude": 31.6250,
        "longitude": 74.8850,
        "required_quantity_kg": 2000.0,
    },
    "suppliers": [
        {
            "id": "F001",
            "name": "Farmer A",
            "latitude": 31.6400,
            "longitude": 74.8600,
            "available_quantity_kg": 1000.0,
        },
        {
            "id": "F002",
            "name": "Farmer B",
            "latitude": 31.6500,
            "longitude": 74.8700,
            "available_quantity_kg": 1000.0,
        },
    ],
    "vehicle": {
        "id": "V001",
        "capacity_kg": 1200.0,  # Single vehicle cannot carry 2000 kg!
        "cost_per_km": 20.0,
        "average_speed_kmph": 40.0,
    },
}

UNMET_DEADLINE_SCENARIO_DICT: Dict[str, Any] = {
    **copy.deepcopy(PRIMARY_SCENARIO_DICT),
    "max_travel_time_hours": 0.1,  # 6 minutes is impossible for a 27 km route!
}
