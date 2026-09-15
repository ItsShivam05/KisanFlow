"""
Pydantic Schemas for 'What Should We Grow?' / Crop Planning Advisor.
"""

from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field
from ai_service.app.crop_planning.crop_data import CROP_DATA_DISCLAIMER

STANDARD_PLANNING_DISCLAIMER = (
    "The KisanFlow Crop Planning Advisor is a decision-support tool providing model-based estimates "
    "of expected revenues, costs, and market risks. Projections are based on current forecasts and prototype "
    "agronomic parameters. They do not constitute financial or harvest guarantees."
)


class CropRecommendationRequest(BaseModel):
    region: str = Field(..., examples=["Ranchi"], description="Target market region or district in Jharkhand")
    land_area_acres: float = Field(..., gt=0, examples=[5.0], description="Total cultivable farm area in acres")
    season: str = Field("Rabi", examples=["Rabi"], description="Target agricultural season (Kharif, Rabi, Zaid)")
    irrigation: bool = Field(True, description="Whether assured irrigation is available on the land")
    soil_type: Optional[str] = Field(None, examples=["Loamy Red Soil"], description="Optional soil classification")
    farmer_budget: Optional[float] = Field(None, description="Optional available working capital budget in INR")
    distance_to_market_km: Optional[float] = Field(25.0, ge=1.0, description="Transit distance to regional APMC mandi")
    scenario: Optional[str] = Field("NORMAL", description="What-if simulation scenario key (NORMAL, HEAVY_RAINFALL, etc.)")


class CropEvaluationItem(BaseModel):
    rank: int
    crop: str
    display_name: str
    category: str
    is_seasonally_suited: bool
    predicted_price: float
    price_lower_bound: float
    price_upper_bound: float
    price_volatility_pct: float
    expected_yield_kg_per_acre: float
    total_yield_kg: float
    expected_revenue: float
    production_cost: float
    transport_cost: float
    holding_cost: float
    expected_wastage_cost: float
    expected_net_return: float
    net_return_per_acre: float
    benefit_cost_ratio: float
    expected_regional_demand_kg: float
    harvest_share_of_demand_pct: float
    market_condition: str
    perishability_tier: str
    shelf_life_days: int
    risk_level: str
    risk: Optional[str] = None
    suitability: str
    estimated_cost: Optional[float] = None
    expected_demand: Optional[float] = None
    score: float
    scores: Dict[str, float]


class DiversificationAllocation(BaseModel):
    crop: str
    acres: float
    fraction_pct: float
    expected_yield_kg: float
    expected_revenue: float
    production_cost: float
    expected_net_return: float
    risk_level: str


class DiversificationPlan(BaseModel):
    total_acres: float
    is_diversified: bool
    strategy: str
    allocations: List[DiversificationAllocation]
    portfolio_net_return: float
    blended_net_return_per_acre: float
    rationale: str


class ExplainabilitySummary(BaseModel):
    why_top_crop: List[str]
    why_not_alternatives: List[Dict[str, Any]]


class CropRecommendationResponse(BaseModel):
    region: str
    season: str
    land_area_acres: float
    irrigation: bool
    scenario: str
    top_crop: CropEvaluationItem
    recommendations: List[CropEvaluationItem]
    diversification_plan: DiversificationPlan
    explainability: ExplainabilitySummary
    scoring_weights_used: Dict[str, float]
    disclaimer: str = STANDARD_PLANNING_DISCLAIMER


class ScenarioAnalysisRequest(BaseModel):
    region: str = Field(..., examples=["Ranchi"])
    land_area_acres: float = Field(..., gt=0, examples=[5.0])
    season: str = Field("Rabi", examples=["Rabi"])
    irrigation: bool = Field(True)
    distance_to_market_km: Optional[float] = Field(25.0)


class ScenarioRankingItem(BaseModel):
    rank: int
    crop: str
    price: float
    net_per_acre: float
    score: float


class ScenarioDetail(BaseModel):
    scenario_key: str
    scenario_name: str
    description: str
    icon: str
    top_crop: str
    top_crop_net_per_acre: float
    top_crop_score: float
    rankings: List[ScenarioRankingItem]


class ScenarioAnalysisResponse(BaseModel):
    region: str
    season: str
    land_area_acres: float
    scenarios: Dict[str, ScenarioDetail]
    disclaimer: str = STANDARD_PLANNING_DISCLAIMER


class CropMetadataItem(BaseModel):
    crop_name: str
    display_name: str
    category: str
    suitable_seasons: List[str]
    expected_yield_kg_per_acre: float
    production_cost_per_acre: float
    perishability_tier: str
    shelf_life_days: int
    water_requirement: str
    price_volatility_tier: str
    description: str
