"""
Geographic distance calculation and distance matrix generation.
Uses Haversine spherical distance multiplied by an empirical road circuity factor (default 1.28).
Completely isolated so that future API providers (Google Distance Matrix, OSRM) can be plugged in easily.
"""

import math
from typing import List, Union
from ai_service.route_optimization.models import Location

EARTH_RADIUS_KM = 6371.0
DEFAULT_CIRCUITY_FACTOR = 1.28


def calculate_haversine_distance(
    lat1: float, lon1: float, lat2: float, lon2: float
) -> float:
    """
    Compute great-circle distance between two geographic points using Haversine formula.

    Returns distance in kilometers.
    """
    # Identical coordinates check to avoid floating point precision artifacts
    if lat1 == lat2 and lon1 == lon2:
        return 0.0

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    # Clamp to [0, 1] to guard against rare floating point drift
    a = min(1.0, max(0.0, a))
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return EARTH_RADIUS_KM * c


def calculate_distance(
    location_a: Union[Location, dict],
    location_b: Union[Location, dict],
    circuity_factor: float = DEFAULT_CIRCUITY_FACTOR,
) -> float:
    """
    Calculate estimated road distance (in km) between two locations.
    
    Accepts Location models or dictionaries with 'latitude' and 'longitude'.
    Applies an empirical road circuity factor to approximate real-world driving distance.
    """
    lat1 = location_a.latitude if isinstance(location_a, Location) else location_a["latitude"]
    lon1 = location_a.longitude if isinstance(location_a, Location) else location_a["longitude"]
    lat2 = location_b.latitude if isinstance(location_b, Location) else location_b["latitude"]
    lon2 = location_b.longitude if isinstance(location_b, Location) else location_b["longitude"]

    great_circle_km = calculate_haversine_distance(lat1, lon1, lat2, lon2)
    road_distance_km = great_circle_km * circuity_factor
    return round(road_distance_km, 2)


def build_distance_matrix(
    locations: List[Union[Location, dict]],
    circuity_factor: float = DEFAULT_CIRCUITY_FACTOR,
) -> List[List[float]]:
    """
    Construct an N x N distance matrix for a list of locations.
    The matrix is symmetric and has zeroes on the main diagonal.
    
    matrix[i][j] is the distance from location i to location j in kilometers.
    """
    n = len(locations)
    matrix = [[0.0] * n for _ in range(n)]

    for i in range(n):
        for j in range(i + 1, n):
            dist = calculate_distance(locations[i], locations[j], circuity_factor=circuity_factor)
            matrix[i][j] = dist
            matrix[j][i] = dist

    return matrix
