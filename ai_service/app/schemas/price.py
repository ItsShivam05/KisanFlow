from typing import Optional
from pydantic import BaseModel, Field

class PriceObservation(BaseModel):
    commodity: str = Field(..., description="Agricultural commodity name", examples=["Tomato"])
    region: str = Field(..., description="Mandi/market region", examples=["Patna"])
    market: str = Field("Patna Main Mandi", description="Specific local wholesale market")
    price_per_kg: float = Field(..., description="Estimated current wholesale market price in INR", examples=[35.5])
    timestamp: str = Field(..., description="Observation timestamp (ISO 8601)")
    source: str = Field(..., description="Data origin: 'gemini_ai_estimated' or 'simulated_market_signal'")
    confidence: float = Field(..., description="Confidence score [0.0 - 1.0]", ge=0.0, le=1.0)
    is_simulated: bool = Field(True, description="Always true for prototype/simulated market signals")
    unit: str = "INR/kg"

class PriceEstimateRequest(BaseModel):
    commodity: str = Field(..., description="Commodity name", examples=["Tomato"])
    region: str = Field(..., description="Region name", examples=["Patna"])
    historical_baseline_price: Optional[float] = Field(None, description="Optional baseline price for comparison", examples=[32.0])

class PriceEstimateResponse(BaseModel):
    observation: PriceObservation
    historical_baseline_price: Optional[float] = None
    price_deviation_inr: Optional[float] = None
    price_deviation_percent: Optional[float] = None
    market_alert: Optional[str] = None
    disclaimer: str = "Prototype market price signal. In production, connect directly to agmarknet / data.gov.in mandi API."
