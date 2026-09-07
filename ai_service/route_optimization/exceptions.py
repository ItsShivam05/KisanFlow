"""
Domain exceptions for the route optimization sub-module.
"""

from typing import Optional


class RouteOptimizationError(Exception):
    """Base exception for all route optimization errors."""
    def __init__(self, message: str, reason: Optional[str] = None):
        super().__init__(message)
        self.message = message
        self.reason = reason or "ROUTE_OPTIMIZATION_ERROR"


class ValidationError(RouteOptimizationError):
    """Raised when input data validation fails."""
    def __init__(self, message: str, reason: str = "INVALID_INPUT"):
        super().__init__(message, reason=reason)


class InfeasibleRouteError(RouteOptimizationError):
    """
    Raised or returned when a route cannot be solved due to physical or temporal constraints.
    Typical reasons:
      - INSUFFICIENT_SUPPLY
      - INSUFFICIENT_VEHICLE_CAPACITY
      - DEADLINE_CANNOT_BE_MET
      - NO_FEASIBLE_ROUTE
    """
    def __init__(self, message: str, reason: str = "NO_FEASIBLE_ROUTE"):
        super().__init__(message, reason=reason)
