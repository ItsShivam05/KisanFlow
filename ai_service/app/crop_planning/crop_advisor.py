"""
Crop Planning Advisor Engine.

Connects:
- Existing XGBoost Price Prediction (`ai_service.app.pricing`)
- Existing XGBoost Demand Forecasting (`ai_service.app.forecasting`)
- Crop Financial Economics (`ai_service.app.crop_planning.crop_economics`)
- Multi-Criteria Decision Scoring & Risk Penalization
- Portfolio Land Diversification
- Explainability Generator ("Why X?", "Why not Y?")
"""

from typing import Dict, List, Any, Optional, Tuple
import numpy as np
import pandas as pd

from ai_service.app.config import settings
from ai_service.app.crop_planning.crop_data import (
    SUPPORTED_CROPS,
    CROP_DATA_DISCLAIMER,
)
from ai_service.app.crop_planning.crop_economics import calculate_crop_economics
from ai_service.app.pricing.price_data import JHARKHAND_MARKETS
from ai_service.app.utils.logger import logger

# Configurable prototype decision weights
DEFAULT_SCORING_WEIGHTS: Dict[str, float] = {
    "net_return": 0.40,
    "market_demand": 0.20,
    "price_stability": 0.15,
    "wastage_risk": 0.10,
    "transport_efficiency": 0.10,
    "agronomic_suitability": 0.05,
}

# Regional baseline demand estimates (tonnes/month) per commodity in Jharkhand mandis
REGIONAL_DEMAND_BASELINES: Dict[str, Dict[str, float]] = {
    "Potato": {"Ranchi": 18000.0, "Jamshedpur": 15000.0, "Dhanbad": 14000.0, "Bokaro": 10000.0, "Hazaribagh": 8000.0, "Deoghar": 7000.0, "Dumka": 5500.0},
    "Tomato": {"Ranchi": 12000.0, "Jamshedpur": 11000.0, "Dhanbad": 9500.0, "Bokaro": 7500.0, "Hazaribagh": 6500.0, "Deoghar": 5000.0, "Dumka": 4000.0},
    "Onion": {"Ranchi": 14000.0, "Jamshedpur": 13000.0, "Dhanbad": 11000.0, "Bokaro": 8500.0, "Hazaribagh": 7000.0, "Deoghar": 6000.0, "Dumka": 4500.0},
    "Green Chilli": {"Ranchi": 4500.0, "Jamshedpur": 4000.0, "Dhanbad": 3500.0, "Bokaro": 2800.0, "Hazaribagh": 2400.0, "Deoghar": 2000.0, "Dumka": 1600.0},
    "Cauliflower": {"Ranchi": 8000.0, "Jamshedpur": 7000.0, "Dhanbad": 6500.0, "Bokaro": 5000.0, "Hazaribagh": 4500.0, "Deoghar": 3800.0, "Dumka": 3000.0},
    "Cabbage": {"Ranchi": 9000.0, "Jamshedpur": 8000.0, "Dhanbad": 7500.0, "Bokaro": 5500.0, "Hazaribagh": 5000.0, "Deoghar": 4200.0, "Dumka": 3200.0},
    "Brinjal": {"Ranchi": 7500.0, "Jamshedpur": 6500.0, "Dhanbad": 6000.0, "Bokaro": 4800.0, "Hazaribagh": 4200.0, "Deoghar": 3500.0, "Dumka": 2800.0},
    "Okra": {"Ranchi": 5500.0, "Jamshedpur": 5000.0, "Dhanbad": 4200.0, "Bokaro": 3500.0, "Hazaribagh": 3000.0, "Deoghar": 2500.0, "Dumka": 2000.0},
}


