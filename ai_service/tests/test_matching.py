"""
Tests for Issue #9: Supplier Matching Engine.
"""

import pytest
from ai_service.app.schemas.matching import (
    BuyerRequirement, SupplierItem, MatchWeights
)
from ai_service.app.schemas.common import Coordinates
from ai_service.app.matching.engine import (
    match_suppliers, calculate_supplier_score
)
from ai_service.app.matching.weights import DEFAULT_WEIGHTS

@pytest.fixture
def sample_suppliers():
    return [
        SupplierItem(
            supplier_id="SUP-01",
            name="Near Cheap HighQual Farm",
            supplier_type="Farmer",
            product="Tomato",
            available_quantity_kg=2000.0,
            price_per_kg=28.0,
            latitude=25.6000,
            longitude=85.1400,  # ~1 km from Patna
            quality_grade="A",
            reliability_score=0.95,
            freshness_days=1,
            wastage_risk_score=0.05
        ),
        SupplierItem(
            supplier_id="SUP-02",
            name="Mid Dist Mid Price Farm",
            supplier_type="Farmer",
            product="Tomato",
            available_quantity_kg=3000.0,
            price_per_kg=32.0,
            latitude=25.6500,
            longitude=85.2000,  # ~10 km
            quality_grade="B",
            reliability_score=0.88,
            freshness_days=2,
            wastage_risk_score=0.15
        ),
        SupplierItem(
            supplier_id="SUP-03",
            name="Far Expensive LowQual Farm",
            supplier_type="Farmer",
            product="Tomato",
            available_quantity_kg=4000.0,
            price_per_kg=40.0,
            latitude=25.9000,
            longitude=85.5000,  # ~50 km
            quality_grade="C",
            reliability_score=0.70,
            freshness_days=4,
            wastage_risk_score=0.30
        ),
        SupplierItem(
            supplier_id="SUP-04",
            name="Wrong Commodity Potato Farm",
            supplier_type="Farmer",
            product="Potato",
            available_quantity_kg=5000.0,
            price_per_kg=20.0,
            latitude=25.6000,
            longitude=85.1400,
            quality_grade="A",
            reliability_score=0.99,
            freshness_days=1,
            wastage_risk_score=0.02
        )
    ]

@pytest.fixture
def buyer_requirement():
    return BuyerRequirement(
        product="Tomato",
        required_quantity_kg=3500.0,
        region="Patna",
        buyer_location=Coordinates(latitude=25.5941, longitude=85.1376),
        minimum_quality="B"
    )

def test_score_calculation_bounds(sample_suppliers, buyer_requirement):
    """Test score is normalized between 0 and 100."""
    supp = sample_suppliers[0]
    score, breakdown = calculate_supplier_score(
        supplier=supp,
        req=buyer_requirement,
        distance_km=1.2,
        min_price=28.0,
        max_price=40.0,
        max_dist=50.0,
        weights=DEFAULT_WEIGHTS
    )
    assert 0.0 <= score <= 100.0
    for val in breakdown.values():
        assert 0.0 <= val <= 100.0

def test_exact_multi_supplier_fulfillment(sample_suppliers, buyer_requirement):
    """Test iterative allocation fulfills requirement without exceeding available stocks."""
    result = match_suppliers(buyer_requirement, candidate_suppliers=sample_suppliers)
    
    assert result.is_fully_fulfilled is True
    assert result.total_allocated_quantity_kg == 3500.0
    assert result.fulfillment_percentage == 100.0
    assert len(result.selected_suppliers) == 2  # SUP-01 (2000kg) + SUP-02 (1500kg)
    
    # Verify allocation limits
    for alloc in result.selected_suppliers:
        assert alloc.allocated_quantity_kg <= alloc.available_quantity_kg
        assert len(alloc.reasons) > 0

def test_quality_filtering(sample_suppliers, buyer_requirement):
    """Test Grade C supplier is filtered out when Grade B is required."""
    result = match_suppliers(buyer_requirement, candidate_suppliers=sample_suppliers)
    selected_ids = [s.supplier_id for s in result.selected_suppliers]
    assert "SUP-03" not in selected_ids  # SUP-03 is Grade C
    assert "SUP-04" not in selected_ids  # SUP-04 is Potato

def test_partial_fulfillment_when_supply_limited(sample_suppliers):
    """Test partial fulfillment when total available is less than required."""
    huge_req = BuyerRequirement(
        product="Tomato",
        required_quantity_kg=15000.0,  # exceeds available 5000 kg compatible
        region="Patna",
        buyer_location=Coordinates(latitude=25.5941, longitude=85.1376),
        minimum_quality="B"
    )
    result = match_suppliers(huge_req, candidate_suppliers=sample_suppliers)
    
    assert result.is_fully_fulfilled is False
    assert result.total_allocated_quantity_kg == 5000.0  # 2000 + 3000
    assert result.unfulfilled_quantity_kg == 10000.0
    assert result.fulfillment_percentage == pytest.approx(33.33, 0.1)

def test_deterministic_ranking(sample_suppliers, buyer_requirement):
    """Test top scored supplier is always selected first."""
    result1 = match_suppliers(buyer_requirement, candidate_suppliers=sample_suppliers)
    result2 = match_suppliers(buyer_requirement, candidate_suppliers=sample_suppliers)
    
    assert result1.selected_suppliers[0].supplier_id == result2.selected_suppliers[0].supplier_id == "SUP-01"
    assert result1.selected_suppliers[0].score > result1.selected_suppliers[1].score
