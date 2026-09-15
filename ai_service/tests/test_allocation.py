"""
Unit tests for Smart Demand Allocation & Procurement Optimization Engine.
Verifies all 10 required test cases including the exact 50 kg Aloo ₹1110 & ₹290 savings scenario.
"""

import pytest
from ai_service.app.schemas.allocation import AllocationRequest, SupplierCandidate
from ai_service.app.optimization.allocation import solve_demand_allocation

@pytest.fixture
def sih_demo_candidates():
    """
    Standard SIH Demo Dataset:
    F1: 10 kg @ ₹20
    F2: 10 kg @ ₹22
    F3: 10 kg @ ₹21
    F4: 10 kg @ ₹25
    F5: 10 kg @ ₹23
    F6: 50 kg @ ₹28
    """
    return [
        SupplierCandidate(supplier_id="F1", name="Farmer 1", available_quantity_kg=10, price_per_kg=20, quality_grade="A"),
        SupplierCandidate(supplier_id="F2", name="Farmer 2", available_quantity_kg=10, price_per_kg=22, quality_grade="A"),
        SupplierCandidate(supplier_id="F3", name="Farmer 3", available_quantity_kg=10, price_per_kg=21, quality_grade="A"),
        SupplierCandidate(supplier_id="F4", name="Farmer 4", available_quantity_kg=10, price_per_kg=25, quality_grade="A"),
        SupplierCandidate(supplier_id="F5", name="Farmer 5", available_quantity_kg=10, price_per_kg=23, quality_grade="A"),
        SupplierCandidate(supplier_id="F6", name="Farmer 6", available_quantity_kg=50, price_per_kg=28, quality_grade="A"),
    ]

# TEST 1: Feasible quantity allocation evaluation
def test_1_feasible_quantity_allocation(sih_demo_candidates):
    req = AllocationRequest(product_name="Aloo", demand_quantity_kg=50, candidates=sih_demo_candidates)
    res = solve_demand_allocation(req)
    assert res.is_fully_fulfilled is True
    assert res.allocated_quantity_kg == 50.0
    assert len(res.proposals) >= 1

# TEST 2: SIH Exact Price Case (F1+F2+F3+F4+F5 = 50 kg @ ₹1110 vs F6 @ ₹1400 -> Savings ₹290)
def test_2_exact_sih_50kg_aloo_pricing_and_savings(sih_demo_candidates):
    req = AllocationRequest(product_name="Aloo", demand_quantity_kg=50, candidates=sih_demo_candidates)
    res = solve_demand_allocation(req)

    best = res.best_proposal
    assert best is not None
    assert best.product_cost_inr == 1110.0
    assert best.allocated_quantity_kg == 50.0

    # Verify selected suppliers are F1, F2, F3, F4, F5 (10 kg each)
    allocated_ids = sorted([s.supplier_id for s in best.suppliers])
    assert allocated_ids == ["F1", "F2", "F3", "F4", "F5"]

    # Verify savings vs single supplier (F6 = 50 * 28 = 1400; 1400 - 1110 = 290)
    assert best.savings_vs_cheapest_single_supplier_inr == 290.0
    assert "₹290 cheaper" in best.explanation or "1,110" in best.explanation

# TEST 3: Demand larger than total supply (Partial fulfillment)
def test_3_demand_larger_than_total_supply():
    small_candidates = [
        SupplierCandidate(supplier_id="F1", name="Farmer 1", available_quantity_kg=40, price_per_kg=20),
        SupplierCandidate(supplier_id="F2", name="Farmer 2", available_quantity_kg=50, price_per_kg=25),
    ]
    req = AllocationRequest(product_name="Potato", demand_quantity_kg=100, candidates=small_candidates)
    res = solve_demand_allocation(req)

    assert res.is_fully_fulfilled is False
    assert res.allocated_quantity_kg == 90.0
    assert res.unfulfilled_quantity_kg == 10.0
    assert res.best_proposal.optimization_status == "PARTIAL_FULFILLMENT"

