"""
CLI Demonstration of 'What Should We Grow?' / Crop Planning Advisor.
Pilot Geography: Jharkhand, India.

Demonstrates:
- Input parameters for a farmer (e.g., Ranchi, 5 Acres, Rabi, Irrigation=True)
- Predicted regional prices & expected demand integration
- Full economic breakdown (Revenue, Production Cost, Transport, Wastage, Net Return)
- Multi-criteria decision ranking (Risk-Adjusted Return + Market Demand + Stability)
- Decision Explainability ("Why Potato?" vs "Why not Tomato?")
- Land Diversification Portfolio
- "What If?" Scenario Stress-Testing (e.g., Price Crash, Heavy Rainfall)
"""

import sys
import os
import json

# Ensure UTF-8 output on Windows console
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Ensure repo root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from ai_service.app.crop_planning.crop_advisor import CropPlanningAdvisor
from ai_service.app.crop_planning.scenario_analyzer import run_scenario_analysis


def main():
    print("=" * 80)
    print("KISANFLOW - WHAT SHOULD WE GROW? / CROP PLANNING ADVISOR")
    print("Pilot Geography: Jharkhand, India (Ranchi, Hazaribagh, Dhanbad, etc.)")
    print("=" * 80)
    print("DISCLAIMER: Decision-support tool based on statistical forecasts & prototype")
    print("agronomic assumptions. NOT a guarantee of profit or yields.")
    print("=" * 80)

    advisor = CropPlanningAdvisor()

    # Farmer Scenario
    region = "Ranchi"
    land_acres = 5.0
    season = "Rabi"
    irrigation = True
    distance_km = 25.0

    print(f"\n[FARMER PROFILE]")
    print(f"  * Region: {region}, Jharkhand")
    print(f"  * Land Area: {land_acres} acres")
    print(f"  * Season: {season}")
    print(f"  * Irrigation Available: {'Yes' if irrigation else 'No (Rainfed)'}")
    print(f"  * Distance to Market: {distance_km} km")

    print(f"\nEvaluating candidate crops using Price XGBoost + Demand baselines...")
    result = advisor.recommend(
        region=region,
        land_area_acres=land_acres,
        season=season,
        irrigation=irrigation,
        distance_km=distance_km,
    )

    recs = result["recommendations"]
    print(f"\n[RANKED CROP RECOMMENDATIONS ({len(recs)} Evaluated Crops)]")
    print("-" * 90)
    print(f"{'Rank':<5}{'Crop':<14}{'Exp.Price':<11}{'Yield(kg)':<11}{'Exp.Rev(₹)':<13}{'Net Ret(₹)':<13}{'Risk':<8}{'Score':<6}")
    print("-" * 90)

    for r in recs:
        print(
            f"#{r['rank']:<4}{r['crop']:<14}"
            f"₹{r['predicted_price']:<9.1f}"
            f"{r['expected_yield_kg_per_acre']:<11,}"
            f"₹{r['expected_revenue']:<11,}"
            f"₹{r['expected_net_return']:<11,}"
            f"{r['risk']:<8}"
            f"{r['score']:<5.1f}"
        )
    print("-" * 90)

    top = recs[0]
    print(f"\n🥇 TOP RECOMMENDATION: {top['crop'].upper()} (Score: {top['score']}/100 - {top['suitability']})")
    print(f"   * Expected Net Return: ₹{top['expected_net_return']:,.2f} across {land_acres} acres (₹{top['net_return_per_acre']:,.2f}/acre)")
    print(f"   * Benefit-Cost Ratio (BCR): {top['benefit_cost_ratio']:.2f}x")
    print(f"   * Market Demand Outlook: {top['market_condition']} ({top['expected_demand']:,.0f} kg regional)")
    print(f"   * Price Outlook: ₹{top['predicted_price']:.1f}/kg (Range: ₹{top['price_lower_bound']:.1f} - ₹{top['price_upper_bound']:.1f}/kg)")
    print(f"   * Wastage Risk: {top['perishability_tier']} perishability ({top['shelf_life_days']} days shelf life)")

    print(f"\n[EXPLAINABILITY ENGINE]")
    expl = result["explainability"]
    print(f"  WHY {expl['recommended_crop']}?")
    for pt in expl["why_recommended"]:
        print(f"    ✓ {pt}")

    if expl.get("why_not_runner_up"):
        print(f"\n  WHY NOT {expl.get('runner_up_crop')} (Runner-up)?")
        for pt in expl["why_not_runner_up"]:
            print(f"    ✗ {pt}")

    div = result["diversification_plan"]
    print(f"\n[LAND DIVERSIFICATION PORTFOLIO ({land_acres} Acres)]")
    print(f"Rationale: {div['rationale']}")
    for alloc in div["allocations"]:
        print(
            f"  - {alloc['crop']}: {alloc['acres']} acres ({alloc['fraction_pct']}%) "
            f"-> Exp. Net Return: ₹{alloc['expected_net_return']:,.2f} (Risk: {alloc['risk_level']})"
        )
    print(f"  TOTAL PORTFOLIO RETURN: ₹{div['portfolio_net_return']:,.2f} (₹{div['blended_net_return_per_acre']:,.2f}/acre)")

    # Run Scenario Stress-Testing
    print(f"\n[SCENARIO STRESS-TESTING ('WHAT IF?')]")
    scenario_res = run_scenario_analysis(
        advisor=advisor,
        region=region,
        land_area_acres=land_acres,
        season=season,
        irrigation=irrigation,
        distance_km=distance_km,
        scenario_keys=["NORMAL", "PRICE_CRASH", "HEAVY_RAINFALL", "MARKET_GLUT", "HIGH_FUEL"],
    )

    for sc in scenario_res.values():
        top_crop = sc["rankings"][0]["crop"] if sc["rankings"] else "N/A"
        top_score = sc["rankings"][0]["score"] if sc["rankings"] else 0
        print(f"  * {sc['icon']} [{sc['scenario_name'].upper()}] -> Top Pick: {top_crop} (Score {top_score:.1f})")
        print(f"    Description: {sc['description']}")

    print("\n" + "=" * 80)
    print("Crop Planning Advisory Demo Completed Successfully.")
    print("=" * 80)


if __name__ == "__main__":
    main()
