"""
Feature Engineering for Agricultural Price Forecasting.

Enforces:
- Strict chronological ordering per (commodity, region).
- ZERO target leakage: all lag, rolling, and momentum features use data strictly prior to time t (<= t-1).
- Comprehensive feature taxonomy:
  A. Historical price lags (1, 2, 3, 7, 14, 21, 30)
  B. Rolling means (3, 7, 14, 30) and rolling standard deviations (7, 14, 30)
  C. Price momentum / velocity (1d, 7d, 14d)
  D. Calendar & agricultural seasons (Kharif, Rabi, Zaid, day of week, weekend, month, week of year)
  E. Spatial / cross-market price signals (neighboring mandi average price lag & momentum)
  F. Optional covariates (arrivals, weather, demand) handled gracefully without fabrication
"""

from typing import Dict, List, Optional, Tuple, Any
import numpy as np
import pandas as pd
from ai_service.app.pricing.price_data import JHARKHAND_MARKETS
from ai_service.route_optimization.distance import calculate_distance
from ai_service.route_optimization.models import Location
from ai_service.app.utils.logger import logger



PRICE_FEATURE_COLUMNS = [
    # Categorical & Temporal codes
    "commodity_code",
    "region_code",
    "day_of_week",
    "day_of_month",
    "month",
    "week_of_year",
    "is_weekend",
    "season_code",
    "is_festival_season",
    # Historical price lags
    "price_lag_1",
    "price_lag_2",
    "price_lag_3",
    "price_lag_7",
    "price_lag_14",
    "price_lag_21",
    "price_lag_30",
    # Rolling price statistics (strictly prior to t)
    "price_rolling_mean_3",
    "price_rolling_mean_7",
    "price_rolling_mean_14",
    "price_rolling_mean_30",
    "price_rolling_std_7",
    "price_rolling_std_14",
    "price_rolling_std_30",
    # Price momentum
    "price_change_1d",
    "price_change_7d",
    "price_change_14d",
    # Spatial neighbor features
    "neighbor_market_price",
    "neighbor_market_price_change",
    "distance_to_ranchi_km",
    # Optional covariates (fallback-safe)
    "market_arrivals_lag_1",
    "arrivals_rolling_mean_7",
    "rainfall_rolling_sum_7",
    "temperature_lag_1",
    "predicted_demand_lag_1",
]


def determine_agricultural_season(month: int) -> str:
    """
    Classify Indian agricultural seasons in Jharkhand:
    - Kharif: June (6) to October (10) - Monsoon crops
    - Rabi: November (11) to March (3) - Winter crops
    - Zaid: April (4) to May (5) - Summer crops
    """
    if 6 <= month <= 10:
        return "Kharif"
    elif month >= 11 or month <= 3:
        return "Rabi"
    else:
        return "Zaid"


def compute_ranchi_distance_map() -> Dict[str, float]:
    """Compute distance from each Jharkhand market to Ranchi central terminal hub."""
    ranchi_loc = Location(
        id="Ranchi",
        name="Ranchi Mandi Hub",
        latitude=JHARKHAND_MARKETS["Ranchi"]["latitude"],
        longitude=JHARKHAND_MARKETS["Ranchi"]["longitude"],
    )
    dist_map: Dict[str, float] = {}
    for region, meta in JHARKHAND_MARKETS.items():
        if region == "Ranchi":
            dist_map[region] = 0.0
        else:
            loc = Location(
                id=region,
                name=f"{region} Mandi",
                latitude=meta["latitude"],
                longitude=meta["longitude"],
            )
            dist_map[region] = calculate_distance(loc, ranchi_loc)
    return dist_map