# TEST 4: One supplier has exactly enough quantity
def test_4_exact_single_supplier_fulfillment():
    candidates = [
        SupplierCandidate(supplier_id="F1", name="Exact Farmer", available_quantity_kg=50, price_per_kg=20),
        SupplierCandidate(supplier_id="F2", name="Small Farmer", available_quantity_kg=10, price_per_kg=25),
    ]
    req = AllocationRequest(product_name="Tomato", demand_quantity_kg=50, candidates=candidates)
    res = solve_demand_allocation(req)

    assert res.is_fully_fulfilled is True
    assert res.best_proposal.product_cost_inr == 1000.0
    assert len(res.best_proposal.suppliers) == 1

# TEST 5: Supplier available quantity smaller than requested
def test_5_supplier_quantity_smaller_than_requested():
    candidates = [
        SupplierCandidate(supplier_id="F1", name="Farmer 1", available_quantity_kg=15, price_per_kg=18),
        SupplierCandidate(supplier_id="F2", name="Farmer 2", available_quantity_kg=20, price_per_kg=20),
    ]
    req = AllocationRequest(product_name="Onion", demand_quantity_kg=30, candidates=candidates)
    res = solve_demand_allocation(req)

    assert res.is_fully_fulfilled is True
    assert res.allocated_quantity_kg == 30.0
    # Took 15 from F1 and 15 from F2
    f1_item = next(s for s in res.best_proposal.suppliers if s.supplier_id == "F1")
    assert f1_item.allocated_quantity_kg == 15.0

# TEST 6: Invalid/negative quantity validation
def test_6_negative_quantity_validation():
    with pytest.raises(Exception):
        AllocationRequest(product_name="Aloo", demand_quantity_kg=-10, candidates=[])

# TEST 7: Cannot allocate more than available quantity
def test_7_no_over_allocation():
    candidates = [
        SupplierCandidate(supplier_id="F1", name="Farmer 1", available_quantity_kg=10, price_per_kg=20),
    ]
    req = AllocationRequest(product_name="Aloo", demand_quantity_kg=50, candidates=candidates)
    res = solve_demand_allocation(req)

    assert res.best_proposal.suppliers[0].allocated_quantity_kg == 10.0
    assert res.allocated_quantity_kg == 10.0

# TEST 8: Quality requirement excludes unsuitable supplier
def test_8_quality_filtering():
    candidates = [
        SupplierCandidate(supplier_id="F1", name="Grade C Farmer", available_quantity_kg=50, price_per_kg=15, quality_grade="C"),
        SupplierCandidate(supplier_id="F2", name="Grade A Farmer", available_quantity_kg=50, price_per_kg=25, quality_grade="A"),
    ]
    req = AllocationRequest(product_name="Aloo", demand_quantity_kg=50, quality_requirement="A", candidates=candidates)
    res = solve_demand_allocation(req)

    assert len(res.best_proposal.suppliers) == 1
    assert res.best_proposal.suppliers[0].supplier_id == "F2"

# TEST 9: Maximum price constraint excludes overpriced supplier
def test_9_max_price_constraint():
    candidates = [
        SupplierCandidate(supplier_id="F1", name="Expensive Farmer", available_quantity_kg=50, price_per_kg=40),
        SupplierCandidate(supplier_id="F2", name="Fair Farmer", available_quantity_kg=50, price_per_kg=25),
    ]
    req = AllocationRequest(product_name="Aloo", demand_quantity_kg=50, max_price_per_kg=30, candidates=candidates)
    res = solve_demand_allocation(req)

    assert len(res.best_proposal.suppliers) == 1
    assert res.best_proposal.suppliers[0].supplier_id == "F2"

# TEST 10: Top ranked alternatives returned
def test_10_top_ranked_alternatives_returned(sih_demo_candidates):
    req = AllocationRequest(product_name="Aloo", demand_quantity_kg=50, candidates=sih_demo_candidates)
    res = solve_demand_allocation(req, top_k=3)

    assert len(res.proposals) >= 2
    assert res.proposals[0].rank == 1
    assert res.proposals[1].rank == 2
    assert res.proposals[0].total_landed_cost_inr <= res.proposals[1].total_landed_cost_inr
