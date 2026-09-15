"""
Recursive Multi-Step Price Forecasting Engine.

Implements:
- 1-day, 3-day, and 7-day forward recursive price forecasting.
- Iterative feature state update (lags, rolling means, momentum).
- Natural progression of temporal features (day_of_week, day_of_month, is_weekend).
- Explicit declaration of assumptions: exogenous weather and demand are held constant at latest observed values.
- Estimated prediction ranges calculated from empirical validation residual bounds.
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
import numpy as np
import pandas as pd
from ai_service.app.pricing.price_data import JHARKHAND_MARKETS, SUPPORTED_COMMODITIES
from ai_service.app.pricing.price_features import determine_agricultural_season, compute_ranchi_distance_map
from ai_service.app.pricing.price_model import CommodityPriceModel, JharkhandPriceModelRegistry
from ai_service.app.pricing.price_explainability import generate_prediction_explanation
from ai_service.app.utils.logger import logger


def run_recursive_price_forecast(
    model: CommodityPriceModel,
    commodity: str,
    region: str,
    historical_df: pd.DataFrame,
    forecast_days: int = 7,
) -> Dict[str, Any]:
    """
    Perform multi-step recursive price forecasting.
    
    Returns:
    - current_price: Latest observed modal price (INR/kg)
    - predictions: List of daily forecast dicts (date, predicted_price, lower_estimate, upper_estimate)
    - explainability_factors: Major contributing factors driving the forecast
    - assumptions: Explicit documentation of held-constant variables
    """
    commodity = commodity.strip().title()
    region = region.strip().title()

    if region not in JHARKHAND_MARKETS:
        raise ValueError(f"Unknown region '{region}'. Supported Jharkhand markets: {list(JHARKHAND_MARKETS.keys())}")

    # Filter historical slice for this (commodity, region)
    slice_df = historical_df[
        (historical_df["commodity"] == commodity) & (historical_df["region"] == region)
    ].sort_values("date").copy()

    if len(slice_df) < 30:
        raise ValueError(f"Need at least 30 historical records for {commodity} in {region} to initialize lag features.")

    latest_row = slice_df.iloc[-1]
    latest_date = pd.to_datetime(latest_row["date"])
    current_price = float(latest_row["modal_price"])

    # Recent price history buffer (last 35 days) for computing lags and rolling stats
    price_history: List[float] = list(slice_df["modal_price"].tail(35).astype(float).values)
    neighbor_history: List[float] = list(slice_df["neighbor_market_price"].tail(35).astype(float).values) if "neighbor_market_price" in slice_df.columns else [current_price] * 35

    # Static / slow-moving contextual metadata
    dist_map = compute_ranchi_distance_map()
    dist_to_ranchi = dist_map.get(region, 0.0)

    # Encode categorical codes
    commodities = sorted(SUPPORTED_COMMODITIES.keys())
    regions = sorted(JHARKHAND_MARKETS.keys())
    comm_code = commodities.index(commodity) if commodity in commodities else 0
    reg_code = regions.index(region) if region in regions else 0

    # Latest known exogenous covariates
    arrivals_val = float(latest_row.get("market_arrivals_lag_1", 25.0))
    rain_val = float(latest_row.get("rainfall_rolling_sum_7", 0.0))
    temp_val = float(latest_row.get("temperature_lag_1", 25.0))
    demand_val = float(latest_row.get("predicted_demand_lag_1", 15000.0))

    predictions: List[Dict[str, Any]] = []
    current_step_date = latest_date

    first_day_features: Optional[Dict[str, Any]] = None

    for step in range(1, forecast_days + 1):
        current_step_date += timedelta(days=1)
        dow = current_step_date.weekday()
        dom = current_step_date.day
        month = current_step_date.month
        woy = int(current_step_date.isocalendar()[1])
        is_wknd = 1 if dow in (5, 6) else 0

        season = determine_agricultural_season(month)
        season_code = {"Kharif": 0, "Rabi": 1, "Zaid": 2}.get(season, 0)
        is_fest = 1 if (((month == 10) and (dom >= 15)) or ((month == 11) and (dom <= 20))) else 0

        # Construct feature row using price_history[-1] as lag_1, [-2] as lag_2, etc.
        p_lag1 = price_history[-1]
        p_lag2 = price_history[-2] if len(price_history) >= 2 else p_lag1
        p_lag3 = price_history[-3] if len(price_history) >= 3 else p_lag2
        p_lag7 = price_history[-7] if len(price_history) >= 7 else p_lag1
        p_lag14 = price_history[-14] if len(price_history) >= 14 else p_lag1
        p_lag21 = price_history[-21] if len(price_history) >= 21 else p_lag1
        p_lag30 = price_history[-30] if len(price_history) >= 30 else p_lag1

        # Rolling means strictly on lagged history
        rm_3 = float(np.mean(price_history[-3:]))
        rm_7 = float(np.mean(price_history[-7:]))
        rm_14 = float(np.mean(price_history[-14:]))
        rm_30 = float(np.mean(price_history[-30:]))

        rstd_7 = float(np.std(price_history[-7:])) if len(price_history) >= 7 else 0.0
        rstd_14 = float(np.std(price_history[-14:])) if len(price_history) >= 14 else 0.0
        rstd_30 = float(np.std(price_history[-30:])) if len(price_history) >= 30 else 0.0

        # Momentum
        p_chg_1d = p_lag1 - p_lag2
        p_chg_7d = p_lag1 - p_lag7
        p_chg_14d = p_lag1 - p_lag14

        # Spatial
        neigh_p = neighbor_history[-1] if neighbor_history else p_lag1
        neigh_chg = (neighbor_history[-1] - neighbor_history[-2]) if len(neighbor_history) >= 2 else 0.0

        feature_row: Dict[str, Any] = {
            "commodity_code": comm_code,
            "region_code": reg_code,
            "day_of_week": dow,
            "day_of_month": dom,
            "month": month,
            "week_of_year": woy,
            "is_weekend": is_wknd,
            "season_code": season_code,
            "is_festival_season": is_fest,
            "price_lag_1": p_lag1,
            "price_lag_2": p_lag2,
            "price_lag_3": p_lag3,
            "price_lag_7": p_lag7,
            "price_lag_14": p_lag14,
            "price_lag_21": p_lag21,
            "price_lag_30": p_lag30,
            "price_rolling_mean_3": rm_3,
            "price_rolling_mean_7": rm_7,
            "price_rolling_mean_14": rm_14,
            "price_rolling_mean_30": rm_30,
            "price_rolling_std_7": rstd_7,
            "price_rolling_std_14": rstd_14,
            "price_rolling_std_30": rstd_30,
            "price_change_1d": p_chg_1d,
            "price_change_7d": p_chg_7d,
            "price_change_14d": p_chg_14d,
            "neighbor_market_price": neigh_p,
            "neighbor_market_price_change": neigh_chg,
            "distance_to_ranchi_km": dist_to_ranchi,
            "market_arrivals_lag_1": arrivals_val,
            "arrivals_rolling_mean_7": arrivals_val,
            "rainfall_rolling_sum_7": rain_val,
            "temperature_lag_1": temp_val,
            "predicted_demand_lag_1": demand_val,
        }

        if step == 1:
            first_day_features = feature_row.copy()

        # Run inference
        pred_p, lower_est, upper_est = model.predict_one(feature_row)

        predictions.append({
            "horizon_day": step,
            "date": current_step_date.strftime("%Y-%m-%d"),
            "predicted_price": pred_p,
            "lower_estimate": lower_est,
            "upper_estimate": upper_est,
            "price_change_vs_current": round(pred_p - current_price, 2),
        })

        # Append recursive prediction to price_history buffer for subsequent steps
        price_history.append(pred_p)
        neighbor_history.append(neigh_p)

    # Generate explainability narrative using day 1 feature vector
    explain_factors = generate_prediction_explanation(
        feature_row=first_day_features or {},
        top_importances=model.feature_importances[:5],
        current_price=current_price,
        predicted_price=predictions[0]["predicted_price"] if predictions else current_price,
    )

    assumptions = [
        "Calendar variables (day of week, date, month, weekend) advance chronologically.",
        "Lag and rolling features are updated recursively with each predicted step.",
        "Exogenous weather and arrival covariates are assumed stable at latest observed levels.",
        "Forecast ranges represent empirical validation error dispersion (10th-90th percentiles), not a statistically guaranteed confidence interval.",
    ]

    return {
        "commodity": commodity,
        "region": region,
        "current_price": current_price,
        "forecast_days": forecast_days,
        "model_name": "XGBoost Regressor",
        "predictions": predictions,
        "explainability_factors": explain_factors,
        "top_features": model.feature_importances[:5],
        "assumptions": assumptions,
    }
