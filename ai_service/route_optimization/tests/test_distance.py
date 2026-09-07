"""
Tests for distance calculations and distance matrix builder.
"""

import math
import pytest
from ai_service.route_optimization.distance import (
    calculate_distance,
    calculate_haversine_distance,
    build_distance_matrix,
)
from ai_service.route_optimization.models import Location


def test_haversine_zero_distance():
    """Identical points must produce exactly 0.0 distance."""
    dist = calculate_haversine_distance(31.6340, 74.8723, 31.6340, 74.8723)
    assert dist == 0.0


def test_haversine_symmetry():
    """Distance from A to B must equal distance from B to A."""
    lat1, lon1 = 31.6340, 74.8723
    lat2 = 31.6200
    lon2 = 74.8500

    d_ab = calculate_haversine_distance(lat1, lon1, lat2, lon2)
    d_ba = calculate_haversine_distance(lat2, lon2, lat1, lon1)
    assert pytest.approx(d_ab, rel=1e-5) == d_ba
    assert d_ab > 0.0


def test_haversine_known_benchmark():
    """
    Benchmark: Distance between Amritsar (31.6340, 74.8723) and Jalandhar (31.3260, 75.5762)
    is approx 74 to 78 km great-circle.
    """
    amritsar = (31.6340, 74.8723)
    jalandhar = (31.3260, 75.5762)
    dist = calculate_haversine_distance(amritsar[0], amritsar[1], jalandhar[0], jalandhar[1])
    assert 70.0 < dist < 85.0


def test_calculate_distance_with_circuity():
    """Road distance must apply circuity factor (>= great-circle distance)."""
    loc_a = Location(id="A", name="A", latitude=31.6340, longitude=74.8723)
    loc_b = Location(id="B", name="B", latitude=31.6200, longitude=74.8500)

    gc_dist = calculate_haversine_distance(loc_a.latitude, loc_a.longitude, loc_b.latitude, loc_b.longitude)
    road_dist = calculate_distance(loc_a, loc_b, circuity_factor=1.28)

    assert road_dist > gc_dist
    assert pytest.approx(road_dist, abs=0.05) == round(gc_dist * 1.28, 2)


def test_build_distance_matrix():
    """Distance matrix must be symmetric, zero on diagonal, and match list size."""
    locs = [
        Location(id="L1", name="L1", latitude=31.60, longitude=74.80),
        Location(id="L2", name="L2", latitude=31.65, longitude=74.85),
        Location(id="L3", name="L3", latitude=31.70, longitude=74.90),
    ]
    matrix = build_distance_matrix(locs)
    assert len(matrix) == 3
    assert len(matrix[0]) == 3

    for i in range(3):
        assert matrix[i][i] == 0.0
        for j in range(3):
            assert matrix[i][j] == matrix[j][i]
            if i != j:
                assert matrix[i][j] > 0.0
