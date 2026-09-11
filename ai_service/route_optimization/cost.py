"""
Transportation cost and travel time calculations.
Keeps business financial and temporal metrics strictly separate from solver mechanics.
"""


def calculate_transport_cost(distance_km: float, cost_per_km: float) -> float:
    """
    Calculate the total transportation cost based on distance and vehicle rate.
    
    Formula: transportation_cost = total_distance_km * cost_per_km
    """
    if distance_km < 0:
        raise ValueError("distance_km cannot be negative")
    if cost_per_km < 0:
        raise ValueError("cost_per_km cannot be negative")

    return round(distance_km * cost_per_km, 2)


def calculate_travel_time(distance_km: float, average_speed_kmph: float) -> float:
    """
    Calculate estimated transit travel time in hours.
    
    Formula: travel_time = distance / average_speed
    """
    if distance_km < 0:
        raise ValueError("distance_km cannot be negative")
    if average_speed_kmph <= 0:
        raise ValueError("average_speed_kmph must be greater than 0")

    return round(distance_km / average_speed_kmph, 2)
