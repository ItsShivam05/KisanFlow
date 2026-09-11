"""
Validation functions for route optimization requests.
Provides clear pre-solver checks for physical and business feasibility.
"""

from datetime import datetime, time
import re
from typing import Optional, Tuple, Union
from ai_service.route_optimization.exceptions import InfeasibleRouteError, ValidationError
from ai_service.route_optimization.models import RouteRequest


def parse_time_string_to_hours(time_str: str) -> Optional[float]:
    """
    Parse strings like '4:00 PM', '16:00', '16:30:00' into hours from midnight.
    """
    time_str = time_str.strip()
    # Try 12-hour format e.g. "4:00 PM", "04:30 pm"
    for fmt in ("%I:%M %p", "%I:%M%p", "%I %p", "%I%p"):
        try:
            t = datetime.strptime(time_str, fmt).time()
            return t.hour + t.minute / 60.0 + t.second / 3600.0
        except ValueError:
            pass

    # Try 24-hour format e.g. "16:00", "16:30:00"
    for fmt in ("%H:%M:%S", "%H:%M"):
        try:
            t = datetime.strptime(time_str, fmt).time()
            return t.hour + t.minute / 60.0 + t.second / 3600.0
        except ValueError:
            pass

    return None


def calculate_allowed_time_hours(
    deadline: Optional[Union[str, datetime]],
    departure: Optional[Union[str, datetime]] = None,
    explicit_max_hours: Optional[float] = None,
) -> Optional[float]:
    """
    Determine the maximum allowable transit duration in hours based on deadline and departure.
    """
    if explicit_max_hours is not None:
        return float(explicit_max_hours)

    if not deadline:
        return None

    # Handle datetime object
    if isinstance(deadline, datetime):
        if departure and isinstance(departure, datetime):
            delta = (deadline - departure).total_seconds() / 3600.0
            return max(0.0, delta)
        return None

    if isinstance(deadline, str):
        # Check if ISO datetime string
        try:
            dt = datetime.fromisoformat(deadline.replace("Z", "+00:00"))
            if departure:
                dep_dt = (
                    datetime.fromisoformat(departure.replace("Z", "+00:00"))
                    if isinstance(departure, str)
                    else departure
                )
                delta = (dt - dep_dt).total_seconds() / 3600.0
                return max(0.0, delta)
        except Exception:
            pass

        # Try time of day string (e.g. '4:00 PM')
        parsed_hours = parse_time_string_to_hours(deadline)
        if parsed_hours is not None:
            dep_hours = 8.0  # Default 8:00 AM departure if not specified
            if departure:
                if isinstance(departure, str):
                    p_dep = parse_time_string_to_hours(departure)
                    if p_dep is not None:
                        dep_hours = p_dep
            return max(0.0, parsed_hours - dep_hours)

    return None


def validate_request(request: RouteRequest) -> None:
    """
    Validate input parameters and check for edge-case infeasibilities before running OR-Tools.
    
    Raises:
      ValidationError: If inputs are malformed or invalid.
      InfeasibleRouteError: If constraints make a feasible route physically impossible.
    """
    # 1. Validate Buyer
    if request.buyer.required_quantity_kg <= 0:
        raise ValidationError("buyer.required_quantity_kg must be greater than 0")

    if not (-90.0 <= request.buyer.latitude <= 90.0):
        raise ValidationError(f"Invalid buyer latitude: {request.buyer.latitude}")
    if not (-180.0 <= request.buyer.longitude <= 180.0):
        raise ValidationError(f"Invalid buyer longitude: {request.buyer.longitude}")

    # 2. Validate Suppliers
    if not request.suppliers:
        raise ValidationError("At least one supplier must be provided")

    supplier_ids = set()
    total_available_supply = 0.0

    for idx, s in enumerate(request.suppliers):
        if not s.id or not s.id.strip():
            raise ValidationError(f"Supplier at index {idx} has an empty ID")
        if s.id in supplier_ids:
            raise ValidationError(f"Duplicate supplier ID '{s.id}' found")
        supplier_ids.add(s.id)

        if not (-90.0 <= s.latitude <= 90.0):
            raise ValidationError(f"Invalid supplier '{s.id}' latitude: {s.latitude}")
        if not (-180.0 <= s.longitude <= 180.0):
            raise ValidationError(f"Invalid supplier '{s.id}' longitude: {s.longitude}")

        if s.available_quantity_kg < 0:
            raise ValidationError(f"Supplier '{s.id}' has negative quantity: {s.available_quantity_kg}")
        total_available_supply += s.available_quantity_kg

    # 3. Check Supply Sufficiency
    if total_available_supply < request.buyer.required_quantity_kg:
        raise InfeasibleRouteError(
            f"Total available supply ({total_available_supply} kg) is less than buyer required quantity ({request.buyer.required_quantity_kg} kg)",
            reason="INSUFFICIENT_SUPPLY"
        )

    # 4. Validate Vehicles
    if not request.vehicles:
        raise ValidationError("At least one vehicle must be provided or configured")

    total_fleet_capacity = 0.0
    for v in request.vehicles:
        if v.capacity_kg <= 0:
            raise ValidationError(f"Vehicle '{v.id}' has non-positive capacity: {v.capacity_kg}")
        if v.cost_per_km < 0:
            raise ValidationError(f"Vehicle '{v.id}' has negative cost_per_km: {v.cost_per_km}")
        if v.average_speed_kmph <= 0:
            raise ValidationError(f"Vehicle '{v.id}' has non-positive speed: {v.average_speed_kmph}")
        total_fleet_capacity += v.capacity_kg

    # 5. Check Vehicle Capacity Sufficiency
    if total_fleet_capacity < request.buyer.required_quantity_kg:
        raise InfeasibleRouteError(
            f"Total fleet capacity ({total_fleet_capacity} kg) is insufficient for buyer requirement ({request.buyer.required_quantity_kg} kg)",
            reason="INSUFFICIENT_VEHICLE_CAPACITY"
        )
