"""
FastAPI Routes for 'What Should We Grow?' / Crop Planning Advisor.
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException

from ai_service.app.crop_planning.crop_data import (
    SUPPORTED_CROPS,
    SEASONS,
    CROP_DATA_DISCLAIMER,
)
from ai_service.app.crop_planning.crop_advisor import CropPlanningAdvisor
from ai_service.app.crop_planning.scenario_analyzer import SCENARIOS, run_scenario_analysis
from ai_service.app.pricing.price_data import JHARKHAND_MARKETS
from ai_service.app.schemas.crop_planning import (
    CropRecommendationRequest,
    CropRecommendationResponse,
    CropEvaluationItem,
    DiversificationPlan,
    DiversificationAllocation,
    ExplainabilitySummary,
    ScenarioAnalysisRequest,
    ScenarioAnalysisResponse,
    ScenarioDetail,
    ScenarioRankingItem,
    CropMetadataItem,
)
from ai_service.app.utils.logger import logger

router = APIRouter(tags=["Crop Planning & Advisory"])

_ADVISOR: Optional[CropPlanningAdvisor] = None


def get_advisor() -> CropPlanningAdvisor:
    global _ADVISOR
    if _ADVISOR is None:
        _ADVISOR = CropPlanningAdvisor()
    return _ADVISOR


@router.get("/crop-planning/crops", response_model=List[CropMetadataItem])
def get_supported_crops():
    """Returns metadata, yield baselines, and cultivation costs for all supported crops."""
    crops_list: List[CropMetadataItem] = []
    for crop_name, meta in SUPPORTED_CROPS.items():
        crops_list.append(CropMetadataItem(
            crop_name=crop_name,
            display_name=meta["display_name"],
            category=meta["category"],
            suitable_seasons=meta["suitable_seasons"],
            expected_yield_kg_per_acre=meta["expected_yield_kg_per_acre"],
            production_cost_per_acre=meta["production_cost_per_acre"],
            perishability_tier=meta["perishability_tier"],
            shelf_life_days=meta["shelf_life_days"],
            water_requirement=meta["water_requirement"],
            price_volatility_tier=meta["price_volatility_tier"],
            description=meta["description"],
        ))
    return crops_list


@router.get("/crop-planning/scenarios")
def get_scenarios_list():
    """Returns available 'What If?' scenario definitions."""
    return {
        "scenarios": [
            {
                "key": k,
                "name": v["name"],
                "description": v["description"],
                "icon": v["icon"],
            }
            for k, v in SCENARIOS.items()
        ]
    }


@router.post("/crop-recommendation", response_model=CropRecommendationResponse)
def get_crop_recommendation(request: CropRecommendationRequest):
    """
    Generates intelligent crop planning recommendations for a farmer in Jharkhand:
    - Expected Net Return after cultivation, transport, and spoilage deductions.
    - Risk-adjusted multi-criteria ranking.
    - Portfolio acreage diversification plan.
    - Transparent 'Why X? Why not Y?' explainability.
    """
    region = request.region.strip().title()
    season = request.season.strip().title()

    if region not in JHARKHAND_MARKETS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported Jharkhand region '{region}'. Available: {list(JHARKHAND_MARKETS.keys())}"
        )
    if season not in SEASONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported season '{season}'. Available: {SEASONS}"
        )

    advisor = get_advisor()
    try:
        evaluations = advisor.evaluate_all_crops(
            region=region,
            land_area_acres=request.land_area_acres,
            season=season,
            irrigation=request.irrigation,
            distance_to_market_km=request.distance_to_market_km or 25.0,
            farmer_budget=request.farmer_budget,
            soil_type=request.soil_type,
        )

        top_crop = evaluations[0]
        diversification = advisor.generate_diversification_plan(
            ranked_crops=evaluations,
            total_acres=request.land_area_acres,
            irrigation=request.irrigation,
            distance_km=request.distance_to_market_km or 25.0,
        )

        explainability = advisor.generate_explainability(
            top_crop=top_crop,
            ranked_crops=evaluations,
        )

        top_item = CropEvaluationItem(**top_crop)
        rec_items = [CropEvaluationItem(**it) for it in evaluations]
        div_allocs = [DiversificationAllocation(**a) for a in diversification["allocations"]]
        div_plan = DiversificationPlan(
            total_acres=diversification["total_acres"],
            is_diversified=diversification["is_diversified"],
            strategy=diversification["strategy"],
            allocations=div_allocs,
            portfolio_net_return=diversification["portfolio_net_return"],
            blended_net_return_per_acre=diversification["blended_net_return_per_acre"],
            rationale=diversification["rationale"],
        )
        expl_summary = ExplainabilitySummary(
            why_top_crop=explainability["why_top_crop"],
            why_not_alternatives=explainability["why_not_alternatives"],
        )

        return CropRecommendationResponse(
            region=region,
            season=season,
            land_area_acres=request.land_area_acres,
            irrigation=request.irrigation,
            scenario=request.scenario or "NORMAL",
            top_crop=top_item,
            recommendations=rec_items,
            diversification_plan=div_plan,
            explainability=expl_summary,
            scoring_weights_used=advisor.weights,
        )

    except Exception as exc:
        logger.error(f"Crop recommendation failure: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Crop planning failed: {str(exc)}")


@router.post("/crop-planning/scenarios", response_model=ScenarioAnalysisResponse)
def analyze_scenarios(request: ScenarioAnalysisRequest):
    """
    Evaluates farmer crop decisions across all 7 'What If?' scenarios simultaneously.
    """
    region = request.region.strip().title()
    season = request.season.strip().title()

    if region not in JHARKHAND_MARKETS or season not in SEASONS:
        raise HTTPException(status_code=400, detail="Invalid region or season parameters.")

    advisor = get_advisor()
    try:
        scenario_results = run_scenario_analysis(
            advisor=advisor,
            region=region,
            land_area_acres=request.land_area_acres,
            season=season,
            irrigation=request.irrigation,
            distance_km=request.distance_to_market_km or 25.0,
        )

        details: Dict[str, ScenarioDetail] = {}
        for s_key, s_data in scenario_results.items():
            rankings = [ScenarioRankingItem(**r) for r in s_data["rankings"]]
            details[s_key] = ScenarioDetail(
                scenario_key=s_data["scenario_key"],
                scenario_name=s_data["scenario_name"],
                description=s_data["description"],
                icon=s_data["icon"],
                top_crop=s_data["top_crop"],
                top_crop_net_per_acre=s_data["top_crop_net_per_acre"],
                top_crop_score=s_data["top_crop_score"],
                rankings=rankings,
            )

        return ScenarioAnalysisResponse(
            region=region,
            season=season,
            land_area_acres=request.land_area_acres,
            scenarios=details,
        )

    except Exception as exc:
        logger.error(f"Scenario analysis failure: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Scenario analysis failed: {str(exc)}")
