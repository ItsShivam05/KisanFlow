"""
Model Explainability for Agricultural Price Predictions.

Extracts feature importance and contextual factor attribution from the trained XGBoost model.
Provides human-readable reasons explaining price direction and volatility.
"""

from typing import Dict, List, Any, Optional
import numpy as np
import pandas as pd


FEATURE_HUMAN_NAMES = {
    "price_lag_1": "Yesterday's Mandi Closing Price",
    "price_lag_7": "7-Day Historical Price Level",
    "price_rolling_mean_7": "Recent 7-Day Average Price Baseline",
    "price_rolling_mean_14": "14-Day Price Baseline",
    "price_rolling_std_7": "Recent Market Price Volatility",
    "price_change_1d": "1-Day Price Momentum",
    "price_change_7d": "Weekly Price Trajectory",
    "neighbor_market_price": "Neighboring Regional Mandi Prices",
    "neighbor_market_price_change": "Regional Cross-Market Momentum",
    "distance_to_ranchi_km": "Transit Distance from Central Terminal Mandi",
    "season_code": "Crop Seasonality (Kharif / Rabi / Zaid)",
    "is_weekend": "Weekend Retail Consumer Demand Surge",
    "is_festival_season": "Local Festival Demand Surge (Chhath/Diwali)",
    "market_arrivals_lag_1": "Daily Mandi Crop Inflow (Arrivals)",
    "arrivals_rolling_mean_7": "Average Weekly Mandi Arrival Volume",
    "rainfall_rolling_sum_7": "Recent Regional Rainfall & Supply Disruption",
    "temperature_lag_1": "Ambient Temperature & Crop Perishability Pressure",
    "predicted_demand_lag_1": "Local Consumer Demand Forecast",
}


def extract_feature_importance(model: Any, feature_names: List[str]) -> List[Dict[str, Any]]:
    """
    Extract normalized feature importance from an XGBoost or Tree-based regressor.
    """
    if hasattr(model, "feature_importances_"):
        raw_importances = model.feature_importances_
    elif hasattr(model, "get_booster"):
        score_dict = model.get_booster().get_score(importance_type="gain")
        raw_importances = [score_dict.get(f"f{i}", score_dict.get(f, 0.0)) for i, f in enumerate(feature_names)]
    else:
        raw_importances = [1.0 / len(feature_names)] * len(feature_names)

    raw_arr = np.array(raw_importances, dtype=float)
    total = raw_arr.sum()
    norm_arr = (raw_arr / total) if total > 0 else raw_arr

    importance_list = []
    for feat, score in zip(feature_names, norm_arr):
        importance_list.append({
            "feature": feat,
            "display_name": FEATURE_HUMAN_NAMES.get(feat, feat.replace("_", " ").title()),
            "importance_score": round(float(score), 4),
            "percentage": round(float(score) * 100.0, 1),
        })

    importance_list.sort(key=lambda x: x["importance_score"], reverse=True)
    return importance_list


def generate_prediction_explanation(
    feature_row: Dict[str, Any],
    top_importances: List[Dict[str, Any]],
    current_price: float,
    predicted_price: float,
    max_factors: int = 5,
) -> List[str]:
    """
    Construct human-readable narrative explanations for the predicted price direction.
    """
    explanations: List[str] = []
    price_diff = predicted_price - current_price

    direction_str = "upward pressure" if price_diff > 0 else "downward pressure"
    diff_abs = abs(price_diff)

    # 1. Primary momentum factor
    lag1 = feature_row.get("price_lag_1", current_price)
    ma7 = feature_row.get("price_rolling_mean_7", current_price)
    if ma7 > 0:
        pct_vs_ma7 = ((lag1 - ma7) / ma7) * 100.0
        if abs(pct_vs_ma7) >= 3.0:
            trend = "above" if pct_vs_ma7 > 0 else "below"
            explanations.append(
                f"Recent 7-day price trend: Current spot is {abs(pct_vs_ma7):.1f}% {trend} the 7-day average baseline (₹{ma7:.1f}/kg)."
            )

    # 2. Seasonality factor
    season_code = feature_row.get("season_code", 0)
    seasons = {0: "Kharif (Monsoon)", 1: "Rabi (Winter/Spring)", 2: "Zaid (Summer)"}
    season_name = seasons.get(season_code, "Active season")
    explanations.append(f"Agricultural calendar: Currently in {season_name} harvest cycle affecting regional availability.")

    # 3. Spatial regional factor
    neighbor_p = feature_row.get("neighbor_market_price", 0.0)
    if neighbor_p and neighbor_p > 0:
        spread = current_price - neighbor_p
        if abs(spread) >= 1.5:
            spread_type = "premium" if spread > 0 else "discount"
            explanations.append(
                f"Neighboring mandi signal: Regional Jharkhand benchmark is ₹{neighbor_p:.1f}/kg (trading at ₹{abs(spread):.1f}/kg {spread_type})."
            )

    # 4. Weekend / Festival factor
    if feature_row.get("is_festival_season") == 1:
        explanations.append("Festival demand: Active festive period (Durga Puja/Diwali/Chhath) driving higher consumer volume.")
    elif feature_row.get("is_weekend") == 1:
        explanations.append("Weekend retail effect: Higher weekend consumer buying supporting wholesale mandi clearance.")

    # 5. Arrivals factor (if present)
    arrivals = feature_row.get("market_arrivals_lag_1", 0.0)
    avg_arrivals = feature_row.get("arrivals_rolling_mean_7", 0.0)
    if arrivals > 0 and avg_arrivals > 0:
        arr_pct = ((arrivals - avg_arrivals) / avg_arrivals) * 100.0
        if abs(arr_pct) >= 10.0:
            arr_flow = "higher" if arr_pct > 0 else "lower"
            impact = "dampening prices" if arr_pct > 0 else "supporting price firming"
            explanations.append(f"Mandi arrivals: Recent inflow is {abs(arr_pct):.0f}% {arr_flow} than weekly average, {impact}.")

    # 6. Overall net direction summary
    if not explanations:
        explanations.append(f"Stable regional market conditions project a price change of ₹{diff_abs:.2f}/kg ({direction_str}).")

    return explanations[:max_factors]
