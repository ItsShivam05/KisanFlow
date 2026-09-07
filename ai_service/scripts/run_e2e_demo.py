"""
Reproducible End-to-End KisanFlow Demonstration (Issues #7 -> #8 -> #9 -> #10).

Scenario:
- Commodity: Tomato
- Destination: Patna Central Procurement Warehouse (25.5941° N, 85.1376° E)
- Demand: 10,000 kg

Executes full automated pipeline:
1. Loads historical mandi demand dataset (Issue #7)
2. Predicts 7-day regional demand (Issue #8)
3. Evaluates current market price signals (Prototype price service)
4. Matches best farmer/FPO suppliers across Bihar cluster (Issue #9)
5. Solves Capacitated Vehicle Routing Problem using Google OR-Tools (Issue #10)
6. Compares optimized routes vs traditional unoptimized baseline (Distance & Cost savings)

Usage:
    python -m ai_service.scripts.run_e2e_demo
"""

import sys
import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(BASE_DIR))

from ai_service.app.config import settings
from ai_service.app.schemas.pipeline import PipelineRunRequest
from ai_service.app.schemas.matching import BuyerRequirement
from ai_service.app.schemas.common import Coordinates
from ai_service.app.services.pipeline_service import run_end_to_end_pipeline
from ai_service.app.forecasting.model import DemandForecastModel
from ai_service.app.forecasting.dataset import run_data_preparation_pipeline
from ai_service.app.forecasting.generator import generate_agricultural_demand_data
from ai_service.app.utils.logger import logger

