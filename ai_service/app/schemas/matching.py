from typing import List, Optional, Dict
from pydantic import BaseModel, Field
from ai_service.app.schemas.common import Coordinates

class SupplierItem(BaseModel):
    supplier_id: str = Field(..., description="Unique identifier for the supplier/farmer/FPO", examples=["FPO-PAT-01"])
    name: str = Field(..., description="Farmer or FPO entity name", examples=["Kisan Vikas Samiti FPO"])
    supplier_type: str = Field("FPO", description="'Farmer' or 'FPO'", examples=["FPO"])
    product: str = Field(..., description="Commodity offered", examples=["Tomato"])
    available_quantity_kg: float = Field(..., description="Stock quantity in kg", ge=0, examples=[3500.0])
    price_per_kg: float = Field(..., description="Asking price in INR per kg", ge=0, examples=[32.0])
    latitude: float = Field(..., ge=-90.0, le=90.0, examples=[25.6100])
    longitude: float = Field(..., ge=-180.0, le=180.0, examples=[85.0500])
    quality_grade: str = Field("A", description="Quality grade ('A', 'B', or 'C')", examples=["A"])
    reliability_score: float = Field(0.9, description="Reliability metric [0.0 - 1.0]", ge=0.0, le=1.0, examples=[0.92])
    freshness_days: int = Field(1, description="Days since harvest", ge=0, examples=[1])
    wastage_risk_score: float = Field(0.1, description="Estimated spoilage risk [0.0 - 1.0]", ge=0.0, le=1.0, examples=[0.08])

class BuyerRequirement(BaseModel):
    product: str = Field(..., description="Required commodity", examples=["Tomato"])
    required_quantity_kg: float = Field(..., description="Quantity required in kg", gt=0, examples=[10000.0])
    region: str = Field(..., description="Destination region", examples=["Patna"])
    buyer_location: Coordinates = Field(
        default=Coordinates(latitude=25.5941, longitude=85.1376),
        description="Buyer destination / warehouse coordinates"
    )
    required_by: Optional[str] = Field(None, description="Delivery date target (YYYY-MM-DD)")
    minimum_quality: str = Field("B", description="Minimum acceptable quality ('A', 'B', 'C')", examples=["B"])
    max_budget_per_kg: Optional[float] = Field(None, description="Optional upper price cap per kg")

class MatchWeights(BaseModel):
    price_fit: float = Field(0.25, ge=0.0, le=1.0)
    distance_fit: float = Field(0.20, ge=0.0, le=1.0)
    quantity_fit: float = Field(0.20, ge=0.0, le=1.0)
    quality_fit: float = Field(0.15, ge=0.0, le=1.0)
    reliability: float = Field(0.10, ge=0.0, le=1.0)
    freshness: float = Field(0.10, ge=0.0, le=1.0)

class MatchSuppliersRequest(BaseModel):
    requirement: BuyerRequirement
    custom_suppliers: Optional[List[SupplierItem]] = Field(
        None,
        description="Optional list of supplier records. If omitted, uses seeded Patna regional inventory."
    )
    weights: Optional[MatchWeights] = Field(
        default=None,
        description="Optional custom weights for scoring criteria (defaults to standard weights summing to 1.0)"
    )

class SupplierMatchAllocation(BaseModel):
    supplier_id: str
    name: str
    supplier_type: str
    allocated_quantity_kg: float
    available_quantity_kg: float
    price_per_kg: float
    total_cost_inr: float
    latitude: float
    longitude: float
    distance_km: float
    quality_grade: str
    score: float
    score_breakdown: Dict[str, float]
    reasons: List[str]

class MatchSuppliersResponse(BaseModel):
    product: str
    required_quantity_kg: float
    total_allocated_quantity_kg: float
    fulfillment_percentage: float
    unfulfilled_quantity_kg: float
    is_fully_fulfilled: bool
    average_procurement_price_per_kg: float
    total_procurement_cost_inr: float
    selected_suppliers: List[SupplierMatchAllocation]
    discarded_suppliers_count: int
    matching_summary: str
