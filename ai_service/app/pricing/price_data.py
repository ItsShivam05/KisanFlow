"""
Jharkhand Agricultural Price Data Pipeline & Cleaning.

Handles:
- Jharkhand pilot market metadata and geographical coordinates.
- Extensible commodity configuration (Tomato, Potato, Onion, Green Chilli).
- Clearly labeled reproducible synthetic development dataset generator for pilot testing.
- Strict data cleaning, schema validation, anomaly detection, and IQR clipping.
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
import numpy as np
import pandas as pd
from ai_service.app.utils.logger import logger

# Pilot Geography: Jharkhand Markets & Coordinates (Latitude, Longitude)
JHARKHAND_MARKETS: Dict[str, Dict[str, Any]] = {
    "Ranchi": {
        "latitude": 23.3441,
        "longitude": 85.3096,
        "market_type": "Terminal Mandi",
        "mandi_name": "Ranchi APMC Pandra Mandi",
        "district": "Ranchi",
        "avg_daily_capacity_tonnes": 150.0,
    },
    "Jamshedpur": {
        "latitude": 22.8046,
        "longitude": 86.2029,
        "market_type": "Industrial Consumption Hub",
        "mandi_name": "Jamshedpur Sakchi Wholesale Mandi",
        "district": "East Singhbhum",
        "avg_daily_capacity_tonnes": 120.0,
    },
    "Dhanbad": {
        "latitude": 23.7957,
        "longitude": 86.4304,
        "market_type": "Urban Mining Consumption Hub",
        "mandi_name": "Dhanbad APMC Barwadda Mandi",
        "district": "Dhanbad",
        "avg_daily_capacity_tonnes": 100.0,
    },
    "Bokaro": {
        "latitude": 23.6693,
        "longitude": 86.1511,
        "market_type": "Urban Wholesale Market",
        "mandi_name": "Bokaro Chas Krishi Mandi",
        "district": "Bokaro",
        "avg_daily_capacity_tonnes": 80.0,
    },
    "Hazaribagh": {
        "latitude": 23.9925,
        "longitude": 85.3637,
        "market_type": "Agricultural Production Center",
        "mandi_name": "Hazaribagh Mandi Samiti",
        "district": "Hazaribagh",
        "avg_daily_capacity_tonnes": 70.0,
    },
    "Deoghar": {
        "latitude": 24.4826,
        "longitude": 86.7001,
        "market_type": "Regional Hub / Pilgrimage Demand",
        "mandi_name": "Deoghar Mohanpur APMC",
        "district": "Deoghar",
        "avg_daily_capacity_tonnes": 60.0,
    },
    "Dumka": {
        "latitude": 24.2676,
        "longitude": 87.2504,
        "market_type": "Santhal Pargana District Mandi",
        "mandi_name": "Dumka Subdivisional Mandi",
        "district": "Dumka",
        "avg_daily_capacity_tonnes": 50.0,
    },
}

# Supported Commodities & Economic Baseline Parameters
SUPPORTED_COMMODITIES: Dict[str, Dict[str, Any]] = {
    "Tomato": {
        "base_price_inr": 24.0,
        "price_volatility": 0.28,
        "perishability_tier": "High",
        "holding_loss_rate_per_day": 0.025,  # 2.5% daily value loss
        "consumer_threshold_price": 45.0,
        "unit": "kg",
    },
    "Potato": {
        "base_price_inr": 19.5,
        "price_volatility": 0.14,
        "perishability_tier": "Low",
        "holding_loss_rate_per_day": 0.005,  # 0.5% daily value loss
        "consumer_threshold_price": 35.0,
        "unit": "kg",
    },
    "Onion": {
        "base_price_inr": 27.0,
        "price_volatility": 0.22,
        "perishability_tier": "Medium",
        "holding_loss_rate_per_day": 0.012,  # 1.2% daily value loss
        "consumer_threshold_price": 50.0,
        "unit": "kg",
    },
    "Green Chilli": {
        "base_price_inr": 48.0,
        "price_volatility": 0.32,
        "perishability_tier": "High",
        "holding_loss_rate_per_day": 0.030,  # 3.0% daily value loss
        "consumer_threshold_price": 85.0,
        "unit": "kg",
    },
}

REQUIRED_PRICE_COLUMNS = [
    "date",
    "commodity",
    "region",
    "minimum_price",
    "maximum_price",
    "modal_price",
]

SYNTHETIC_DATA_DISCLAIMER = (
    "# NOTICE: This is a clearly labelled SYNTHETIC DEVELOPMENT DATASET for pilot prototyping "
    "and testing of the KisanFlow price prediction and farmer profit optimization module in Jharkhand, India. "
    "Do NOT present this as real Agmarknet or actual mandi transaction records."
)


def generate_jharkhand_synthetic_price_data(
    start_date: str = "2024-01-01",
    end_date: str = "2026-02-28",
    random_seed: int = 42,
) -> pd.DataFrame:
    """
    Generate a realistic, multi-season synthetic price dataset for Jharkhand agricultural markets.

    Models:
    - Seasonal cycles:
      * Tomato: Price surge in monsoon (July-Aug), harvest dip in winter (Jan-Feb).
      * Potato: Peak harvest dip in March-April, gradual storage rise in Oct-Nov.
      * Onion: Monsoon/post-monsoon supply crunch (Sept-Nov), Rabi harvest dip in May.
      * Green Chilli: Hot summer price surges, winter moderate baseline.
    - Regional spatial price gradients (Consumption centers like Jamshedpur/Dhanbad
      trade at a ₹2-₹5 premium over production hubs like Hazaribagh/Ranchi).
    - Market arrivals, supply index, and rainfall/temperature covariates.
    """
    rng = np.random.default_rng(random_seed)
    date_range = pd.date_range(start=start_date, end=end_date, freq="D")
    records: List[Dict[str, Any]] = []

    # Regional demand/cost premiums in Jharkhand
    regional_premium_map = {
        "Ranchi": 0.0,         # Baseline central hub
        "Jamshedpur": 3.2,     # High urban/industrial purchasing power
        "Dhanbad": 2.4,        # Mining consumption center
        "Bokaro": 1.5,         # Industrial town
        "Hazaribagh": -1.8,    # Agricultural production basin (lower prices at farm gate)
        "Deoghar": 0.8,        # Moderate regional center
        "Dumka": -1.2,         # Rural peripheral district
    }

    for current_date in date_range:
        day_of_year = current_date.dayofyear
        month = current_date.month
        day_of_week = current_date.weekday()

        # Simulated weather covariates for Jharkhand
        is_monsoon = 6 <= month <= 9
        rainfall_mm = round(float(rng.exponential(12.0) if is_monsoon else rng.exponential(1.5)), 2)
        if not is_monsoon and rng.random() > 0.3:
            rainfall_mm = 0.0

        temp_c = round(float(25.0 + 8.0 * np.sin(2 * np.pi * (day_of_year - 105) / 365) + rng.normal(0, 1.8)), 1)
        humidity_pct = round(float(min(98.0, max(25.0, 60.0 + (25.0 if is_monsoon else -15.0) + rng.normal(0, 5.0)))), 1)

        # Festival demand surge (Durga Puja, Diwali, Chhath Puja in Jharkhand, late Oct to mid Nov)
        is_festival_season = (month == 10 and current_date.day >= 15) or (month == 11 and current_date.day <= 20)
        festival_factor = 1.15 if is_festival_season else 1.0

        for commodity, meta in SUPPORTED_COMMODITIES.items():
            base_price = meta["base_price_inr"]
            volatility = meta["price_volatility"]

            # Commodity-specific seasonal factor
            if commodity == "Tomato":
                # Monsoon disruption (July-Sept) + Winter glut (Jan-Feb)
                seasonal_factor = (
                    1.0
                    + 0.35 * np.sin(2 * np.pi * (day_of_year - 180) / 365)  # Peak in monsoon
                    - 0.20 * np.cos(2 * np.pi * (day_of_year - 30) / 365)   # Low in winter
                )
            elif commodity == "Potato":
                # Storage crop: Lowest during Feb-April harvest, rises towards Oct-Nov
                seasonal_factor = (
                    1.0
                    + 0.22 * np.sin(2 * np.pi * (day_of_year - 240) / 365)
                )
            elif commodity == "Onion":
                # Post-monsoon spike (Sept-Nov), low in summer harvest (April-May)
                seasonal_factor = (
                    1.0
                    + 0.30 * np.sin(2 * np.pi * (day_of_year - 270) / 365)
                )
            else:  # Green Chilli
                seasonal_factor = (
                    1.0
                    + 0.25 * np.sin(2 * np.pi * (day_of_year - 120) / 365)
                    + 0.15 * (1.0 if is_monsoon else 0.0)
                )

            # Weekend retail demand push
            weekend_boost = 1.04 if day_of_week in (5, 6) else 1.0

            for region in JHARKHAND_MARKETS.keys():
                reg_prem = regional_premium_map.get(region, 0.0)
                
                # Market arrivals inversely correlate with price
                market_capacity = JHARKHAND_MARKETS[region]["avg_daily_capacity_tonnes"]
                supply_shock = float(rng.normal(0, 0.12))
                arrivals_tonnes = max(
                    5.0,
                    round(market_capacity * (1.0 / max(0.6, seasonal_factor)) * (1.0 + supply_shock), 1)
                )
                supply_level = "HIGH" if arrivals_tonnes > market_capacity * 1.1 else (
                    "LOW" if arrivals_tonnes < market_capacity * 0.9 else "MODERATE"
                )

                # Simulated wholesale modal price
                noise = float(rng.normal(0, volatility * base_price * 0.4))
                raw_modal = (base_price * seasonal_factor * weekend_boost * festival_factor) + reg_prem + noise
                modal_price = max(6.0, round(raw_modal, 2))

                # Spread between minimum and maximum price in mandi auction
                spread_pct = float(rng.uniform(0.08, 0.16))
                min_price = max(4.0, round(modal_price * (1.0 - spread_pct), 2))
                max_price = round(modal_price * (1.0 + spread_pct * 1.15), 2)

                # Correlated regional consumption demand
                predicted_demand_kg = round(arrivals_tonnes * 1000.0 * float(rng.uniform(0.85, 1.15)), 0)

                records.append({
                    "date": current_date.strftime("%Y-%m-%d"),
                    "commodity": commodity,
                    "region": region,
                    "minimum_price": min_price,
                    "maximum_price": max_price,
                    "modal_price": modal_price,
                    "market_arrivals_tonnes": arrivals_tonnes,
                    "market_supply_level": supply_level,
                    "rainfall_mm": rainfall_mm,
                    "temperature_c": temp_c,
                    "humidity_pct": humidity_pct,
                    "predicted_demand_kg": predicted_demand_kg,
                })

    df = pd.DataFrame(records)
    logger.info(
        f"Generated Jharkhand synthetic price dataset: {len(df)} records "
        f"across {len(JHARKHAND_MARKETS)} markets and {len(SUPPORTED_COMMODITIES)} commodities."
    )
    return df


def clean_and_validate_price_data(
    df: pd.DataFrame,
    iqr_multiplier: float = 1.5,
) -> pd.DataFrame:
    """
    Robust data cleaning and validation pipeline for agricultural prices:
    - Validates required columns.
    - Normalizes commodity and region names (.strip().title()).
    - Safely converts dtypes and parses dates.
    - Discards duplicate entries (keeps last).
    - Detects impossible prices (min_price > modal_price or modal_price > max_price or price <= 0).
    - Applies documented IQR outlier clipping per (commodity, region) slice
      so extreme recording errors are safely bounded without deleting data.
    - Strictly sorts chronologically.
    """
    if df.empty:
        raise ValueError("Provided price dataset is empty.")

    missing_cols = [c for c in REQUIRED_PRICE_COLUMNS if c not in df.columns]
    if missing_cols:
        raise ValueError(f"Price dataset missing required columns: {missing_cols}")

    cleaned = df.copy()

    # 1. String normalization
    cleaned["commodity"] = cleaned["commodity"].astype(str).str.strip().str.title()
    cleaned["region"] = cleaned["region"].astype(str).str.strip().str.title()

    # 2. Date parsing & chronological sorting
    cleaned["date"] = pd.to_datetime(cleaned["date"], errors="coerce")
    if cleaned["date"].isna().any():
        num_invalid = int(cleaned["date"].isna().sum())
        logger.warning(f"Dropping {num_invalid} rows with unparseable dates.")
        cleaned = cleaned.dropna(subset=["date"])

    # 3. Numeric conversion
    numeric_cols = ["minimum_price", "maximum_price", "modal_price"]
    for col in numeric_cols:
        cleaned[col] = pd.to_numeric(cleaned[col], errors="coerce")

    # Optional numeric fields
    for opt_col in ["market_arrivals_tonnes", "rainfall_mm", "temperature_c", "humidity_pct", "predicted_demand_kg"]:
        if opt_col in cleaned.columns:
            cleaned[opt_col] = pd.to_numeric(cleaned[opt_col], errors="coerce")

    # 4. Remove impossible price records
    invalid_mask = (
        (cleaned["modal_price"] <= 0)
        | (cleaned["minimum_price"] <= 0)
        | (cleaned["maximum_price"] <= 0)
        | (cleaned["minimum_price"] > cleaned["modal_price"] * 1.05)  # minor tolerance for noise
        | (cleaned["modal_price"] > cleaned["maximum_price"] * 1.05)
    )
    if invalid_mask.any():
        logger.warning(f"Filtered out {invalid_mask.sum()} records with physically impossible price relations.")
        cleaned = cleaned[~invalid_mask]

    # Re-enforce strict ordering: min <= modal <= max
    cleaned["minimum_price"] = np.minimum(cleaned["minimum_price"], cleaned["modal_price"])
    cleaned["maximum_price"] = np.maximum(cleaned["maximum_price"], cleaned["modal_price"])

    # 5. Deduplicate (date, commodity, region)
    cleaned = cleaned.drop_duplicates(subset=["date", "commodity", "region"], keep="last")

    # 6. Outlier handling via IQR clipping (per commodity slice to avoid distorting seasonal peaks)
    clipped_records = []
    for commodity, group in cleaned.groupby("commodity"):
        grp = group.copy()
        q1 = grp["modal_price"].quantile(0.25)
        q3 = grp["modal_price"].quantile(0.75)
        iqr = q3 - q1
        lower_bound = max(1.0, q1 - (iqr_multiplier * iqr))
        upper_bound = q3 + (iqr_multiplier * iqr)

        # Clip modal_price and adjust bounds
        grp["modal_price"] = grp["modal_price"].clip(lower=lower_bound, upper=upper_bound)
        grp["minimum_price"] = np.minimum(grp["minimum_price"], grp["modal_price"])
        grp["maximum_price"] = np.maximum(grp["maximum_price"], grp["modal_price"])
        clipped_records.append(grp)

    if clipped_records:
        cleaned = pd.concat(clipped_records, ignore_index=True)

    # 7. Strict Chronological Sort
    cleaned = cleaned.sort_values(by=["commodity", "region", "date"]).reset_index(drop=True)
    return cleaned
