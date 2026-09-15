"""
"What If?" Scenario Analysis Engine for Crop Planning.

Allows evaluating farmer crop decisions under dynamic market and climatic conditions:
- Normal Season
- Heavy Rainfall (Disease/Waterlogging Shock)
- Drought / Low Rainfall (Water Stress)
- Market Supply Glut (Price Depression)
- Market Supply Shortage (High Demand Signal)
- Price Crash in Volatile Crops
- High Transportation / Fuel Cost Shock
"""

from typing import Dict, List, Any, Optional
from ai_service.app.crop_planning.crop_data import SUPPORTED_CROPS
from ai_service.app.crop_planning.crop_advisor import CropPlanningAdvisor

SCENARIOS: Dict[str, Dict[str, Any]] = {
    "NORMAL": {
        "name": "Normal Season Baseline",
        "description": "Baseline expected regional market prices, normal seasonal weather, and standard logistics.",
        "icon": "🌤️",
        "price_multiplier": 1.0,
        "yield_multiplier": 1.0,
        "wastage_multiplier": 1.0,
        "freight_multiplier": 1.0,
    },
    "HEAVY_RAINFALL": {
        "name": "Heavy Rainfall / Excess Monsoon",
        "description": "Excess rain disrupts transport and increases fungal rot in perishable crops, while scarce supply boosts market prices for surviving produce.",
        "icon": "🌧️",
        "price_multiplier": 1.22,
        "yield_multiplier": 0.88,
        "wastage_multiplier": 1.45,
        "freight_multiplier": 1.15,
    },
    "DROUGHT_LOW_RAINFALL": {
        "name": "Drought / Low Rainfall Stress",
        "description": "Water scarcity reduces yields for water-intensive crops, heavily penalizing rainfed farms without assured irrigation.",
        "icon": "☀️",
        "price_multiplier": 1.15,
        "yield_multiplier": 0.75,
        "wastage_multiplier": 0.90,
        "freight_multiplier": 1.0,
    },
    "MARKET_SURPLUS": {
        "name": "Market Supply Glut / Oversupply",
        "description": "Simultaneous bumper harvest across neighboring districts depresses wholesale prices by 20-25%.",
        "icon": "📦",
        "price_multiplier": 0.78,
        "yield_multiplier": 1.08,
        "wastage_multiplier": 1.20,
        "freight_multiplier": 1.0,
    },
    "MARKET_SHORTAGE": {
        "name": "Regional Supply Shortage",
        "description": "Deficit market arrivals create strong buyer demand and push spot prices upward by 25-30%.",
        "icon": "📈",
        "price_multiplier": 1.28,
        "yield_multiplier": 0.95,
        "wastage_multiplier": 1.0,
        "freight_multiplier": 1.0,
    },
    "PRICE_CRASH": {
        "name": "Price Crash in Volatile Vegetables",
        "description": "Volatile vegetables (Tomato, Green Chilli) experience a 35% price drop, testing the downside resilience of storage crops like Potato.",
        "icon": "📉",
        "price_multiplier": 0.65,
        "yield_multiplier": 1.0,
        "wastage_multiplier": 1.10,
        "freight_multiplier": 1.0,
    },
    "HIGH_TRANSPORT_COST": {
        "name": "High Transportation / Fuel Cost Shock",
        "description": "Fuel price hikes increase commercial vehicle freight from ₹20/km to ₹35/km, penalizing high-bulk, low-value distant transit.",
        "icon": "⛽",
        "price_multiplier": 1.0,
        "yield_multiplier": 1.0,
        "wastage_multiplier": 1.0,
        "freight_multiplier": 1.75,
    },
}


def run_scenario_analysis(
    advisor: CropPlanningAdvisor,
    region: str,
    land_area_acres: float,
    season: str,
    irrigation: bool = True,
    distance_km: float = 25.0,
    scenario_keys: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """
    Simulates crop evaluations across multiple 'What If?' scenarios.
    """
    target_scenarios = scenario_keys or list(SCENARIOS.keys())
    scenario_results: Dict[str, Any] = {}

    for s_key in target_scenarios:
        if s_key not in SCENARIOS:
            continue
        s_meta = SCENARIOS[s_key]

        # Evaluate base crops
        base_evals = advisor.evaluate_all_crops(
            region=region,
            land_area_acres=land_area_acres,
            season=season,
            irrigation=irrigation,
            distance_to_market_km=distance_km,
        )

        # Apply scenario shock multipliers
        adjusted_evals = []
        for c in base_evals:
            item = c.copy()
            p_mult = s_meta["price_multiplier"]
            y_mult = s_meta["yield_multiplier"]
            w_mult = s_meta["wastage_multiplier"]

            # Price crash selectively hits high volatility crops harder
            if s_key == "PRICE_CRASH":
                if item["risk_level"] == "HIGH":
                    p_mult = 0.62
                elif item["risk_level"] == "MEDIUM":
                    p_mult = 0.80
                else:
                    p_mult = 0.95

            # Drought hits water-thirsty crops harder if rainfed
            if s_key == "DROUGHT_LOW_RAINFALL" and not irrigation:
                crop_prof = SUPPORTED_CROPS.get(item["crop"], {})
                if crop_prof.get("water_requirement") in ["High", "Medium-High"]:
                    y_mult = 0.60

            adj_price = round(item["predicted_price"] * p_mult, 2)
            adj_yield = round(item["expected_yield_kg_per_acre"] * y_mult, 1)
            adj_total_yield = round(adj_yield * land_area_acres, 1)

            adj_revenue = round(adj_total_yield * adj_price, 2)
            adj_freight = round(item["transport_cost"] * s_meta["freight_multiplier"], 2)
            adj_wastage = round(item["expected_wastage_cost"] * w_mult, 2)
            adj_costs = round(item["production_cost"] + adj_freight + item["holding_cost"] + adj_wastage, 2)
            adj_net_return = round(adj_revenue - adj_costs, 2)
            adj_net_per_acre = round(adj_net_return / land_area_acres, 2)

            # Recompute composite score under scenario
            ret_score = min(100.0, max(0.0, (adj_net_per_acre / 55000.0) * 100.0))
            score_diff = ret_score - item["scores"]["return_score"]
            adj_score = round(max(5.0, min(100.0, item["score"] + (score_diff * 0.40))), 1)

            item["scenario_adjusted_price"] = adj_price
            item["scenario_adjusted_net_return"] = adj_net_return
            item["scenario_adjusted_net_per_acre"] = adj_net_per_acre
            item["scenario_adjusted_score"] = adj_score
            adjusted_evals.append(item)

        adjusted_evals.sort(key=lambda x: x["scenario_adjusted_score"], reverse=True)
        for idx, it in enumerate(adjusted_evals):
            it["scenario_rank"] = idx + 1

        top_winner = adjusted_evals[0]
        scenario_results[s_key] = {
            "scenario_key": s_key,
            "scenario_name": s_meta["name"],
            "description": s_meta["description"],
            "icon": s_meta["icon"],
            "top_crop": top_winner["crop"],
            "top_crop_net_per_acre": top_winner["scenario_adjusted_net_per_acre"],
            "top_crop_score": top_winner["scenario_adjusted_score"],
            "rankings": [
                {
                    "rank": it["scenario_rank"],
                    "crop": it["crop"],
                    "price": it["scenario_adjusted_price"],
                    "net_per_acre": it["scenario_adjusted_net_per_acre"],
                    "score": it["scenario_adjusted_score"],
                }
                for it in adjusted_evals[:5]
            ],
        }

    return scenario_results
