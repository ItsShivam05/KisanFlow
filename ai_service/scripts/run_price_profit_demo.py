"""
End-to-End Demonstration Script for Price Forecasting and Farmer Profit Optimization in Jharkhand.

Demonstrates the complete decision pipeline:
Regional agricultural data
  ↓
Price forecasting with XGBoost
  ↓
Future regional prices (1, 3, 7 days)
  ↓
Transport + holding + wastage costs
  ↓
Expected net realization
  ↓
Farmer selling recommendation (Sell Now vs Wait)
  ↓
Multi-market comparison & volume allocation
  ↓
OR-Tools route optimization connection
"""

import sys
from pathlib import Path

# Enable UTF-8 for console output on Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

import pandas as pd
from ai_service.app.config import settings
from ai_service.app.pricing.price_data import JHARKHAND_MARKETS, SUPPORTED_COMMODITIES
from ai_service.app.pricing.price_model import JharkhandPriceModelRegistry
from ai_service.app.pricing.price_forecast import run_recursive_price_forecast
from ai_service.app.pricing.profit_optimizer import FarmerProfitOptimizer
from ai_service.route_optimization.distance import calculate_distance
from ai_service.route_optimization.models import Location
from ai_service.app.utils.logger import logger


def run_demo():
    print("\n" + "=" * 80)
    print("🌾 KISANFLOW: JHARKHAND PRICE PREDICTION & FARMER PROFIT ADVISOR DEMO 🌾")
    print("=" * 80)

    # Step 1: Ensure dataset and models are ready
    proc_path = Path(settings.JHARKHAND_PROCESSED_PRICE_PATH)
    model_path = Path(settings.JHARKHAND_PRICE_MODEL_PATH)

    if not model_path.exists() or not proc_path.exists():
        print("\n[Setup] Auto-preparing Jharkhand price dataset and training baseline models...")
        from ai_service.scripts.train_price_models import run as train_run
        train_run()

    feature_df = pd.read_csv(proc_path)
    registry = JharkhandPriceModelRegistry(storage_path=str(model_path))
    registry.load()

    # Step 2: Define Realistic Farmer Scenario
    # Farmer in Hazaribagh with 2,500 kg of fresh Tomatoes
    farmer_district = "Hazaribagh"
    commodity = "Tomato"
    quantity_kg = 2500.0

    print(f"\n📍 Farmer Scenario:")
    print(f"   - Location   : {farmer_district}, Jharkhand")
    print(f"   - Commodity  : {commodity}")
    print(f"   - Harvest Qty: {quantity_kg:,.0f} kg")

    # Step 3: Run XGBoost Recursive Price Forecast (7 Days)
    model = registry.get_model(commodity)
    if not model:
        print(f"Error: Model for {commodity} not loaded.")
        sys.exit(1)

    forecast_res = run_recursive_price_forecast(
        model=model,
        commodity=commodity,
        region=farmer_district,
        historical_df=feature_df,
        forecast_days=7,
    )

    current_price = forecast_res["current_price"]
    print(f"\n📈 1. Regional Price Intelligence ({farmer_district}):")
    print(f"   Current Mandi Spot Price: ₹{current_price:.2f}/kg")
    print(f"   7-Day Recursive Forecast Trajectory (XGBoost):")
    print(f"   {'Day':<6} {'Date':<12} {'Predicted':<12} {'Estimated Range':<18} {'Change vs Today':<15}")
    print("   " + "-" * 65)

    for p in forecast_res["predictions"]:
        rng_str = f"₹{p['lower_estimate']:.1f} - ₹{p['upper_estimate']:.1f}"
        chg_sign = "+" if p["price_change_vs_current"] >= 0 else ""
        chg_str = f"{chg_sign}₹{p['price_change_vs_current']:.2f}/kg"
        print(f"   Day {p['horizon_day']:<2} {p['date']:<12} ₹{p['predicted_price']:<10.2f} {rng_str:<18} {chg_str:<15}")

    print("\n🔍 2. Prediction Driver Attribution (Explainability):")
    for factor in forecast_res["explainability_factors"]:
        print(f"   • {factor}")

    # Step 4: Sell Now vs Wait Economic Decision
    optimizer = FarmerProfitOptimizer()
    sell_wait_res = optimizer.evaluate_sell_now_vs_wait(
        commodity=commodity,
        current_spot_price=current_price,
        daily_predictions=forecast_res["predictions"],
        distance_km=15.0,  # Local mandi transit
        quantity_kg=quantity_kg,
    )

    print("\n⚖️ 3. Economic Timing Evaluation (Sell Now vs Wait):")
    print(f"   Current Sell-Now Net Realization: ₹{sell_wait_res['sell_now_net_realization']:.2f}/kg")
    print(f"   Optimal Decision                 : {sell_wait_res['decision']}")
    print(f"   Expected Net Gain vs Today       : ₹{sell_wait_res['expected_net_gain_per_kg']:.2f}/kg")
    print(f"   Projected Realization            : ₹{sell_wait_res['recommended_net_realization']:.2f}/kg")
    print(f"   Rationale                        : {sell_wait_res['decision_rationale']}")

    # Step 5: Multi-Market Net Realization Comparison across Jharkhand
    print("\n🚚 4. Multi-Market Comparison across Jharkhand:")
    print("   Evaluating Expected Net Realization = Expected Price - Transport - Holding - Handling - Wastage\n")

    # Forecast Day 1 price across candidate mandis
    market_prices = {}
    for mkt in JHARKHAND_MARKETS.keys():
        try:
            m_res = run_recursive_price_forecast(
                model=model,
                commodity=commodity,
                region=mkt,
                historical_df=feature_df,
                forecast_days=1,
            )
            market_prices[mkt] = m_res["predictions"][0]["predicted_price"]
        except Exception:
            market_prices[mkt] = current_price

    market_comparison = optimizer.compare_markets(
        commodity=commodity,
        quantity_kg=quantity_kg,
        farmer_location=farmer_district,
        market_predicted_prices=market_prices,
    )

    print(f"   {'Market':<14} {'Distance':<10} {'Predicted':<12} {'Transport':<12} {'Net Realization':<18} {'Net Profit':<14} {'Status'}")
    print("   " + "-" * 90)

    for opt in market_comparison:
        status = "★ RECOMMENDED" if opt["recommended"] else ""
        print(
            f"   {opt['market']:<14} "
            f"{opt['distance_km']:>5.1f} km   "
            f"₹{opt['predicted_price']:>5.2f}/kg    "
            f"₹{opt['transport_cost_per_kg']:>5.2f}/kg    "
            f"₹{opt['expected_net_realization']:>5.2f}/kg         "
            f"₹{opt['total_expected_net_profit']:>9,.2f}  "
            f"{status}"
        )

    # Step 6: Multi-Market Supply Allocation to Avoid Saturation
    print("\n🌐 5. Balanced Market Allocation (Consumer Protection & Saturation Prevention):")
    allocations = optimizer.allocate_market_supply(
        commodity=commodity,
        total_quantity_kg=quantity_kg,
        market_options=market_comparison,
        max_single_market_share=0.50,
    )

    for alloc in allocations:
        print(
            f"   • {alloc['market']:<12}: {alloc['allocated_quantity_kg']:>6,.0f} kg ({alloc['allocation_pct']}%) "
            f"@ ₹{alloc['expected_net_realization']:.2f}/kg net -> ₹{alloc['projected_net_revenue']:,.2f} "
            f"({alloc['reason']})"
        )

    # Step 7: Route Optimization Integration (OR-Tools Haversine Bridge)
    top_market = market_comparison[0]
    print(f"\n🗺️ 6. OR-Tools Route & Logistics Bridge:")
    print(f"   - Selected Transit Corridor: {farmer_district} -> {top_market['market']} APMC Mandi")
    print(f"   - Haversine Distance (with 1.28 circuity): {top_market['distance_km']} km")
    print(f"   - Commercial Vehicle Cost Rate: ₹{settings.COST_PER_KM}/km")
    print(f"   - Total Trip Logistics Cost: ₹{round(top_market['distance_km'] * settings.COST_PER_KM, 2):,.2f}")
    print(f"   - Effective Freight per kg: ₹{top_market['transport_cost_per_kg']:.2f}/kg")

    print("\n" + "=" * 80)
    print("✅ DEMO COMPLETE: Decision support pipeline successfully executed.")
    print("=" * 80 + "\n")


if __name__ == "__main__":
    run_demo()