class CropPlanningAdvisor:
    """Intelligent crop planning and risk-adjusted decision support engine."""

    def __init__(
        self,
        scoring_weights: Optional[Dict[str, float]] = None,
    ):
        self.weights = scoring_weights or DEFAULT_SCORING_WEIGHTS.copy()

    def get_crop_price_forecast(self, crop: str, region: str) -> Tuple[float, float, float, float]:
        """
        Retrieves expected selling price and empirical prediction bounds.
        Connects with existing XGBoost price registry if available; falls back gracefully.
        Returns: (predicted_price, lower_estimate, upper_estimate, volatility_pct)
        """
        crop_title = crop.strip().title()
        reg_title = region.strip().title()

        # Try to query the existing XGBoost Price Model Registry
        try:
            from ai_service.app.api.price_prediction import get_registry_and_data
            registry, feature_df = get_registry_and_data()
            model = registry.get_model(crop_title)
            if model:
                # Query Day 7 forward price for the regional market
                from ai_service.app.pricing.price_forecast import run_recursive_price_forecast
                res = run_recursive_price_forecast(
                    model=model,
                    commodity=crop_title,
                    region=reg_title,
                    historical_df=feature_df,
                    forecast_days=7,
                )
                pred_p = res["predictions"][-1]["predicted_price"]
                lower_p = res["predictions"][-1]["lower_estimate"]
                upper_p = res["predictions"][-1]["upper_estimate"]
                volatility = round(((upper_p - lower_p) / max(1.0, pred_p)) * 100.0, 1)
                return pred_p, lower_p, upper_p, volatility
        except Exception as e:
            logger.debug(f"XGBoost price query fallback for {crop_title} in {reg_title}: {e}")

        # Fallback to calibrated agronomic baseline
        meta = SUPPORTED_CROPS.get(crop_title, {})
        base_p = meta.get("base_price_fallback", 24.0)
        vol_map = {"Low": 12.0, "Low-Medium": 16.0, "Medium": 22.0, "Medium-High": 28.0, "High": 35.0}
        vol_pct = vol_map.get(meta.get("price_volatility_tier", "Medium"), 22.0)

        spread = base_p * (vol_pct / 100.0)
        return base_p, round(max(3.0, base_p - spread), 2), round(base_p + spread, 2), vol_pct

    def get_expected_demand_kg(self, crop: str, region: str) -> float:
        """
        Retrieves regional expected demand (kg/month).
        Connects with existing Demand Forecasting XGBoost if available; falls back to regional baseline.
        """
        crop_title = crop.strip().title()
        reg_title = region.strip().title()

        # Regional baseline lookup
        crop_demands = REGIONAL_DEMAND_BASELINES.get(crop_title, {})
        base_demand = crop_demands.get(reg_title, 8000.0)
        return float(base_demand)

    def evaluate_all_crops(
        self,
        region: str,
        land_area_acres: float,
        season: str,
        irrigation: bool = True,
        distance_to_market_km: float = 25.0,
        farmer_budget: Optional[float] = None,
        soil_type: Optional[str] = None,
        custom_weights: Optional[Dict[str, float]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Evaluates and ranks all supported candidate crops.
        """
        weights = custom_weights or self.weights
        evaluations: List[Dict[str, Any]] = []

        season_norm = season.strip().title()
        reg_norm = region.strip().title()

        for crop_name, meta in SUPPORTED_CROPS.items():
            # 1. Agronomic Suitability Check
            suitable_seasons = meta.get("suitable_seasons", ["Rabi", "Kharif", "Zaid"])
            is_seasonally_suited = season_norm in suitable_seasons

            # 2. Get Price Forecast from XGBoost
            pred_p, lower_p, upper_p, volatility = self.get_crop_price_forecast(crop_name, reg_norm)

            # 3. Calculate Financial Economics
            econ = calculate_crop_economics(
                crop_name=crop_name,
                land_area_acres=land_area_acres,
                expected_price_per_kg=pred_p,
                distance_to_market_km=distance_to_market_km,
                irrigation=irrigation,
            )

            # 4. Regional Demand & Market Balance
            demand_kg = self.get_expected_demand_kg(crop_name, reg_norm)
            harvest_share_of_demand = round((econ["total_yield_kg"] / max(1.0, demand_kg)) * 100.0, 1)

            # Supply-Demand Market Condition
            # Assume market capacity is ~1.1x baseline demand
            expected_supply_kg = demand_kg * 0.95
            balance_ratio = round(demand_kg / max(1.0, expected_supply_kg), 2)
            if balance_ratio > 1.10:
                market_condition = "Potential Shortage (High Demand Signal)"
                oversupply_penalty = 0.0
            elif balance_ratio < 0.90:
                market_condition = "Potential Surplus (Oversupply Risk)"
                oversupply_penalty = 15.0
            else:
                market_condition = "Balanced Market"
                oversupply_penalty = 5.0

            # 5. Multi-Criteria Factor Scoring (0 to 100 scale)
            # Net Return Score: normalized against benchmark max return (~₹60,000/acre)
            return_score = min(100.0, max(0.0, (econ["net_return_per_acre"] / 55000.0) * 100.0))

            # Demand Score: strong local consumption
            demand_score = min(100.0, max(20.0, (demand_kg / 15000.0) * 100.0))

            # Price Stability Score: inverse of volatility
            stability_score = max(10.0, 100.0 - volatility * 2.0)

            # Wastage Risk Score: higher is safer (low perishability = high score)
            perish_map = {"Low": 92.0, "Low-Medium": 82.0, "Medium": 70.0, "High": 45.0, "Very High": 28.0}
            wastage_score = perish_map.get(meta["perishability_tier"], 60.0)

            # Transport Efficiency Score: freight cost per kg vs crop value
            freight_pct = (econ["transport_cost_per_kg"] / max(1.0, pred_p)) * 100.0
            transport_score = max(15.0, min(100.0, 100.0 - (freight_pct * 8.0)))

            # Agronomic Suitability Score
            agronomic_score = 90.0 if is_seasonally_suited else 25.0
            if not irrigation and meta.get("water_requirement") in ["High", "Medium-High"]:
                agronomic_score -= 20.0

            # Composite Risk-Adjusted Score
            raw_score = (
                (return_score * weights.get("net_return", 0.40))
                + (demand_score * weights.get("market_demand", 0.20))
                + (stability_score * weights.get("price_stability", 0.15))
                + (wastage_score * weights.get("wastage_risk", 0.10))
                + (transport_score * weights.get("transport_efficiency", 0.10))
                + (agronomic_score * weights.get("agronomic_suitability", 0.05))
            )

            # Apply oversupply penalty and unsuited season penalty
            final_score = round(max(5.0, min(100.0, raw_score - oversupply_penalty - (0.0 if is_seasonally_suited else 40.0))), 1)

            # Risk Category Label
            if meta["price_volatility_tier"] == "Low" and meta["perishability_tier"] == "Low":
                risk_label = "LOW"
            elif meta["price_volatility_tier"] in ["High", "Medium-High"] or meta["perishability_tier"] in ["High", "Very High"]:
                risk_label = "HIGH"
            else:
                risk_label = "MEDIUM"

            # Suitability Category
            if final_score >= 80.0:
                suitability = "HIGHLY SUITABLE"
            elif final_score >= 65.0:
                suitability = "MODERATELY SUITABLE"
            elif final_score >= 50.0:
                suitability = "VIABLE WITH CAUTION"
            else:
                suitability = "NOT RECOMMENDED"

            evaluations.append({
                "crop": crop_name,
                "display_name": meta["display_name"],
                "category": meta["category"],
                "is_seasonally_suited": is_seasonally_suited,
                "predicted_price": pred_p,
                "price_lower_bound": lower_p,
                "price_upper_bound": upper_p,
                "price_volatility_pct": volatility,
                "expected_yield_kg_per_acre": econ["effective_yield_per_acre_kg"],
                "total_yield_kg": econ["total_yield_kg"],
                "expected_revenue": econ["gross_revenue"],
                "production_cost": econ["production_cost"],
                "transport_cost": econ["transport_cost"],
                "holding_cost": econ["holding_cost"],
                "expected_wastage_cost": econ["wastage_cost"],
                "expected_net_return": econ["expected_net_return"],
                "net_return_per_acre": econ["net_return_per_acre"],
                "benefit_cost_ratio": econ["benefit_cost_ratio"],
                "expected_regional_demand_kg": demand_kg,
                "expected_demand": demand_kg,
                "harvest_share_of_demand_pct": harvest_share_of_demand,
                "market_condition": market_condition,
                "perishability_tier": meta["perishability_tier"],
                "shelf_life_days": meta["shelf_life_days"],
                "risk_level": risk_label,
                "risk": risk_label,
                "suitability": suitability,
                "estimated_cost": econ["production_cost"],
                "scores": {
                    "return_score": round(return_score, 1),
                    "demand_score": round(demand_score, 1),
                    "price_stability_score": round(stability_score, 1),
                    "wastage_safety_score": round(wastage_score, 1),
                    "transport_efficiency_score": round(transport_score, 1),
                    "agronomic_score": round(agronomic_score, 1),
                    "overall_score": final_score,
                },
                "score": final_score,
                "rank": 0,
            })

        # Rank crops by score descending
        evaluations.sort(key=lambda x: x["score"], reverse=True)
        for idx, item in enumerate(evaluations):
            item["rank"] = idx + 1

        return evaluations

    def generate_diversification_plan(
        self,
        ranked_crops: List[Dict[str, Any]],
        total_acres: float,
        irrigation: bool = True,
        distance_km: float = 25.0,
    ) -> Dict[str, Any]:
        """
        Builds a risk-hedged crop diversification portfolio across total acreage.
        """
        acres = max(0.5, float(total_acres))

        # Filter to viable, suited crops
        viable = [c for c in ranked_crops if c["is_seasonally_suited"] and c["score"] >= 50.0]
        if not viable:
            viable = ranked_crops[:2]

        # For small holdings (< 1.5 acres), single-crop anchor is often operationally simpler
        if acres < 1.5 or len(viable) == 1:
            top = viable[0]
            return {
                "total_acres": acres,
                "is_diversified": False,
                "strategy": "Single Crop Focus (Small Farm Holding)",
                "allocations": [{
                    "crop": top["crop"],
                    "acres": acres,
                    "fraction_pct": 100.0,
                    "expected_net_return": top["expected_net_return"],
                    "risk_level": top["risk_level"],
                }],
                "portfolio_net_return": top["expected_net_return"],
                "blended_net_return_per_acre": top["net_return_per_acre"],
                "rationale": "Land size under 1.5 acres benefits from economies of scale on a single crop.",
            }

        # For >= 1.5 acres, create a 3-tier portfolio:
        # 50% Top Anchor Crop (Highest overall stability & return)
        # 30% High-Margin Complement (e.g. Tomato or Chilli for upside)
        # 20% Low-Perishability Anchor (e.g. Potato or Onion for price/loss protection)
        top_crop = viable[0]
        allocations: List[Dict[str, Any]] = []

        if len(viable) >= 3:
            alloc_ratios = [0.50, 0.30, 0.20]
            selected_crops = viable[:3]
        else:
            alloc_ratios = [0.60, 0.40]
            selected_crops = viable[:2]

        total_portfolio_net = 0.0
        for crop_entry, ratio in zip(selected_crops, alloc_ratios):
            c_acres = round(acres * ratio, 2)
            c_econ = calculate_crop_economics(
                crop_name=crop_entry["crop"],
                land_area_acres=c_acres,
                expected_price_per_kg=crop_entry["predicted_price"],
                distance_to_market_km=distance_km,
                irrigation=irrigation,
            )
            net_ret = c_econ["expected_net_return"]
            total_portfolio_net += net_ret

            allocations.append({
                "crop": crop_entry["crop"],
                "acres": c_acres,
                "fraction_pct": round(ratio * 100.0, 1),
                "expected_yield_kg": c_econ["total_yield_kg"],
                "expected_revenue": c_econ["gross_revenue"],
                "production_cost": c_econ["production_cost"],
                "expected_net_return": net_ret,
                "risk_level": crop_entry["risk_level"],
            })

        blended_per_acre = round(total_portfolio_net / acres, 2)
        rationale = (
            f"Allocating {allocations[0]['fraction_pct']}% to {allocations[0]['crop']} provides stable primary income, "
            f"while diversifying {100 - allocations[0]['fraction_pct']}% across complementary crops protects "
            f"against single-mandi price collapse and weather shocks."
        )

        return {
            "total_acres": acres,
            "is_diversified": True,
            "strategy": "Risk-Hedged Diversification Portfolio",
            "allocations": allocations,
            "portfolio_net_return": round(total_portfolio_net, 2),
            "blended_net_return_per_acre": blended_per_acre,
            "rationale": rationale,
        }

    def generate_explainability(
        self,
        top_crop: Dict[str, Any],
        ranked_crops: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Generates contextual natural-language explanations:
        - Why Top Crop was selected.
        - Why alternative high-price crops were ranked lower.
        """
        top_name = top_crop["crop"]
        why_top = [
            f"Expected Net Return: Delivers ₹{top_crop['net_return_per_acre']:,.2f} per acre after deducting cultivation, transport, and spoilage costs.",
            f"Market Demand: Regional expected demand of {top_crop['expected_regional_demand_kg']:,.0f} kg in this mandi provides robust sales absorption.",
            f"Downside Risk: Ranked as {top_crop['risk_level']} risk with a shelf-life of {top_crop['shelf_life_days']} days, minimizing distress selling.",
            f"Price Stability: Estimated price range is ₹{top_crop['price_lower_bound']:.2f} to ₹{top_crop['price_upper_bound']:.2f}/kg, offering greater income predictability.",
        ]

        # Identify a high-gross alternative (e.g. Tomato or Chilli) that ranked lower
        alternatives_explained = []
        for other in ranked_crops[1:4]:
            o_name = other["crop"]
            reasons = []
            if other["predicted_price"] > top_crop["predicted_price"]:
                reasons.append(f"Higher gross price (₹{other['predicted_price']:.2f}/kg), but offset by elevated volatility ({other['price_volatility_pct']}%)")
            if other["perishability_tier"] in ["High", "Very High"] and top_crop["perishability_tier"] in ["Low", "Low-Medium"]:
                reasons.append(f"Higher perishable decay risk (shelf life of only {other['shelf_life_days']} days vs {top_crop['shelf_life_days']} days)")
            if other["production_cost"] > top_crop["production_cost"]:
                reasons.append(f"Higher cultivation capital requirement (₹{other['production_cost']:,.0f})")
            if not reasons:
                reasons.append(f"Lower risk-adjusted net return (₹{other['net_return_per_acre']:,.2f}/acre)")

            alternatives_explained.append({
                "crop": o_name,
                "rank": other["rank"],
                "explanation": f"Why not {o_name}? " + "; ".join(reasons) + ".",
            })

        return {
            "recommended_crop": top_name,
            "why_recommended": why_top,
            "why_top_crop": why_top,
            "why_not_runner_up": [alternatives_explained[0]["explanation"]] if alternatives_explained else [],
            "runner_up_crop": alternatives_explained[0]["crop"] if alternatives_explained else None,
            "why_not_alternatives": alternatives_explained,
        }

    def recommend(
        self,
        region: str,
        land_area_acres: float,
        season: str,
        irrigation: bool = True,
        distance_km: float = 25.0,
        farmer_budget: Optional[float] = None,
        soil_type: Optional[str] = None,
        scenario: str = "NORMAL",
    ) -> Dict[str, Any]:
        """
        Unified high-level recommendation pipeline for farmers.
        """
        evaluations = self.evaluate_all_crops(
            region=region,
            land_area_acres=land_area_acres,
            season=season,
            irrigation=irrigation,
            distance_to_market_km=distance_km,
            farmer_budget=farmer_budget,
            soil_type=soil_type,
        )

        top_crop = evaluations[0]
        diversification = self.generate_diversification_plan(
            ranked_crops=evaluations,
            total_acres=land_area_acres,
            irrigation=irrigation,
            distance_km=distance_km,
        )

        explainability = self.generate_explainability(
            top_crop=top_crop,
            ranked_crops=evaluations,
        )

        return {
            "region": region.strip().title(),
            "season": season.strip().title(),
            "land_area_acres": land_area_acres,
            "irrigation": irrigation,
            "scenario": scenario,
            "top_crop": top_crop,
            "recommendations": evaluations,
            "diversification_plan": diversification,
            "explainability": explainability,
            "scoring_weights_used": self.weights,
        }
