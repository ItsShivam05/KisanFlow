from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, model_validator
from ai_service.app.schemas.common import Coordinates


class StopPoint(BaseModel):
    sequence: int = Field(..., description="Stop order sequence in trip (0 = start depot)")
    node_id: str = Field(..., description="Node ID (e.g. 'depot', 'supplier-01')")
    name: str = Field(..., description="Name of depot or supplier")
    stop_type: str = Field(..., description="'depot_start', 'pickup', or 'depot_end'")
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    pickup_quantity_kg: float = Field(0.0, ge=0.0)
    cumulative_load_kg: float = Field(0.0, ge=0.0)
    distance_from_prev_km: float = Field(0.0, ge=0.0)
    arrival_time_hours: Optional[float] = Field(None, description="Estimated arrival time at stop in hours")


class VehicleRoute(BaseModel):
    vehicle_id: str = Field(..., description="Assigned vehicle/truck identifier")
    vehicle_capacity_kg: float = Field(..., gt=0.0)
    total_carried_kg: float = Field(..., ge=0.0)
    capacity_utilization_percent: float = Field(..., ge=0.0, le=100.0)
    stops: List[StopPoint]
    ordered_stop_ids: List[str]
    route_distance_km: float = Field(..., ge=0.0)
    transport_cost_inr: float = Field(..., ge=0.0)
    estimated_travel_time_hours: Optional[float] = Field(None, ge=0.0, description="Estimated route transit duration in hours")
    deadline_met: Optional[bool] = Field(True, description="Whether delivery deadline was met")


class BaselineComparison(BaseModel):
    baseline_distance_km: float = Field(..., description="Total distance if depot visited each supplier individually")
    optimized_distance_km: float = Field(..., description="Optimized CVRP total distance")
    distance_saved_km: float
    distance_savings_percent: float
    baseline_cost_inr: float
    optimized_cost_inr: float
    cost_saved_inr: float
    cost_savings_percent: float
    baseline_time_hours: Optional[float] = Field(None, description="Baseline unoptimized route travel time in hours")
    time_saved_hours: Optional[float] = Field(None, description="Travel time saved in hours")
    time_savings_percent: Optional[float] = Field(None, description="Percentage travel time saved")


class PickupLocation(BaseModel):
    supplier_id: str = Field(..., description="Unique supplier or farmer identifier")
    name: str = Field(..., description="Supplier or farm name")
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Latitude in decimal degrees")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Longitude in decimal degrees")
    quantity_kg: float = Field(..., ge=0.0, description="Quantity to collect in kg")


class RouteOptimizeRequest(BaseModel):
    depot_coordinates: Coordinates = Field(
        default=Coordinates(latitude=25.5941, longitude=85.1376),
        description="Depot/warehouse start and end coordinates"
    )
    depot_name: str = Field("Patna Central Procurement Hub", description="Depot name")
    pickups: List[PickupLocation] = Field(..., description="List of matched supplier stops to collect cargo from")
    vehicle_capacity_kg: Optional[float] = Field(5000.0, gt=0.0, description="Payload capacity per truck in kg")
    fleet_size: Optional[int] = Field(4, gt=0, description="Max available vehicles in fleet")
    cost_per_km: Optional[float] = Field(20.0, ge=0.0, description="Transport rate per km in INR")
    fixed_cost_per_vehicle: Optional[float] = Field(1000.0, ge=0.0, description="Fixed mobilization cost per vehicle in INR")
    average_speed_kmph: Optional[float] = Field(40.0, gt=0.0, description="Average transit speed in km/h for travel time calculation")
    delivery_deadline: Optional[str] = Field(None, description="Optional delivery deadline ISO timestamp or time string")

    @model_validator(mode="before")
    @classmethod
    def handle_buyer_suppliers_contract(cls, data: Any) -> Any:
        """
        Supports the Phase 2 contract ('buyer', 'suppliers', 'vehicles')
        seamlessly alongside existing KisanFlow fields.
        """
        if not isinstance(data, dict):
            return data

        # If data is formatted with 'buyer' and 'suppliers'
        if "buyer" in data and "pickups" not in data:
            buyer = data["buyer"]
            data["depot_coordinates"] = {
                "latitude": buyer.get("latitude"),
                "longitude": buyer.get("longitude"),
            }
            data["depot_name"] = buyer.get("name", "Buyer Procurement Hub")
            if "delivery_deadline" in buyer and "delivery_deadline" not in data:
                data["delivery_deadline"] = str(buyer["delivery_deadline"])

        if "suppliers" in data and "pickups" not in data:
            raw_suppliers = data["suppliers"]
            pickups = []
            for s in raw_suppliers:
                pickups.append({
                    "supplier_id": s.get("id") or s.get("supplier_id"),
                    "name": s.get("name", "Supplier"),
                    "latitude": s.get("latitude"),
                    "longitude": s.get("longitude"),
                    "quantity_kg": s.get("allocated_quantity_kg") if "allocated_quantity_kg" in s else s.get("quantity_kg", 0.0),
                })
            data["pickups"] = pickups

        if "vehicles" in data:
            vehicles = data["vehicles"]
            if isinstance(vehicles, list) and len(vehicles) > 0:
                first_v = vehicles[0]
                if "capacity_kg" in first_v and "vehicle_capacity_kg" not in data:
                    data["vehicle_capacity_kg"] = first_v["capacity_kg"]
                if "cost_per_km" in first_v and "cost_per_km" not in data:
                    data["cost_per_km"] = first_v["cost_per_km"]
                if "average_speed_kmph" in first_v and "average_speed_kmph" not in data:
                    data["average_speed_kmph"] = first_v["average_speed_kmph"]
                if "fleet_size" not in data:
                    data["fleet_size"] = len(vehicles)

        elif "vehicle" in data:
            v = data["vehicle"]
            if isinstance(v, dict):
                if "capacity_kg" in v and "vehicle_capacity_kg" not in data:
                    data["vehicle_capacity_kg"] = v["capacity_kg"]
                if "cost_per_km" in v and "cost_per_km" not in data:
                    data["cost_per_km"] = v["cost_per_km"]
                if "average_speed_kmph" in v and "average_speed_kmph" not in data:
                    data["average_speed_kmph"] = v["average_speed_kmph"]
                if "fleet_size" not in data:
                    data["fleet_size"] = 1

        return data


class RouteOptimizeResponse(BaseModel):
    status: str = Field(..., description="'OPTIMAL', 'FEASIBLE', or 'INFEASIBLE'")
    total_distance_km: float
    total_transport_cost_inr: float
    active_vehicles_count: int
    total_quantity_collected_kg: float
    routes: List[VehicleRoute]
    baseline_comparison: BaselineComparison
    total_travel_time_hours: Optional[float] = Field(None, description="Estimated total/makespan travel time in hours")
    deadline_met: Optional[bool] = Field(True, description="Whether delivery deadline was met")
    message: str
