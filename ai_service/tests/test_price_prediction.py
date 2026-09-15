"""
Unit Tests for Jharkhand Price Prediction Engine and Baselines.
"""

import pytest
import numpy as np
import pandas as pd
from ai_service.app.pricing.price_data import (
    JHARKHAND_MARKETS,
    SUPPORTED_COMMODITIES,
    generate_jharkhand_synthetic_price_data,
    clean_and_validate_price_data,
)
from ai_service.app.pricing.price_features import engineer_price_features
from ai_service.app.pricing.price_evaluation import calculate_price_metrics, evaluate_baselines
from ai_service.app.pricing.price_model import CommodityPriceModel
from ai_service.app.pricing.price_forecast import run_recursive_price_forecast


@pytest.fixture(scope="module")
def sample_price_df():
    """Generates a compact synthetic dataset for fast unit testing."""
    return generate_jharkhand_synthetic_price_data(
        start_date="2025-01-01",
        end_date="2025-06-30",
        random_seed=123,
    )


def test_jharkhand_synthetic_data_generation_and_schema(sample_price_df):
    """Test synthetic data schema, non-empty, and commodity/market representation."""
    df = sample_price_df
    assert not df.empty
    assert "modal_price" in df.columns
    assert "minimum_price" in df.columns
    assert "maximum_price" in df.columns
    assert "region" in df.columns
    assert "commodity" in df.columns

    # Verify all pilot markets are present
    regions = set(df["region"].unique())
    for expected_mkt in JHARKHAND_MARKETS.keys():
        assert expected_mkt in regions

    # Verify all commodities are present
    commodities = set(df["commodity"].unique())
    for comm in SUPPORTED_COMMODITIES.keys():
        assert comm in commodities


def test_data_cleaning_and_iqr_outlier_clipping():
    """Test cleaning handles bad values, deduplicates, and clips extreme outliers."""
    rows = []
    # 10 normal days
    for day in range(1, 11):
        rows.append({
            "date": f"2025-01-{day:02d}",
            "commodity": "Tomato",
            "region": "Ranchi",
            "minimum_price": 20.0,
            "maximum_price": 25.0,
            "modal_price": 22.0 + (day % 3),
        })
    # Duplicate row (same date as day 1)
    rows.append({
        "date": "2025-01-01",
        "commodity": "Tomato",
        "region": "Ranchi",
        "minimum_price": 20.0,
        "maximum_price": 26.0,
        "modal_price": 23.0,
    })
    # Impossible negative price (should be dropped)
    rows.append({
        "date": "2025-01-12",
        "commodity": "Tomato",
        "region": "Ranchi",
        "minimum_price": -10.0,
        "maximum_price": 20.0,
        "modal_price": -5.0,
    })
    # Extreme anomaly (should be clipped)
    rows.append({
        "date": "2025-01-13",
        "commodity": "Tomato",
        "region": "Ranchi",
        "minimum_price": 20.0,
        "maximum_price": 500.0,
        "modal_price": 450.0,
    })

    dirty_data = pd.DataFrame(rows)
    cleaned = clean_and_validate_price_data(dirty_data, iqr_multiplier=1.5)
    assert len(cleaned) == 11  # 10 normal days + 1 clipped anomaly (duplicate deduped, negative dropped)
    assert cleaned["modal_price"].min() > 0
    # Extreme anomaly must be clipped well below 450
    assert cleaned["modal_price"].max() < 100.0



def test_feature_engineering_zero_target_leakage(sample_price_df):
    """Test that all lags and rolling averages are calculated strictly on past data (<= t-1)."""
    cleaned = clean_and_validate_price_data(sample_price_df)
    features = engineer_price_features(cleaned, drop_na_lags=True)

    assert "price_lag_1" in features.columns
    assert "price_rolling_mean_7" in features.columns
    assert "price_rolling_std_7" in features.columns
    assert "price_change_1d" in features.columns

    # Verify lag 1 is strictly yesterday's price
    ranchi_tomato = features[(features["commodity"] == "Tomato") & (features["region"] == "Ranchi")].sort_values("date")
    for i in range(1, len(ranchi_tomato)):
        prev_actual = ranchi_tomato["modal_price"].iloc[i - 1]
        curr_lag1 = ranchi_tomato["price_lag_1"].iloc[i]
        assert np.isclose(prev_actual, curr_lag1, atol=1e-5), f"Target leakage: lag1 {curr_lag1} != prev {prev_actual}"


def test_chronological_splitting_order(sample_price_df):
    """Ensure training and test splits adhere strictly to chronological progression."""
    cleaned = clean_and_validate_price_data(sample_price_df)
    features = engineer_price_features(cleaned, drop_na_lags=True)
    tomato_df = features[features["commodity"] == "Tomato"].sort_values("date")

    n = len(tomato_df)
    n_train = int(n * 0.70)
    n_val = int(n * 0.15)

    train_df = tomato_df.iloc[:n_train]
    val_df = tomato_df.iloc[n_train : n_train + n_val]
    test_df = tomato_df.iloc[n_train + n_val :]

    max_train_date = train_df["date"].max()
    min_val_date = val_df["date"].min()
    max_val_date = val_df["date"].max()
    min_test_date = test_df["date"].min()

    assert max_train_date <= min_val_date, "Train dates overlap with validation dates!"
    assert max_val_date <= min_test_date, "Validation dates overlap with test dates!"


def test_baseline_evaluations():
    """Verify calculation of naive and moving average metrics."""
    test_df = pd.DataFrame({
        "modal_price": [20.0, 22.0, 21.0, 23.0],
        "price_lag_1": [19.0, 20.0, 22.0, 21.0],
        "price_rolling_mean_7": [18.0, 19.0, 20.0, 20.5],
    })
    baselines = evaluate_baselines(test_df)
    assert "naive" in baselines
    assert "moving_average_7d" in baselines
    assert baselines["naive"]["mae"] > 0
    assert baselines["naive"]["rmse"] > 0
    assert baselines["naive"]["mape_pct"] > 0


def test_price_model_training_and_recursive_forecast(sample_price_df):
    """Test full training of CommodityPriceModel and 7-day recursive forecasting."""
    cleaned = clean_and_validate_price_data(sample_price_df)
    features = engineer_price_features(cleaned, drop_na_lags=True)
    tomato_df = features[features["commodity"] == "Tomato"].copy()

    model = CommodityPriceModel(commodity="Tomato")
    train_res = model.train(tomato_df)

    assert "mae" in train_res["metrics"]
    assert "rmse" in train_res["metrics"]
    assert "residual_bounds" in train_res
    assert model.model is not None

    # Test 7-day recursive forward forecast
    forecast = run_recursive_price_forecast(
        model=model,
        commodity="Tomato",
        region="Ranchi",
        historical_df=features,
        forecast_days=7,
    )

    assert forecast["current_price"] > 0
    assert len(forecast["predictions"]) == 7
    for p in forecast["predictions"]:
        assert p["predicted_price"] > 0
        assert p["lower_estimate"] <= p["predicted_price"] or np.isclose(p["lower_estimate"], p["predicted_price"], atol=1.0)
        assert p["upper_estimate"] >= p["predicted_price"] or np.isclose(p["upper_estimate"], p["predicted_price"], atol=1.0)
    assert len(forecast["explainability_factors"]) > 0
