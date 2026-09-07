from typing import List, Optional, Dict
from pydantic import BaseModel, Field

class ForecastRequest(BaseModel):
    product: str = Field(..., description="Agricultural commodity name", examples=["Tomato"])
    region: str = Field(..., description="Target consumption/mandi region", examples=["Patna"])
    horizon_days: int = Field(7, description="Forecast horizon in days (e.g., 7 or 14)", ge=1, le=30, examples=[7])

class DailyForecast(BaseModel):
    date: str = Field(..., description="Forecast date (YYYY-MM-DD)", examples=["2026-09-07"])
    predicted_demand_kg: float = Field(..., description="Forecasted demand quantity in kilograms", examples=[1400.0])
    lower_bound_kg: Optional[float] = Field(None, description="Lower prediction interval bound in kg")
    upper_bound_kg: Optional[float] = Field(None, description="Upper prediction interval bound in kg")
    day_of_week: Optional[str] = Field(None, description="Day of the week")

class ForecastResponse(BaseModel):
    product: str
    region: str
    horizon_days: int
    daily_forecast: List[DailyForecast]
    total_predicted_demand_kg: float
    model_version: str = "v1.0-xgboost-baseline"
    metrics: Optional[Dict[str, float]] = None

class ModelInfoResponse(BaseModel):
    model_name: str
    model_version: str
    target_variable: str
    supported_commodities: List[str]
    supported_regions: List[str]
    features: List[str]
    evaluation_metrics: Dict[str, float]
    trained_at: Optional[str]
