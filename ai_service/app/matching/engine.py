"""
Supplier Matching Engine (Issue #9).

Implements deterministic, transparent multi-supplier scoring and iterative greedy allocation:
- Quality and capacity filtering
- Multi-criteria weighted scoring
- Ranked allocation avoiding over-allocation
- Full and partial fulfillment handling
- Explainable decision reasons
"""

import json
from pathlib import Path
from typing import List, Optional
from ai_service.app.schemas.matching import (
    BuyerRequirement, SupplierItem, MatchSuppliersResponse,
    SupplierMatchAllocation, MatchWeights
)
from ai_service.app.matching.weights import (
    DEFAULT_WEIGHTS, QUALITY_GRADE_SCORES, QUALITY_GRADE_RANKS, generate_allocation_reasons
)
from ai_service.app.utils.geo import road_distance_km
from ai_service.app.utils.logger import logger
from ai_service.app.config import settings

def load_seed_suppliers(seeds_file: Optional[str] = None) -> List[SupplierItem]:
    """Load default seed supplier inventory from JSON."""
    file_path = seeds_file or str(Path(settings.SEEDS_DIR) / "suppliers.json")
    p = Path(file_path)
    if not p.exists():
        logger.warning(f"Seeds file not found at {file_path}, returning empty list.")
        return []
        
    with open(p, "r", encoding="utf-8") as f:
        data = json.load(f)
    return [SupplierItem(**item) for item in data]

def calculate_supplier_score(
    supplier: SupplierItem,
    req: BuyerRequirement,
    distance_km: float,
    min_price: float,
    max_price: float,
    max_dist: float,
    weights: MatchWeights
) -> tuple[float, dict[str, float]]:
    """
    Compute normalized multi-criteria sub-scores and composite score [0 - 100].
    """
    # 1. Price fit score (Lower is better)
    if max_price > min_price:
        price_fit = 100.0 * (max_price - supplier.price_per_kg) / (max_price - min_price)
    else:
        price_fit = 100.0
    price_fit = max(0.0, min(100.0, price_fit))
    
    # 2. Distance fit score (Closer is better)
    effective_max_dist = max(max_dist, 50.0)
    distance_fit = 100.0 * max(0.0, 1.0 - (distance_km / effective_max_dist))
    distance_fit = max(0.0, min(100.0, distance_fit))
    
    # 3. Quantity fit score (Suppliers with higher volume are prioritized to minimize fragmentation)
    qty_fit = 100.0 * min(1.0, supplier.available_quantity_kg / req.required_quantity_kg)
    
    # 4. Quality score
    quality_fit = QUALITY_GRADE_SCORES.get(supplier.quality_grade.upper(), 50.0)
    
    # 5. Reliability score
    rel_fit = supplier.reliability_score * 100.0
    
    # 6. Freshness & Wastage risk score
    # High score for low freshness_days and low wastage_risk_score
    freshness_sub = max(0.0, 100.0 * (1.0 - (supplier.freshness_days / 7.0)))
    wastage_sub = max(0.0, 100.0 * (1.0 - supplier.wastage_risk_score))
    freshness_fit = (0.5 * freshness_sub) + (0.5 * wastage_sub)
    
    # Composite weighted score
    w_sum = (
        weights.price_fit + weights.distance_fit + weights.quantity_fit +
        weights.quality_fit + weights.reliability + weights.freshness
    )
    if w_sum <= 0:
        w_sum = 1.0
        
    composite = (
        (weights.price_fit * price_fit) +
        (weights.distance_fit * distance_fit) +
        (weights.quantity_fit * qty_fit) +
        (weights.quality_fit * quality_fit) +
        (weights.reliability * rel_fit) +
        (weights.freshness * freshness_fit)
    ) / w_sum
    
    breakdown = {
        "price_fit": round(price_fit, 1),
        "distance_fit": round(distance_fit, 1),
        "quantity_fit": round(qty_fit, 1),
        "quality_fit": round(quality_fit, 1),
        "reliability": round(rel_fit, 1),
        "freshness": round(freshness_fit, 1)
    }
    
    return round(composite, 2), breakdown

