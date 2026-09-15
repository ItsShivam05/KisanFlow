"""
Smart Demand Allocation / Intelligent Procurement Optimizer.

Solves multi-supplier demand fulfillment to achieve MINIMUM TOTAL LANDED COST
with partial quantity allocations, quality constraints, and top-K ranked alternatives.
"""

import itertools
from typing import List, Optional
from ai_service.app.schemas.allocation import (
    AllocationRequest, AllocationResponse, AllocationProposal,
    AllocatedSupplierItem, SupplierCandidate
)
from ai_service.app.utils.geo import road_distance_km

QUALITY_GRADE_RANKS = {"A": 3, "B": 2, "C": 1}

def solve_demand_allocation(request: AllocationRequest, top_k: int = 3) -> AllocationResponse:
    """
    Find optimal multi-supplier allocation proposals ranked by Total Landed Cost.
    """
    req_qty = float(request.demand_quantity_kg)
    min_quality_rank = QUALITY_GRADE_RANKS.get(request.quality_requirement.upper(), 1)

    # 1. Filter eligible candidates
    eligible: List[SupplierCandidate] = []
    for c in request.candidates:
        if c.available_quantity_kg <= 0:
            continue
        c_rank = QUALITY_GRADE_RANKS.get(c.quality_grade.upper(), 0)
        if c_rank < min_quality_rank:
            continue
        if request.max_price_per_kg and c.price_per_kg > request.max_price_per_kg:
            continue
        eligible.append(c)

    if not eligible:
        empty_proposal = AllocationProposal(
            rank=1,
            suppliers=[],
            allocated_quantity_kg=0.0,
            unfulfilled_quantity_kg=req_qty,
            product_cost_inr=0.0,
            logistics_cost_inr=0.0,
            wastage_cost_inr=0.0,
            lateness_penalty_inr=0.0,
            total_landed_cost_inr=0.0,
            savings_vs_cheapest_single_supplier_inr=0.0,
            optimization_status="UNFULFILLED",
            explanation=f"No eligible suppliers found meeting quality '{request.quality_requirement}'."
        )
        return AllocationResponse(
            product_name=request.product_name,
            demand_quantity_kg=req_qty,
            allocated_quantity_kg=0.0,
            unfulfilled_quantity_kg=req_qty,
            is_fully_fulfilled=False,
            proposals=[empty_proposal],
            best_proposal=empty_proposal
        )

    # Calculate distance for each supplier if destination is provided
    dist_map = {}
    for c in eligible:
        if request.destination and c.latitude is not None and c.longitude is not None:
            dist = road_distance_km(
                request.destination.latitude, request.destination.longitude,
                c.latitude, c.longitude
            )
        else:
            dist = 0.0
        dist_map[c.supplier_id] = dist

    # Calculate single-supplier cost baseline for savings computation
    single_supplier_baseline_cost = None
    for c in eligible:
        if c.available_quantity_kg >= req_qty:
            cost = req_qty * c.price_per_kg
            if single_supplier_baseline_cost is None or cost < single_supplier_baseline_cost:
                single_supplier_baseline_cost = cost

    # Sort eligible suppliers by price per kg ascending
    eligible_sorted = sorted(eligible, key=lambda x: (x.price_per_kg, dist_map[x.supplier_id]))

    # Evaluate feasible allocations (greedy + subset combination evaluation for top-K)
    raw_proposals = []

    # Combination Strategy A: Greedy greedy selection (cheapest suppliers first)
    def compute_proposal_for_subset(suppliers_sub: List[SupplierCandidate]) -> Optional[dict]:
        rem = req_qty
        items = []
        prod_cost = 0.0
        logistics_cost = 0.0
        wastage_cost = 0.0

        for s in suppliers_sub:
            if rem <= 0:
                break
            take_qty = min(rem, s.available_quantity_kg)
            if take_qty <= 0:
                continue
            item_prod_cost = take_qty * s.price_per_kg
            d = dist_map[s.supplier_id]
            item_logistics = (d * 2.0) if d > 0 else 0.0  # ₹2/km estimated logistics
            item_wastage = (s.freshness_days / max(1, s.shelf_life_days)) * item_prod_cost * 0.02

            prod_cost += item_prod_cost
            logistics_cost += item_logistics
            wastage_cost += item_wastage
            rem -= take_qty

            items.append(AllocatedSupplierItem(
                supplier_id=s.supplier_id,
                name=s.name,
                allocated_quantity_kg=round(take_qty, 2),
                price_per_kg=s.price_per_kg,
                product_cost_inr=round(item_prod_cost, 2),
                quality_grade=s.quality_grade,
                distance_km=round(d, 2)
            ))

        total_allocated = req_qty - rem
        total_landed = prod_cost + logistics_cost + wastage_cost

        if total_allocated <= 0:
            return None

        # Key for deduplication
        key = tuple(sorted((it.supplier_id, it.allocated_quantity_kg) for it in items))
        return {
            "key": key,
            "items": items,
            "total_allocated": total_allocated,
            "unfulfilled": max(0.0, req_qty - total_allocated),
            "product_cost": round(prod_cost, 2),
            "logistics_cost": round(logistics_cost, 2),
            "wastage_cost": round(wastage_cost, 2),
            "total_landed_cost": round(total_landed, 2),
            "supplier_count": len(items)
        }

    # Evaluate subsets up to size 6 for small N or top candidates
    evaluated_keys = set()
    candidate_subsets = []

    # 1. Greedy order
    candidate_subsets.append(eligible_sorted)

    # 2. Individual single suppliers capable of supplying substantial amount
    for s in eligible:
        candidate_subsets.append([s] + [x for x in eligible_sorted if x.supplier_id != s.supplier_id])

    # 3. Combinations of suppliers
    max_comb_len = min(len(eligible_sorted), 6)
    for r in range(1, max_comb_len + 1):
        for combo in itertools.combinations(eligible_sorted, r):
            candidate_subsets.append(list(combo))

    for sub in candidate_subsets:
        prop_data = compute_proposal_for_subset(sub)
        if prop_data and prop_data["key"] not in evaluated_keys:
            evaluated_keys.add(prop_data["key"])
            raw_proposals.append(prop_data)

    # Sort proposals: Prioritize maximum quantity fulfillment (lowest unfulfilled), then lowest total landed cost, then fewer suppliers
    raw_proposals.sort(key=lambda x: (
        x["unfulfilled"],
        x["total_landed_cost"],
        x["product_cost"],
        x["supplier_count"]
    ))

    top_proposals_data = raw_proposals[:top_k]

    # Build final response proposals
    final_proposals: List[AllocationProposal] = []
    
    # Identify single supplier benchmark cost for comparison
    single_supplier_cost = single_supplier_baseline_cost or (
        max(p["total_landed_cost"] for p in raw_proposals) if raw_proposals else 0.0
    )

    for idx, prop in enumerate(top_proposals_data, start=1):
        savings = max(0.0, round(single_supplier_cost - prop["product_cost"], 2)) if single_supplier_baseline_cost else 0.0

        # Generate human-readable explanation
        supp_names = [it.name for it in prop["items"]]
        if len(supp_names) == 1:
            explanation = f"Single supplier ({supp_names[0]}) fulfills {prop['total_allocated']} kg at ₹{prop['product_cost']}."
        else:
            cheapest_single_name = next((c.name for c in eligible if c.available_quantity_kg >= req_qty), "a single supplier")
            if savings > 0:
                explanation = (
                    f"Best option selected because {len(supp_names)} nearby suppliers together "
                    f"can fulfill {prop['total_allocated']} kg at ₹{prop['product_cost']:,.0f}, "
                    f"which is ₹{savings:,.0f} cheaper than buying full {req_qty:,.0f} kg from {cheapest_single_name}."
                )
            else:
                explanation = (
                    f"Optimized allocation across {len(supp_names)} suppliers "
                    f"({', '.join(supp_names)}) fulfilling {prop['total_allocated']} kg at ₹{prop['product_cost']:,.0f}."
                )

        status = "OPTIMAL" if prop["unfulfilled"] == 0 else "PARTIAL_FULFILLMENT"

        final_proposals.append(AllocationProposal(
            rank=idx,
            suppliers=prop["items"],
            allocated_quantity_kg=prop["total_allocated"],
            unfulfilled_quantity_kg=prop["unfulfilled"],
            product_cost_inr=prop["product_cost"],
            logistics_cost_inr=prop["logistics_cost"],
            wastage_cost_inr=prop["wastage_cost"],
            lateness_penalty_inr=0.0,
            total_landed_cost_inr=prop["total_landed_cost"],
            savings_vs_cheapest_single_supplier_inr=savings,
            optimization_status=status,
            explanation=explanation
        ))

    best = final_proposals[0] if final_proposals else None
    return AllocationResponse(
        product_name=request.product_name,
        demand_quantity_kg=req_qty,
        allocated_quantity_kg=best.allocated_quantity_kg if best else 0.0,
        unfulfilled_quantity_kg=best.unfulfilled_quantity_kg if best else req_qty,
        is_fully_fulfilled=(best.unfulfilled_quantity_kg == 0) if best else False,
        proposals=final_proposals,
        best_proposal=best
    )
