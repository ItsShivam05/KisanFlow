"""
Pydantic Schemas for Price Prediction, Model Metrics, and Farmer Profit Optimization.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

STANDARD_DISCLAIMER = (
    "The system estimates future prices and expected net realization to support more profitable "
    "selling decisions. Predicted prices and ranges are empirical estimates and do not constitute "
    "financial guarantees."
)


class PricePredictRequest(BaseModel):
    commodity: str = Field(..., examples=["Tomato"], description="Crop commodity name")
    region: str = Field(..., examples=["Ranchi"], description="Jharkhand target regional mandi")
    forecast_days: int = Field(7, ge=1, le=14, description="Forecast horizon in days (1, 3, or 7 recommended)")
    quantity_kg: Optional[float] = Field(1000.0, gt=0, description="Farmer harvest volume in kg")
    farmer_location: Optional[str] = Field(None, examples=["Hazaribagh"], description="Farmer origin or district")


class DailyPriceForecast(BaseModel):
    horizon_day: int
    date: str
    predicted_price: float
    lower_estimate: float
    upper_estimate: float
    price_change_vs_current: float


class PricePredictResponse(BaseModel):
    commodity: str
    region: str
    current_price: float
    forecast_days: int
    model: str = "XGBoost Regressor"
    predictions: List[DailyPriceForecast]
    explainability_factors: List[str]
    recommendation: str
    optimal_wait_days: int
    expected_net_gain_per_kg: float
    recommended_net_realization: float
    decision_rationale: str
    assumptions: List[str]
    disclaimer: str = STANDARD_DISCLAIMER


class FarmerProfitRecommendationRequest(BaseModel):
    commodity: str = Field(..., examples=["Tomato"])
    quantity_kg: float = Field(..., gt=0, examples=[1000.0])
    farmer_location: str = Field(..., examples=["Hazaribagh"], description="Farmer origin mandi or district")
    current_price: Optional[float] = Field(None, description="Optional current spot price override")
    candidate_markets: Optional[List[str]] = Field(None, description="Optional subset of markets to compare")


class MarketRecommendationItem(BaseModel):
    market: str
    mandi_name: str
    distance_km: float
    predicted_price: float
    transport_cost_per_kg: float
    handling_and_holding_per_kg: float
    expected_net_realization: float
    total_expected_net_profit: float
    consumer_affordability_alert: bool
    recommended: bool


class FarmerProfitRecommendationResponse(BaseModel):
    commodity: str
    quantity_kg: float
    farmer_location: str
    recommendations: List[MarketRecommendationItem]
    top_recommended_market: str
    max_net_realization: float
    disclaimer: str = STANDARD_DISCLAIMER


class MarketAllocationRequest(BaseModel):
    commodity: str = Field(..., examples=["Tomato"])
    quantity_kg: float = Field(..., gt=0, examples=[5000.0])
    farmer_location: str = Field(..., examples=["Ranchi"])
    max_single_market_share: Optional[float] = Field(0.50, ge=0.20, le=1.0)



class MarketAllocationItem(BaseModel):
    market: str
    allocated_quantity_kg: float
    allocation_pct: float
    expected_net_realization: float
    projected_net_revenue: float
    reason: str


class MarketAllocationResponse(BaseModel):
    commodity: str
    total_quantity_kg: float
    allocations: List[MarketAllocationItem]
    total_projected_net_profit: float
    disclaimer: str = STANDARD_DISCLAIMER


class JharkhandMarketInfo(BaseModel):
    id: str
    name: str
    latitude: float
    longitude: float
    market_type: str
    mandi_name: str
    district: str
    avg_daily_capacity_tonnes: float


class ModelMetricsResponse(BaseModel):
    model_name: str
    evaluated_on: str
    supported_commodities: List[str]
    supported_markets: List[str]
    overall_metrics: Dict[str, Any]
    baseline_comparison: Dict[str, Any]
    disclaimer: str = STANDARD_DISCLAIMER
