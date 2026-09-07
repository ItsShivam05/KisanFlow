"""
Tests for Issue #7: Demand Dataset Pipeline.
"""

import pytest
import pandas as pd
import numpy as np
from ai_service.app.forecasting.generator import generate_agricultural_demand_data
from ai_service.app.forecasting.dataset import (
    validate_raw_schema, clean_and_normalize, detect_and_cap_outliers,
    engineer_features, run_data_preparation_pipeline
)

@pytest.fixture
def sample_raw_df():
    return generate_agricultural_demand_data(
        start_date="2025-01-01",
        end_date="2025-03-31",
        random_seed=42
    )

def test_generate_agricultural_demand_data(sample_raw_df):
    """Test data generator outputs proper schema and types."""
    assert len(sample_raw_df) > 0
    assert "demand_quantity_kg" in sample_raw_df.columns
    assert "modal_price_per_kg" in sample_raw_df.columns
    assert "is_synthetic" in sample_raw_df.columns
    assert sample_raw_df["is_synthetic"].all() == True
    assert set(sample_raw_df["commodity"].unique()) == {"Tomato", "Potato", "Onion"}

def test_validate_raw_schema_valid(sample_raw_df):
    """Validate valid schema passes without error."""
    assert validate_raw_schema(sample_raw_df) is True

def test_validate_raw_schema_missing_column():
    """Validate missing required column raises ValueError."""
    bad_df = pd.DataFrame({"date": ["2025-01-01"], "commodity": ["Tomato"]})
    with pytest.raises(ValueError, match="missing required columns"):
        validate_raw_schema(bad_df)

def test_clean_and_normalize(sample_raw_df):
    """Test string normalization, date parsing, and null removal."""
    # Inject dirty data
    dirty = sample_raw_df.copy()
    dirty.loc[0, "commodity"] = "  tomato  "
    dirty.loc[1, "region"] = "  patna  "
    dirty.loc[2, "demand_quantity_kg"] = None
    
    cleaned = clean_and_normalize(dirty)
    # Check that strings are stripped and title-cased
    assert "  tomato  " not in cleaned["commodity"].values
    assert "  patna  " not in cleaned["region"].values
    assert (cleaned["commodity"] == cleaned["commodity"].str.strip().str.title()).all()
    assert (cleaned["region"] == cleaned["region"].str.strip().str.title()).all()
    assert len(cleaned) == len(sample_raw_df) - 1  # 1 null dropped

def test_detect_and_cap_outliers(sample_raw_df):
    """Test extreme outliers are capped by IQR."""
    df = sample_raw_df.copy()
    # Inject massive outlier
    df.loc[0, "demand_quantity_kg"] = 999999.0
    capped = detect_and_cap_outliers(df)
    assert capped.loc[0, "demand_quantity_kg"] < 999999.0

def test_engineer_features(sample_raw_df):
    """Test feature engineering creates lag and rolling statistics."""
    cleaned = clean_and_normalize(sample_raw_df)
    features_df = engineer_features(cleaned)
    
    expected_cols = [
        "demand_lag_1", "demand_lag_7", "demand_lag_14",
        "demand_rolling_mean_7", "demand_rolling_mean_14", "demand_rolling_std_7",
        "price_lag_1", "price_rolling_mean_7",
        "day_of_week_num", "month", "season_code"
    ]
    for col in expected_cols:
        assert col in features_df.columns
        assert features_df[col].isna().sum() == 0  # no NaNs in engineered features

def test_run_data_preparation_pipeline(tmp_path, sample_raw_df):
    """Test full pipeline saves and returns clean processed CSV."""
    raw_file = tmp_path / "raw.csv"
    proc_file = tmp_path / "processed.csv"
    
    sample_raw_df.to_csv(raw_file, index=False)
    processed = run_data_preparation_pipeline(str(raw_file), str(proc_file))
    
    assert proc_file.exists()
    assert len(processed) > 0
    assert "demand_lag_1" in processed.columns
