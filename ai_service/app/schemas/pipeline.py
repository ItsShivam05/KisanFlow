from typing import Optional
from pydantic import BaseModel, Field
from ai_service.app.schemas.forecast import ForecastResponse
from ai_service.app.schemas.matching import BuyerRequirement, MatchSuppliersResponse
from ai_service.app.schemas.routing import RouteOptimizeResponse
from ai_service.app.schemas.price import PriceEstimateResponse

class PipelineRunRequest(BaseModel):
    buyer_requirement: BuyerRequirement
    forecast_horizon_days: int = Field(7, ge=1, le=30, description="Forecast days horizon")
    vehicle_capacity_kg: Optional[float] = Field(5000.0, description="Vehicle capacity for route optimization")
    fleet_size: Optional[int] = Field(4, description="Available vehicles")

class PipelineRunResponse(BaseModel):
    pipeline_status: str
    commodity: str
    region: str
    forecast: ForecastResponse
    price_intelligence: PriceEstimateResponse
    matching: MatchSuppliersResponse
    routing: RouteOptimizeResponse
    executive_summary: str
