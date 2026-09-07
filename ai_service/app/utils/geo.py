import math
from typing import List, Tuple

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees).
    """
    # Convert decimal degrees to radians
    r = 6371.0  # Earth's radius in kilometers
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    return r * c

def road_distance_km(lat1: float, lon1: float, lat2: float, lon2: float, circuity_factor: float = 1.28) -> float:
    """
    Calculate estimated actual road driving distance using a calibrated
    circuity factor (default 1.28x for Indian road network).
    """
    if lat1 == lat2 and lon1 == lon2:
        return 0.0
    direct = haversine_distance_km(lat1, lon1, lat2, lon2)
    return round(direct * circuity_factor, 2)

def compute_distance_matrix_km(
    coordinates: List[Tuple[float, float]],
    circuity_factor: float = 1.28
) -> List[List[float]]:
    """
    Compute a full distance matrix (in km) between all coordinates.
    Node 0 is typically the Depot (Warehouse / Buyer Location).
    """
    n = len(coordinates)
    matrix = [[0.0 for _ in range(n)] for _ in range(n)]
    for i in range(n):
        for j in range(n):
            if i == j:
                matrix[i][j] = 0.0
            else:
                lat1, lon1 = coordinates[i]
                lat2, lon2 = coordinates[j]
                matrix[i][j] = road_distance_km(lat1, lon1, lat2, lon2, circuity_factor)
    return matrix
