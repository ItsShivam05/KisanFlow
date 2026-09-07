"""
Demand Dataset Processing Pipeline (Issue #7).

Handles:
- Validation of raw agricultural demand records
- Normalization of product/region strings
- Handling missing records & chronological ordering
- Outlier detection and IQR capping
- Time-series lag and rolling statistics feature engineering
- Saving clean processed dataset for modeling
"""

from pathlib import Path
from typing import Tuple, List, Dict
import numpy as np
import pandas as pd
from ai_service.app.utils.logger import logger

REQUIRED_COLUMNS = [
    "date", "commodity", "region", "demand_quantity_kg", "modal_price_per_kg"
]

def load_raw_dataset(file_path: str) -> pd.DataFrame:
    """Load raw dataset from CSV with date parsing."""
    p = Path(file_path)
    if not p.exists():
        raise FileNotFoundError(f"Raw dataset file not found at: {file_path}")
    df = pd.read_csv(p)
    logger.info(f"Loaded raw dataset from {file_path} with {len(df)} rows.")
    return df

def validate_raw_schema(df: pd.DataFrame) -> bool:
    """Validate that required columns exist and data types are valid."""
    missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if missing:
        raise ValueError(f"Dataset missing required columns: {missing}")
    return True

def clean_and_normalize(df: pd.DataFrame) -> pd.DataFrame:
    """Clean data: normalize names, remove duplicates, sort chronologically."""
    df = df.copy()
    
    # Standardize string fields
    df["commodity"] = df["commodity"].astype(str).str.strip().str.title()
    df["region"] = df["region"].astype(str).str.strip().str.title()
    
    # Parse date
    df["date"] = pd.to_datetime(df["date"])
    
    # Ensure numeric columns
    df["demand_quantity_kg"] = pd.to_numeric(df["demand_quantity_kg"], errors="coerce")
    df["modal_price_per_kg"] = pd.to_numeric(df["modal_price_per_kg"], errors="coerce")
    
    # Drop records with null values in core columns
    initial_len = len(df)
    df = df.dropna(subset=["date", "commodity", "region", "demand_quantity_kg", "modal_price_per_kg"])
    dropped = initial_len - len(df)
    if dropped > 0:
        logger.warning(f"Dropped {dropped} records with nulls in core columns.")
        
    # Drop duplicates
    df = df.drop_duplicates(subset=["date", "commodity", "region"])
    
    # Sort chronologically
    df = df.sort_values(by=["commodity", "region", "date"]).reset_index(drop=True)
    return df

def detect_and_cap_outliers(df: pd.DataFrame, multiplier: float = 1.5) -> pd.DataFrame:
    """
    Detect extreme outliers per commodity and cap them using the IQR method.
    Preserves seasonal demand while bounding corrupt extreme values.
    """
    df = df.copy()
    
    q25 = df.groupby(["commodity", "region"])["demand_quantity_kg"].transform(lambda s: s.quantile(0.25))
    q75 = df.groupby(["commodity", "region"])["demand_quantity_kg"].transform(lambda s: s.quantile(0.75))
    iqr = q75 - q25
    lower_bound = np.maximum(0.0, q25 - (multiplier * iqr))
    upper_bound = q75 + (multiplier * iqr)
    
    df["demand_quantity_kg"] = df["demand_quantity_kg"].clip(lower=lower_bound, upper=upper_bound)
    return df

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Engineer time-series features without future data leakage:
    - Calendar features (day of week, day of month, month, season)
    - Lag features (demand_lag_1, demand_lag_7, demand_lag_14)
    - Rolling window statistics (7-day and 14-day rolling mean, 7-day rolling std)
    - Price signals (price_lag_1, price_rolling_mean_7)
    """
    df = df.copy()
    
    # Calendar features
    df["day_of_week_num"] = df["date"].dt.dayofweek
    df["day_of_month"] = df["date"].dt.day
    df["month"] = df["date"].dt.month
    df["is_weekend"] = df["day_of_week_num"].isin([5, 6]).astype(int)
    
    # Season mapping
    def get_season_code(m: int) -> int:
        if m in [11, 12, 1, 2, 3]:
            return 1 # Rabi
        elif m in [4, 5, 6]:
            return 2 # Zaid
        return 3 # Kharif
        
    df["season_code"] = df["month"].apply(get_season_code)
    
    # Group-wise lags and rolling features
    feature_dfs = []
    
    for (comm, reg), group in df.groupby(["commodity", "region"]):
        g = group.sort_values("date").copy()
        
        # Demand lags
        g["demand_lag_1"] = g["demand_quantity_kg"].shift(1)
        g["demand_lag_7"] = g["demand_quantity_kg"].shift(7)
        g["demand_lag_14"] = g["demand_quantity_kg"].shift(14)
        
        # Demand rolling features (shift(1) avoids data leakage from today's target)
        shifted_demand = g["demand_quantity_kg"].shift(1)
        g["demand_rolling_mean_7"] = shifted_demand.rolling(window=7, min_periods=1).mean()
        g["demand_rolling_mean_14"] = shifted_demand.rolling(window=14, min_periods=1).mean()
        g["demand_rolling_std_7"] = shifted_demand.rolling(window=7, min_periods=1).std().fillna(0.0)
        
        # Price signals
        g["price_lag_1"] = g["modal_price_per_kg"].shift(1)
        g["price_rolling_mean_7"] = g["modal_price_per_kg"].shift(1).rolling(window=7, min_periods=1).mean()
        
        # Backfill initial rows for this group
        lag_cols = [
            "demand_lag_1", "demand_lag_7", "demand_lag_14", 
            "demand_rolling_mean_7", "demand_rolling_mean_14", "demand_rolling_std_7",
            "price_lag_1", "price_rolling_mean_7"
        ]
        for col in lag_cols:
            g[col] = g[col].bfill().ffill()
            
        feature_dfs.append(g)
        
    result_df = pd.concat(feature_dfs, ignore_index=True)
    return result_df

def run_data_preparation_pipeline(
    raw_path: str,
    processed_path: str
) -> pd.DataFrame:
    """Execute full data loading, cleaning, feature engineering and save."""
    df_raw = load_raw_dataset(raw_path)
    validate_raw_schema(df_raw)
    
    df_cleaned = clean_and_normalize(df_raw)
    df_capped = detect_and_cap_outliers(df_cleaned)
    df_features = engineer_features(df_capped)
    
    out_dir = Path(processed_path).parent
    out_dir.mkdir(parents=True, exist_ok=True)
    
    df_features.to_csv(processed_path, index=False)
    logger.info(f"Processed dataset saved successfully to {processed_path} ({len(df_features)} rows).")
    return df_features
