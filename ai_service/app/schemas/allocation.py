from typing import List, Optional
from pydantic import BaseModel, Field

class SupplierCandidate(BaseModel):
    supplier_id: str = Field(..., description="Unique supplier identifier")
    name: str = Field(..., description="Supplier / farm name")
    supplier_type: str = Field("Farmer", description="Farmer or FPO")
    available_quantity_kg: float = Field(..., description="Available quantity in kg", ge=0)
    price_per_kg: float = Field(..., description="Asking price in INR per kg", ge=0)
    quality_grade: str = Field("A", description="Quality grade: A, B, or C")
    latitude: Optional[float] = Field(None, description="Supplier latitude")
    longitude: Optional[float] = Field(None, description="Supplier longitude")
    reliability_score: float = Field(0.85, description="Reliability score [0.0 - 1.0]")
    freshness_days: int = Field(1, description="Days since harvest", ge=0)
    shelf_life_days: int = Field(7, description="Product shelf life in days", ge=1)

class DestinationLocation(BaseModel):
    latitude: float = Field(..., description="Destination latitude")
    longitude: float = Field(..., description="Destination longitude")
    name: Optional[str] = Field("Destination Mart", description="Destination location name")

class AllocationRequest(BaseModel):
    product_id: Optional[str] = Field(None, description="Product ID")
    product_name: str = Field("Aloo", description="Product name")
    demand_quantity_kg: float = Field(..., description="Requested quantity in kg", gt=0)
    max_price_per_kg: Optional[float] = Field(None, description="Maximum budget price per kg")
    quality_requirement: str = Field("B", description="Minimum acceptable quality grade (A, B, or C)")
    destination: Optional[DestinationLocation] = None
    required_by: Optional[str] = Field(None, description="Delivery deadline date")
    candidates: List[SupplierCandidate] = Field(..., description="List of available suppliers")

class AllocatedSupplierItem(BaseModel):
    supplier_id: str
    name: str
    allocated_quantity_kg: float
    price_per_kg: float
    product_cost_inr: float
    quality_grade: str
    distance_km: float = 0.0

class AllocationProposal(BaseModel):
    rank: int
    suppliers: List[AllocatedSupplierItem]
    allocated_quantity_kg: float
    unfulfilled_quantity_kg: float
    product_cost_inr: float
    logistics_cost_inr: float = 0.0
    wastage_cost_inr: float = 0.0
    lateness_penalty_inr: float = 0.0
    total_landed_cost_inr: float
    savings_vs_cheapest_single_supplier_inr: float = 0.0
    optimization_status: str = "OPTIMAL"  # OPTIMAL, FEASIBLE, PARTIAL
    explanation: str

class AllocationResponse(BaseModel):
    product_name: str
    demand_quantity_kg: float
    allocated_quantity_kg: float
    unfulfilled_quantity_kg: float
    is_fully_fulfilled: bool
    proposals: List[AllocationProposal]
    best_proposal: Optional[AllocationProposal] = None