def main():
    print("\n" + "="*80)
    print("      KISANFLOW AI & OPTIMIZATION PIPELINE DEMONSTRATION")
    print("="*80)
    
    # Ensure dataset and model exist
    raw_path = Path(settings.RAW_DATA_PATH)
    proc_path = Path(settings.PROCESSED_DATA_PATH)
    model_path = Path(settings.MODEL_PATH)
    
    if not proc_path.exists():
        logger.info("Initializing dataset...")
        raw_path.parent.mkdir(parents=True, exist_ok=True)
        raw_df = generate_agricultural_demand_data()
        raw_df.to_csv(raw_path, index=False)
        run_data_preparation_pipeline(str(raw_path), str(proc_path))
        
    if not model_path.exists():
        logger.info("Training initial model...")
        import pandas as pd
        df = pd.read_csv(proc_path)
        model = DemandForecastModel()
        model.train(df)
        model.save(str(model_path))
        
    # Define SIH Demo Scenario
    buyer_req = BuyerRequirement(
        product="Tomato",
        required_quantity_kg=10000.0,
        region="Patna",
        buyer_location=Coordinates(latitude=25.5941, longitude=85.1376),
        required_by="2026-09-10",
        minimum_quality="B"
    )
    
    pipeline_req = PipelineRunRequest(
        buyer_requirement=buyer_req,
        forecast_horizon_days=7,
        vehicle_capacity_kg=5000.0,
        fleet_size=3
    )
    
    result = run_end_to_end_pipeline(pipeline_req)
    
    print("\n" + "-"*80)
    print(" 1. DEMAND FORECASTING BASELINE (ISSUE #8)")
    print("-"*80)
    fc = result.forecast
    print(f"Product: {fc.product} | Region: {fc.region} | Horizon: {fc.horizon_days} Days")
    print(f"Model: {fc.model_version} | Evaluation MAE: {fc.metrics.get('mae_kg')} kg | MAPE: {fc.metrics.get('mape_percent')}%")
    print(f"Total 7-Day Predicted Regional Demand: {fc.total_predicted_demand_kg:,.1f} kg\n")
    print("Daily Forecast Breakdown:")
    for d in fc.daily_forecast:
        print(f"  * {d.date} ({d.day_of_week}): {d.predicted_demand_kg:,.1f} kg  [Confidence: {d.lower_bound_kg} - {d.upper_bound_kg} kg]")
        
    print("\n" + "-"*80)
    print(" 2. CURRENT MARKET PRICE INTELLIGENCE (PROTOTYPE)")
    print("-"*80)
    pi = result.price_intelligence
    obs = pi.observation
    print(f"Estimated Market Spot Price: Rs. {obs.price_per_kg:.2f}/kg ({obs.source})")
    print(f"Baseline Historical Price:  Rs. {pi.historical_baseline_price:.2f}/kg")
    print(f"Deviation:                   Rs. {pi.price_deviation_inr:+.2f}/kg ({pi.price_deviation_percent:+.1f}%)")
    if pi.market_alert:
        print(f"Signal Alert:                {pi.market_alert}")
        
    print("\n" + "-"*80)
    print(" 3. SUPPLIER MATCHING & PROCUREMENT ALLOCATION (ISSUE #9)")
    print("-"*80)
    m = result.matching
    print(f"Requirement:          {m.required_quantity_kg:,.0f} kg {m.product}")
    print(f"Total Allocated:      {m.total_allocated_quantity_kg:,.0f} kg ({m.fulfillment_percentage}% fulfillment)")
    print(f"Weighted Avg Price:   Rs. {m.average_procurement_price_per_kg:.2f}/kg")
    print(f"Total Farm Payout:    Rs. {m.total_procurement_cost_inr:,.2f}\n")
    print("Selected Suppliers Allocation & Reasoning:")
    for i, s in enumerate(m.selected_suppliers, 1):
        print(f"  [{i}] {s.name} ({s.supplier_id}) -- {s.supplier_type}")
        print(f"      Allocated: {s.allocated_quantity_kg:,.0f} kg / {s.available_quantity_kg:,.0f} kg available @ Rs. {s.price_per_kg:.2f}/kg")
        print(f"      Distance:  {s.distance_km:.1f} km | Quality: Grade {s.quality_grade} | Score: {s.score:.1f}/100")
        print(f"      Reasons:   {', '.join(s.reasons)}")
        
    print("\n" + "-"*80)
    print(" 4. GOOGLE OR-TOOLS ROUTE OPTIMIZATION (ISSUE #10)")
    print("-"*80)
    r = result.routing
    bc = r.baseline_comparison
    print(f"Status:                     {r.status}")
    print(f"Active Dispatch Vehicles:   {r.active_vehicles_count} truck(s) [Max capacity: 5,000 kg each]")
    print(f"Total Route Road Distance:  {r.total_distance_km:.1f} km")
    print(f"Total Transport Cost:       Rs. {r.total_transport_cost_inr:,.2f}\n")
    
    print("Optimized Vehicle Dispatch Routes:")
    for v in r.routes:
        print(f"  > Vehicle: {v.vehicle_id} (Load: {v.total_carried_kg:,.0f} kg / {v.vehicle_capacity_kg:,.0f} kg -- {v.capacity_utilization_percent}%)")
        print(f"    Distance: {v.route_distance_km:.1f} km | Trip Cost: Rs. {v.transport_cost_inr:,.2f}")
        print("    Stops Sequence:")
        for st in v.stops:
            if st.stop_type == "depot_start":
                print(f"      0. [DEPOT START] {st.name}")
            elif st.stop_type == "pickup":
                print(f"      {st.sequence}. [PICKUP] {st.name}: +{st.pickup_quantity_kg:,.0f} kg (Cumulative Load: {st.cumulative_load_kg:,.0f} kg, +{st.distance_from_prev_km} km)")
            elif st.stop_type == "depot_end":
                print(f"      {st.sequence}. [DEPOT RETURN] {st.name} (+{st.distance_from_prev_km} km)")
        print()
        
    print("-"*80)
    print(" 5. BENCHMARK & EFFICIENCY SAVINGS")
    print("-"*80)
    print(f"Traditional Naive Baseline Distance:  {bc.baseline_distance_km:.1f} km (independent point-to-point trips)")
    print(f"Optimized Multi-Stop CVRP Distance:   {bc.optimized_distance_km:.1f} km")
    print(f"[*] ROAD DISTANCE SAVED:              {bc.distance_saved_km:.1f} km ({bc.distance_savings_percent}% reduction)")
    print(f"Traditional Baseline Logistics Cost:  Rs. {bc.baseline_cost_inr:,.2f}")
    print(f"Optimized KisanFlow Logistics Cost:   Rs. {bc.optimized_cost_inr:,.2f}")
    print(f"[*] LOGISTICS COST SAVED:             Rs. {bc.cost_saved_inr:,.2f} ({bc.cost_savings_percent}% reduction)")
    print("="*80 + "\n")

if __name__ == "__main__":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass
    main()

