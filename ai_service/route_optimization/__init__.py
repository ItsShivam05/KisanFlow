"""
Farm-to-Buyer Route Optimization Sub-Module.
Powered by Google OR-Tools.

Provides a clean, modular Python interface for agricultural collection and delivery logistics.
"""

from ai_service.route_optimization.baseline import calculate_baseline_route
from ai_service.route_optimization.comparison import compare_routes
from ai_service.route_optimization.cost import calculate_transport_cost, calculate_travel_time
from ai_service.route_optimization.distance import build_distance_matrix, calculate_distance
from ai_service.route_optimization.exceptions import (
    InfeasibleRouteError,
    RouteOptimizationError,
    ValidationError,
)
from ai_service.route_optimization.models import (
    Buyer,
    Depot,
    Location,
    RouteComparison,
    RouteRequest,
    RouteResult,
    Stop,
    Supplier,
    Vehicle,
    VehicleRoute,
)
from ai_service.route_optimization.optimizer import optimize_route

__version__ = "1.0.0"

__all__ = [
    "optimize_route",
    "calculate_baseline_route",
    "compare_routes",
    "calculate_distance",
    "build_distance_matrix",
    "calculate_transport_cost",
    "calculate_travel_time",
    "RouteRequest",
    "RouteResult",
    "Buyer",
    "Supplier",
    "Vehicle",
    "Location",
    "Depot",
    "Stop",
    "VehicleRoute",
    "RouteComparison",
    "RouteOptimizationError",
    "ValidationError",
    "InfeasibleRouteError",
]