def engineer_price_features(
    df: pd.DataFrame,
    drop_na_lags: bool = True,
) -> pd.DataFrame:
    """
    Transforms clean daily price records into leakage-free time-series features.
    
    CRITICAL:
    - All lags are shifted by at least 1 day (`shift(1)`).
    - Rolling calculations are performed on the lagged series so today's target (t)
      is never included in the rolling window.
    """
    data = df.copy()
    data["date"] = pd.to_datetime(data["date"])
    data = data.sort_values(by=["commodity", "region", "date"]).reset_index(drop=True)

    # 1. Calendar & Seasonal features
    data["day_of_week"] = data["date"].dt.weekday
    data["day_of_month"] = data["date"].dt.day
    data["month"] = data["date"].dt.month
    data["week_of_year"] = data["date"].dt.isocalendar().week.astype(int)
    data["is_weekend"] = data["day_of_week"].isin([5, 6]).astype(int)

    data["season"] = data["month"].apply(determine_agricultural_season)
    season_map = {"Kharif": 0, "Rabi": 1, "Zaid": 2}
    data["season_code"] = data["season"].map(season_map).fillna(0).astype(int)

    # Festival season in eastern India / Jharkhand (Durga Puja, Diwali, Chhath Puja)
    data["is_festival_season"] = (
        ((data["month"] == 10) & (data["day_of_month"] >= 15))
        | ((data["month"] == 11) & (data["day_of_month"] <= 20))
    ).astype(int)

    # 2. Distance to central state hub (Ranchi)
    dist_to_ranchi = compute_ranchi_distance_map()
    data["distance_to_ranchi_km"] = data["region"].map(dist_to_ranchi).fillna(0.0)

    # 3. Spatial Cross-Market Signals
    # Calculate daily average modal price for each commodity across all regions
    spatial_avg = (
        data.groupby(["commodity", "date"])["modal_price"]
        .mean()
        .reset_index()
        .rename(columns={"modal_price": "statewide_avg_modal"})
    )
    data = pd.merge(data, spatial_avg, on=["commodity", "date"], how="left")

    # Grouped feature engineering per (commodity, region)
    feature_dfs: List[pd.DataFrame] = []

    for (commodity, region), group in data.groupby(["commodity", "region"]):
        grp = group.sort_values("date").copy()
        target_series = grp["modal_price"]

        # A. Historical price lags (Strictly t-1, t-2, etc.)
        for lag in [1, 2, 3, 7, 14, 21, 30]:
            grp[f"price_lag_{lag}"] = target_series.shift(lag)

        # B. Rolling price statistics on lagged series (zero leakage)
        # Using lagged series ensures the window covers [t-k, t-1]
        lagged_p = grp["price_lag_1"]
        for window in [3, 7, 14, 30]:
            grp[f"price_rolling_mean_{window}"] = lagged_p.rolling(window=window, min_periods=max(1, window // 2)).mean()

        for window in [7, 14, 30]:
            grp[f"price_rolling_std_{window}"] = lagged_p.rolling(window=window, min_periods=3).std().fillna(0.0)

        # C. Price momentum
        grp["price_change_1d"] = grp["price_lag_1"] - grp["price_lag_2"]
        grp["price_change_7d"] = grp["price_lag_1"] - grp["price_lag_7"]
        grp["price_change_14d"] = grp["price_lag_1"] - grp["price_lag_14"]

        # D. Spatial neighbor price: statewide avg lagged by 1 day
        state_lag = grp["statewide_avg_modal"].shift(1)
        grp["neighbor_market_price"] = state_lag
        grp["neighbor_market_price_change"] = state_lag - grp["statewide_avg_modal"].shift(2)

        # E. Optional covariates (arrivals, weather, demand)
        if "market_arrivals_tonnes" in grp.columns:
            arr_lag = grp["market_arrivals_tonnes"].shift(1)
            grp["market_arrivals_lag_1"] = arr_lag
            grp["arrivals_rolling_mean_7"] = arr_lag.rolling(7, min_periods=2).mean()
        else:
            grp["market_arrivals_lag_1"] = 0.0
            grp["arrivals_rolling_mean_7"] = 0.0

        if "rainfall_mm" in grp.columns:
            rain_lag = grp["rainfall_mm"].shift(1)
            grp["rainfall_rolling_sum_7"] = rain_lag.rolling(7, min_periods=1).sum()
        else:
            grp["rainfall_rolling_sum_7"] = 0.0

        if "temperature_c" in grp.columns:
            grp["temperature_lag_1"] = grp["temperature_c"].shift(1)
        else:
            grp["temperature_lag_1"] = 25.0

        if "predicted_demand_kg" in grp.columns:
            grp["predicted_demand_lag_1"] = grp["predicted_demand_kg"].shift(1)
        else:
            grp["predicted_demand_lag_1"] = 0.0

        feature_dfs.append(grp)

    combined = pd.concat(feature_dfs, ignore_index=True)
    combined = combined.sort_values(by=["commodity", "region", "date"]).reset_index(drop=True)

    # Integer codes for categorical encoders
    commodities = sorted(combined["commodity"].unique())
    regions = sorted(combined["region"].unique())
    comm_map = {c: idx for idx, c in enumerate(commodities)}
    reg_map = {r: idx for idx, r in enumerate(regions)}

    combined["commodity_code"] = combined["commodity"].map(comm_map).astype(int)
    combined["region_code"] = combined["region"].map(reg_map).astype(int)

    if drop_na_lags:
        # Longest lag is 30 days
        initial_len = len(combined)
        combined = combined.dropna(subset=["price_lag_30", "price_rolling_mean_30"]).reset_index(drop=True)
        dropped = initial_len - len(combined)
        logger.info(f"Dropped {dropped} initial warm-up rows containing NaN values from the 30-day lag window.")

    return combined


def generate_price_features(df: pd.DataFrame) -> pd.DataFrame:
    """Convenience pipeline function."""
    return engineer_price_features(df, drop_na_lags=True)
