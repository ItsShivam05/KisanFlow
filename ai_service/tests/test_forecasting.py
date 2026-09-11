"""
Tests for Issue #8: Demand Forecasting Baseline.
"""

import pytest
import pandas as pd
from ai_service.app.forecasting.generator import generate_agricultural_demand_data
from ai_service.app.forecasting.dataset import clean_and_normalize, engineer_features
from ai_service.app.forecasting.model import DemandForecastModel

@pytest.fixture(scope="module")
def processed_data():
    raw_df = generate_agricultural_demand_data(
        start_date="2024-06-01",
        end_date="2025-06-30",
        random_seed=42
    )
    cleaned = clean_and_normalize(raw_df)
    features_df = engineer_features(cleaned)
    return features_df

@pytest.fixture(scope="module")
def trained_model(processed_data):
    model = DemandForecastModel()
    model.train(processed_data)
    return model

def test_model_training_and_metrics(trained_model):
    """Test model trains and generates realistic error metrics."""
    assert trained_model.model is not None
    assert "mae_kg" in trained_model.metrics
    assert "rmse_kg" in trained_model.metrics
    assert "mape_percent" in trained_model.metrics
    assert trained_model.metrics["mae_kg"] > 0
    assert trained_model.metrics["rmse_kg"] > 0
    assert 0 < trained_model.metrics["mape_percent"] < 50.0  # reasonable error range

def test_forecast_horizon_7_days(trained_model, processed_data):
    """Test 7-day future prediction output structure and non-negativity."""
    forecast = trained_model.predict_horizon(
        historical_df=processed_data,
        product="Tomato",
        region="Patna",
        horizon_days=7
    )
    assert forecast.product == "Tomato"
    assert forecast.region == "Patna"
    assert forecast.horizon_days == 7
    assert len(forecast.daily_forecast) == 7
    assert forecast.total_predicted_demand_kg > 0
    for day in forecast.daily_forecast:
        assert day.predicted_demand_kg > 0
        assert day.lower_bound_kg <= day.predicted_demand_kg <= day.upper_bound_kg

def test_forecast_horizon_14_days(trained_model, processed_data):
    """Test 14-day extended prediction."""
    forecast = trained_model.predict_horizon(
        historical_df=processed_data,
        product="Potato",
        region="Patna",
        horizon_days=14
    )
    assert len(forecast.daily_forecast) == 14
    assert forecast.total_predicted_demand_kg > 0

def test_forecast_invalid_commodity(trained_model, processed_data):
    """Test error raised when invalid commodity requested."""
    with pytest.raises(ValueError, match="not supported"):
        trained_model.predict_horizon(
            historical_df=processed_data,
            product="Avocado",
            region="Patna",
            horizon_days=7
        )

def test_forecast_invalid_region(trained_model, processed_data):
    """Test error raised when invalid region requested."""
    with pytest.raises(ValueError, match="not supported"):
        trained_model.predict_horizon(
            historical_df=processed_data,
            product="Tomato",
            region="Mumbai",
            horizon_days=7
        )

def test_model_save_and_load(trained_model, processed_data, tmp_path):
    """Test serializing model with joblib and reloading for inference."""
    save_path = tmp_path / "model.joblib"
    trained_model.save(str(save_path))
    assert save_path.exists()
    
    loaded_model = DemandForecastModel(str(save_path))
    forecast = loaded_model.predict_horizon(
        historical_df=processed_data,
        product="Tomato",
        region="Patna",
        horizon_days=7
    )
    assert len(forecast.daily_forecast) == 7
    assert forecast.total_predicted_demand_kg > 0