def match_suppliers(
    requirement: BuyerRequirement,
    candidate_suppliers: Optional[List[SupplierItem]] = None,
    weights: Optional[MatchWeights] = None
) -> MatchSuppliersResponse:
    """
    Execute end-to-end matching:
    1. Filter out non-matching product, sub-par quality, zero inventory, or over-budget.
    2. Score candidates with weighted criteria.
    3. Rank candidates.
    4. Iteratively allocate procurement quantities.
    5. Generate transparent decision explanations.
    """
    scoring_weights = weights or DEFAULT_WEIGHTS
    all_suppliers = candidate_suppliers if candidate_suppliers is not None else load_seed_suppliers()
    
    req_product = requirement.product.strip().title()
    min_quality_rank = QUALITY_GRADE_RANKS.get(requirement.minimum_quality.upper(), 1)
    
    # 1. Filter incompatible suppliers
    compatible = []
    discarded_count = 0
    
    for s in all_suppliers:
        # Check product
        if s.product.strip().title() != req_product:
            discarded_count += 1
            continue
        # Check available quantity
        if s.available_quantity_kg <= 0:
            discarded_count += 1
            continue
        # Check quality threshold
        supp_rank = QUALITY_GRADE_RANKS.get(s.quality_grade.upper(), 0)
        if supp_rank < min_quality_rank:
            discarded_count += 1
            continue
        # Check budget constraint if provided
        if requirement.max_budget_per_kg and s.price_per_kg > requirement.max_budget_per_kg:
            discarded_count += 1
            continue
            
        compatible.append(s)
        
    if not compatible:
        return MatchSuppliersResponse(
            product=req_product,
            required_quantity_kg=requirement.required_quantity_kg,
            total_allocated_quantity_kg=0.0,
            fulfillment_percentage=0.0,
            unfulfilled_quantity_kg=requirement.required_quantity_kg,
            is_fully_fulfilled=False,
            average_procurement_price_per_kg=0.0,
            total_procurement_cost_inr=0.0,
            selected_suppliers=[],
            discarded_suppliers_count=discarded_count,
            matching_summary=f"No compatible suppliers found for {req_product} meeting quality {requirement.minimum_quality}."
        )
        
    # Pre-calculate distances and price spreads
    dist_map = {}
    for s in compatible:
        d = road_distance_km(
            requirement.buyer_location.latitude, requirement.buyer_location.longitude,
            s.latitude, s.longitude,
            circuity_factor=settings.ROAD_CIRCUITY_FACTOR
        )
        dist_map[s.supplier_id] = d
        
    min_p = min(s.price_per_kg for s in compatible)
    max_p = max(s.price_per_kg for s in compatible)
    avg_p = sum(s.price_per_kg for s in compatible) / len(compatible)
    max_d = max(dist_map.values()) if dist_map else 50.0
    
    # 2. Score suppliers
    scored_suppliers = []
    for s in compatible:
        d = dist_map[s.supplier_id]
        score, breakdown = calculate_supplier_score(
            supplier=s,
            req=requirement,
            distance_km=d,
            min_price=min_p,
            max_price=max_p,
            max_dist=max_d,
            weights=scoring_weights
        )
        reasons = generate_allocation_reasons(
            score_breakdown=breakdown,
            distance_km=d,
            price_per_kg=s.price_per_kg,
            benchmark_price=avg_p,
            quality_grade=s.quality_grade,
            reliability_score=s.reliability_score,
            freshness_days=s.freshness_days
        )
        scored_suppliers.append({
            "supplier": s,
            "score": score,
            "breakdown": breakdown,
            "distance_km": d,
            "reasons": reasons
        })
        
    # 3. Rank suppliers by descending score
    scored_suppliers.sort(key=lambda x: x["score"], reverse=True)
    
    # 4. Iterative allocation
    remaining = requirement.required_quantity_kg
    selected: List[SupplierMatchAllocation] = []
    total_cost = 0.0
    
    for item in scored_suppliers:
        if remaining <= 0:
            break
            
        s: SupplierItem = item["supplier"]
        alloc_qty = min(remaining, s.available_quantity_kg)
        if alloc_qty <= 0:
            continue
            
        item_cost = round(alloc_qty * s.price_per_kg, 2)
        total_cost += item_cost
        remaining -= alloc_qty
        
        selected.append(SupplierMatchAllocation(
            supplier_id=s.supplier_id,
            name=s.name,
            supplier_type=s.supplier_type,
            allocated_quantity_kg=alloc_qty,
            available_quantity_kg=s.available_quantity_kg,
            price_per_kg=s.price_per_kg,
            total_cost_inr=item_cost,
            latitude=s.latitude,
            longitude=s.longitude,
            distance_km=item["distance_km"],
            quality_grade=s.quality_grade,
            score=item["score"],
            score_breakdown=item["breakdown"],
            reasons=item["reasons"]
        ))
        
    total_allocated = sum(x.allocated_quantity_kg for x in selected)
    fulfillment_pct = round((total_allocated / requirement.required_quantity_kg) * 100.0, 2)
    unfulfilled = max(0.0, round(requirement.required_quantity_kg - total_allocated, 2))
    avg_price = round(total_cost / total_allocated, 2) if total_allocated > 0 else 0.0
    
    summary = (
        f"Matched {len(selected)} suppliers for {req_product}. "
        f"Fulfillment: {fulfillment_pct}% ({total_allocated:,.0f} / {requirement.required_quantity_kg:,.0f} kg). "
        f"Avg Price: ₹{avg_price}/kg."
    )
    
    return MatchSuppliersResponse(
        product=req_product,
        required_quantity_kg=requirement.required_quantity_kg,
        total_allocated_quantity_kg=total_allocated,
        fulfillment_percentage=fulfillment_pct,
        unfulfilled_quantity_kg=unfulfilled,
        is_fully_fulfilled=(unfulfilled == 0.0),
        average_procurement_price_per_kg=avg_price,
        total_procurement_cost_inr=round(total_cost, 2),
        selected_suppliers=selected,
        discarded_suppliers_count=discarded_count,
        matching_summary=summary
    )
