"""
End-to-End Pipeline Orchestration Service.

Integrates:
1. Demand Forecasting (Issue #8)
2. Current Market Price Intelligence (Prototype)
3. Multi-Supplier Matching & Procurement (Issue #9)
4. Google OR-Tools CVRP Route Optimization (Issue #10)
"""

from typing import Optional
import pandas as pd
from ai_service.app.schemas.pipeline import PipelineRunRequest, PipelineRunResponse
from ai_service.app.schemas.forecast import ForecastRequest
from ai_service.app.schemas.price import PriceEstimateRequest
from ai_service.app.schemas.matching import MatchSuppliersRequest
from ai_service.app.schemas.routing import RouteOptimizeRequest, PickupLocation
from ai_service.app.forecasting.model import DemandForecastModel
from ai_service.app.services.price_service import estimate_current_market_price
from ai_service.app.matching.engine import match_suppliers
from ai_service.app.optimization.solver import solve_cvrp
from ai_service.app.config import settings
from ai_service.app.utils.logger import logger

def run_end_to_end_pipeline(
    request: PipelineRunRequest,
    forecast_model: Optional[DemandForecastModel] = None,
    historical_df: Optional[pd.DataFrame] = None
) -> PipelineRunResponse:
    """
    Execute full pipeline workflow:
    Forecast -> Price Intelligence -> Matching -> Route Optimization.
    """
    req = request.buyer_requirement
    commodity = req.product.strip().title()
    region = req.region.strip().title()
    
    logger.info(f"Starting end-to-end pipeline for {req.required_quantity_kg:,.0f} kg {commodity} in {region}.")
    
    # 1. Demand Forecast
    if forecast_model is None:
        forecast_model = DemandForecastModel(settings.MODEL_PATH)
    if historical_df is None:
        historical_df = pd.read_csv(settings.PROCESSED_DATA_PATH)
        
    forecast_resp = forecast_model.predict_horizon(
        historical_df=historical_df,
        product=commodity,
        region=region,
        horizon_days=request.forecast_horizon_days
    )
    
    # 2. Market Price Intelligence
    price_resp = estimate_current_market_price(PriceEstimateRequest(
        commodity=commodity,
        region=region,
        historical_baseline_price=32.0
    ))
    
    # 3. Supplier Matching
    matching_resp = match_suppliers(
        requirement=req,
        candidate_suppliers=None  # uses seed database
    )
    
    # 4. OR-Tools Route Optimization
    pickups = [
        PickupLocation(
            supplier_id=s.supplier_id,
            name=s.name,
            latitude=s.latitude,
            longitude=s.longitude,
            quantity_kg=s.allocated_quantity_kg
        )
        for s in matching_resp.selected_suppliers
    ]
    
    route_req = RouteOptimizeRequest(
        depot_coordinates=req.buyer_location,
        depot_name=f"{region} Central Delivery Hub",
        pickups=pickups,
        vehicle_capacity_kg=request.vehicle_capacity_kg or settings.VEHICLE_CAPACITY_KG,
        fleet_size=request.fleet_size or 4,
        cost_per_km=settings.COST_PER_KM,
        fixed_cost_per_vehicle=settings.FIXED_VEHICLE_COST
    )
    routing_resp = solve_cvrp(route_req)
    
    # 5. Executive Summary
    summary = (
        f"KisanFlow Pipeline Execution Complete for {req.required_quantity_kg:,.0f} kg {commodity} in {region}.\n"
        f"• Demand Forecast: 7-day expected regional demand is {forecast_resp.total_predicted_demand_kg:,.0f} kg.\n"
        f"• Price Signal: Current market estimate is ₹{price_resp.observation.price_per_kg}/kg.\n"
        f"• Supplier Matching: {matching_resp.matching_summary}\n"
        f"• Routing Optimization: {routing_resp.message}"
    )
    
    return PipelineRunResponse(
        pipeline_status="SUCCESS",
        commodity=commodity,
        region=region,
        forecast=forecast_resp,
        price_intelligence=price_resp,
        matching=matching_resp,
        routing=routing_resp,
        executive_summary=summary
    )
