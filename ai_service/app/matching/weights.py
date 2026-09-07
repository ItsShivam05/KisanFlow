"""
Supplier Matching Criteria Weights and Reason Generator (Issue #9).
"""

from typing import Dict, List
from ai_service.app.schemas.matching import MatchWeights

DEFAULT_WEIGHTS = MatchWeights(
    price_fit=0.25,
    distance_fit=0.20,
    quantity_fit=0.20,
    quality_fit=0.15,
    reliability=0.10,
    freshness=0.10
)

QUALITY_GRADE_SCORES = {
    "A": 100.0,
    "B": 75.0,
    "C": 50.0
}

QUALITY_GRADE_RANKS = {
    "A": 3,
    "B": 2,
    "C": 1
}

def generate_allocation_reasons(
    score_breakdown: Dict[str, float],
    distance_km: float,
    price_per_kg: float,
    benchmark_price: float,
    quality_grade: str,
    reliability_score: float,
    freshness_days: int
) -> List[str]:
    """Generate human-readable, transparent reasoning tags for selection."""
    reasons = []
    
    if price_per_kg <= benchmark_price * 0.95:
        reasons.append(f"Favorable price fit (₹{price_per_kg:.2f}/kg vs avg ₹{benchmark_price:.2f}/kg)")
    elif price_per_kg <= benchmark_price:
        reasons.append(f"Fair market price (₹{price_per_kg:.2f}/kg)")
        
    if distance_km <= 20.0:
        reasons.append(f"Close proximity hub ({distance_km:.1f} km)")
    elif distance_km <= 45.0:
        reasons.append(f"Accessible regional distance ({distance_km:.1f} km)")
        
    if quality_grade == "A":
        reasons.append("Grade A superior agricultural quality")
    elif quality_grade == "B":
        reasons.append("Standard Grade B commercial grade")
        
    if reliability_score >= 0.88:
        reasons.append(f"High historical reliability rating ({int(reliability_score * 100)}%)")
        
    if freshness_days <= 1:
        reasons.append("Farm-fresh inventory (harvested ≤ 24 hrs ago)")
    elif freshness_days <= 2:
        reasons.append(f"Fresh inventory ({freshness_days} days post-harvest)")
        
    if not reasons:
        reasons.append("Satisfies minimum order compliance criteria")
        
    return reasons
