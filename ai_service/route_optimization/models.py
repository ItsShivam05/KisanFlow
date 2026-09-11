"""
Data models for the farm-to-buyer route optimization sub-module.
Supports both Pydantic validation and seamless conversion to/from standard dicts.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field, model_validator


class Location(BaseModel):
    """Geographic point representing a depot, supplier, or buyer."""
    id: str = Field(..., description="Unique entity identifier", examples=["L001"])
    name: str = Field(..., description="Entity name or label", examples=["Amritsar Central Hub"])
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Latitude in decimal degrees", examples=[31.6300])
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Longitude in decimal degrees", examples=[74.8500])


class Supplier(Location):
    """Agricultural supplier/farmer/FPO offering stock."""
    available_quantity_kg: float = Field(..., ge=0.0, description="Available crop quantity in kg", examples=[800.0])


class Buyer(Location):
    """Destination buyer requiring agricultural cargo."""
    required_quantity_kg: float = Field(..., gt=0.0, description="Required crop quantity in kg", examples=[2000.0])
    delivery_deadline: Optional[Union[str, datetime]] = Field(
        None,
        description="Delivery deadline (ISO timestamp '2026-09-07T16:00:00' or time string '4:00 PM')"
    )


class Vehicle(BaseModel):
    """Transport vehicle specifications."""
    id: str = Field("V001", description="Unique vehicle identifier", examples=["V001"])
    capacity_kg: float = Field(..., gt=0.0, description="Vehicle maximum cargo payload in kg", examples=[2500.0])
    cost_per_km: float = Field(20.0, ge=0.0, description="Transportation cost per kilometer in currency units (INR)", examples=[20.0])
    average_speed_kmph: float = Field(40.0, gt=0.0, description="Average road transit speed in km/h", examples=[40.0])


class Depot(Location):
    """Depot/origin location where vehicles are stationed."""
    id: str = Field("D001", description="Depot identifier")
    name: str = Field("Depot Hub", description="Depot name")


class RouteRequest(BaseModel):
    """
    Public request schema for farm-to-buyer route optimization.
    Accepts single 'vehicle' or list of 'vehicles', with optional 'depot'.
    """
    buyer: Buyer
    suppliers: List[Supplier] = Field(..., min_length=1, description="List of pre-selected suppliers")
    vehicle: Optional[Vehicle] = Field(None, description="Single vehicle (convenience field)")
    vehicles: Optional[List[Vehicle]] = Field(None, description="Fleet of vehicles")
    depot: Optional[Location] = Field(None, description="Start depot location (defaults to initial hub)")
    departure_time: Optional[Union[str, datetime]] = Field(None, description="Planned route departure time")
    max_travel_time_hours: Optional[float] = Field(None, ge=0.0, description="Explicit maximum travel duration in hours")

    @model_validator(mode="after")
    def normalize_vehicles_and_depot(self) -> "RouteRequest":
        # Normalize vehicle / vehicles
        if not self.vehicles:
            if self.vehicle:
                self.vehicles = [self.vehicle]
            else:
                # Default single vehicle sized with buffer
                self.vehicles = [
                    Vehicle(
                        id="V001",
                        capacity_kg=max(2500.0, self.buyer.required_quantity_kg * 1.2),
                        cost_per_km=20.0,
                        average_speed_kmph=40.0,
                    )
                ]
        # Normalize depot if not provided
        if not self.depot:
            # Default depot positioned slightly offset or at buyer coordinate
            self.depot = Location(
                id="D001",
                name="Central Logistics Depot",
                latitude=self.buyer.latitude - 0.02,
                longitude=self.buyer.longitude - 0.02,
            )
        return self


class Stop(BaseModel):
    """An individual stop along a vehicle's route."""
    type: str = Field(..., description="'depot', 'supplier', or 'buyer'")
    id: str = Field(..., description="Location or entity ID")
    name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    quantity_collected_kg: Optional[float] = None
    quantity_delivered_kg: Optional[float] = None
    cumulative_distance_km: Optional[float] = None
    arrival_time_hours: Optional[float] = None


class VehicleRoute(BaseModel):
    """Complete route taken by a single vehicle."""
    vehicle_id: str
    stops: List[Stop]
    total_distance_km: float
    estimated_travel_time_hours: float
    estimated_transport_cost: float
    capacity_used_kg: float
    capacity_utilization_percent: float
    deadline_met: bool


class RouteComparison(BaseModel):
    """Comparative metrics between baseline and optimized routes."""
    baseline_distance_km: float
    optimized_distance_km: float
    distance_reduction_percent: float
    baseline_cost: float
    optimized_cost: float
    cost_reduction_percent: float
    baseline_time_hours: float
    optimized_time_hours: float
    time_reduction_percent: float


class RouteResult(BaseModel):
    """
    Standardized response returned by optimize_route().
    Matches the Section 17 schema.
    """
    status: str = Field(..., description="'success', 'infeasible', or 'invalid_input'")
    routes: Optional[List[VehicleRoute]] = None
    comparison: Optional[RouteComparison] = None
    reason: Optional[str] = Field(None, description="Infeasibility or error code (e.g. 'INSUFFICIENT_SUPPLY')")
    message: Optional[str] = Field(None, description="Human-readable status summary")

    def to_dict(self) -> Dict[str, Any]:
        """Convert to a clean dictionary matching Section 17 format."""
        return self.model_dump(exclude_none=True)
