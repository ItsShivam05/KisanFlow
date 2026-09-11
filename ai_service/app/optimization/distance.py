"""
Distance Matrix Formulation for OR-Tools Routing (Issue #10).
"""

from typing import List, Tuple
from ai_service.app.schemas.routing import PickupLocation
from ai_service.app.schemas.common import Coordinates
from ai_service.app.utils.geo import compute_distance_matrix_km

def build_routing_distance_matrix(
    depot_coords: Coordinates,
    pickups: List[PickupLocation],
    circuity_factor: float = 1.28
) -> Tuple[List[List[int]], List[Tuple[float, float]], List[int]]:
    """
    Build integer distance matrix (scaled to meters for OR-Tools precision)
    and list of node demands.
    
    Node 0: Depot (demand = 0)
    Nodes 1..N: Pickups (demand = pickup quantity in kg)
    """
    coords = [(depot_coords.latitude, depot_coords.longitude)]
    demands = [0]
    
    for p in pickups:
        coords.append((p.latitude, p.longitude))
        demands.append(int(round(p.quantity_kg)))
        
    matrix_km = compute_distance_matrix_km(coords, circuity_factor)
    
    # Scale to integer meters for OR-Tools constraint solver
    matrix_meters = [
        [int(round(cell * 1000.0)) for cell in row]
        for row in matrix_km
    ]
    
    return matrix_meters, coords, demands
