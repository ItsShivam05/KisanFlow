"""
FastAPI Endpoint Integration Tests.
"""

import pytest
from fastapi.testclient import TestClient
from pathlib import Path
import pandas as pd

from ai_service.app.main import app
from ai_service.app.config import settings
from ai_service.app.forecasting.generator import generate_agricultural_demand_data
from ai_service.app.forecasting.dataset import run_data_preparation_pipeline
from ai_service.app.forecasting.model import DemandForecastModel

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_test_environment():
    """Ensure dataset and model exist before running API tests."""
    raw_path = Path(settings.RAW_DATA_PATH)
    proc_path = Path(settings.PROCESSED_DATA_PATH)
    model_path = Path(settings.MODEL_PATH)
    
    raw_path.parent.mkdir(parents=True, exist_ok=True)
    proc_path.parent.mkdir(parents=True, exist_ok=True)
    model_path.parent.mkdir(parents=True, exist_ok=True)
    
    if not proc_path.exists():
        raw_df = generate_agricultural_demand_data(
            start_date="2024-06-01", end_date="2025-06-30", random_seed=42
        )
        raw_df.to_csv(raw_path, index=False)
        run_data_preparation_pipeline(str(raw_path), str(proc_path))
        
    if not model_path.exists():
        df = pd.read_csv(proc_path)
        model = DemandForecastModel()
        model.train(df)
        model.save(str(model_path))

def test_health_endpoint():
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert "service" in data

def test_forecast_endpoint():
    payload = {
        "product": "Tomato",
        "region": "Patna",
        "horizon_days": 7
    }
    resp = client.post("/forecast", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["product"] == "Tomato"
    assert data["region"] == "Patna"
    assert len(data["daily_forecast"]) == 7
    assert data["total_predicted_demand_kg"] > 0

def test_forecast_endpoint_invalid_payload():
    resp = client.post("/forecast", json={"product": "Tomato"})  # missing region
    assert resp.status_code == 422

def test_model_info_endpoint():
    resp = client.get("/model-info")
    assert resp.status_code == 200
    data = resp.json()
    assert "Tomato" in data["supported_commodities"]
    assert "Patna" in data["supported_regions"]
    assert "mae_kg" in data["evaluation_metrics"]

def test_match_suppliers_endpoint():
    payload = {
        "requirement": {
            "product": "Tomato",
            "required_quantity_kg": 5000.0,
            "region": "Patna",
            "buyer_location": {"latitude": 25.5941, "longitude": 85.1376},
            "minimum_quality": "B"
        }
    }
    resp = client.post("/match-suppliers", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["product"] == "Tomato"
    assert data["total_allocated_quantity_kg"] > 0
    assert len(data["selected_suppliers"]) > 0

def test_optimize_route_endpoint():
    payload = {
        "depot_coordinates": {"latitude": 25.5941, "longitude": 85.1376},
        "depot_name": "Patna Central Depot",
        "pickups": [
            {
                "supplier_id": "FPO-PAT-01",
                "name": "Phulwari Hub",
                "latitude": 25.5786,
                "longitude": 85.0743,
                "quantity_kg": 2000.0
            },
            {
                "supplier_id": "FARM-DAN-02",
                "name": "Danapur Farm",
                "latitude": 25.6324,
                "longitude": 85.0441,
                "quantity_kg": 1500.0
            }
        ],
        "vehicle_capacity_kg": 5000.0,
        "fleet_size": 2
    }
    resp = client.post("/optimize-route", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] in ["OPTIMAL", "FEASIBLE"]
    assert data["total_distance_km"] > 0
    assert data["baseline_comparison"]["distance_saved_km"] >= 0

def test_price_estimate_endpoint():
    payload = {
        "commodity": "Tomato",
        "region": "Patna",
        "historical_baseline_price": 32.0
    }
    resp = client.post("/price-estimate", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["observation"]["commodity"] == "Tomato"
    assert data["observation"]["price_per_kg"] > 0
    assert data["observation"]["is_simulated"] is True

def test_pipeline_run_endpoint():
    payload = {
        "buyer_requirement": {
            "product": "Tomato",
            "required_quantity_kg": 8000.0,
            "region": "Patna",
            "buyer_location": {"latitude": 25.5941, "longitude": 85.1376},
            "minimum_quality": "B"
        },
        "forecast_horizon_days": 7,
        "vehicle_capacity_kg": 5000.0,
        "fleet_size": 3
    }
    resp = client.post("/pipeline/run", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["pipeline_status"] == "SUCCESS"
    assert "forecast" in data
    assert "price_intelligence" in data
    assert "matching" in data
    assert "routing" in data
    assert len(data["executive_summary"]) > 0

def test_jharkhand_price_markets_endpoint():
    resp = client.get("/price-markets")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    market_names = [m["name"] for m in data]
    assert "Ranchi" in market_names
    assert "Jamshedpur" in market_names

def test_jharkhand_price_commodities_endpoint():
    resp = client.get("/price-commodities")
    assert resp.status_code == 200
    data = resp.json()
    assert "commodities" in data
    assert "Tomato" in data["commodities"]
    assert "Potato" in data["commodities"]

def test_jharkhand_price_predict_endpoint():
    payload = {
        "commodity": "Tomato",
        "region": "Ranchi",
        "forecast_days": 7,
        "quantity_kg": 1000.0,
        "farmer_location": "Ranchi"
    }
    resp = client.post("/price-predict", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["commodity"] == "Tomato"
    assert data["region"] == "Ranchi"
    assert data["current_price"] > 0
    assert len(data["predictions"]) == 7
    assert data["recommendation"] in ["SELL_NOW", "WAIT_1_DAYS", "WAIT_2_DAYS", "WAIT_3_DAYS", "WAIT_4_DAYS", "WAIT_5_DAYS", "WAIT_6_DAYS", "WAIT_7_DAYS"]
    assert len(data["explainability_factors"]) > 0

def test_jharkhand_farmer_profit_recommendation_endpoint():
    payload = {
        "commodity": "Tomato",
        "quantity_kg": 2000.0,
        "farmer_location": "Hazaribagh"
    }
    resp = client.post("/farmer-profit-recommendation", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["commodity"] == "Tomato"
    assert len(data["recommendations"]) >= 2
    rec = [r for r in data["recommendations"] if r["recommended"]]
    assert len(rec) == 1
    assert data["max_net_realization"] > 0

def test_jharkhand_market_allocation_endpoint():
    payload = {
        "commodity": "Tomato",
        "quantity_kg": 4000.0,
        "farmer_location": "Ranchi",
        "max_single_market_share": 0.50
    }
    resp = client.post("/market-allocation", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["allocations"]) >= 2
    assert data["total_projected_net_profit"] > 0

def test_jharkhand_model_metrics_endpoint():
    resp = client.get("/price-model-metrics")
    assert resp.status_code == 200
    data = resp.json()
    assert data["model_name"] == "XGBoost Regressor (Primary)"
    assert "Tomato" in data["overall_metrics"]
    assert "Tomato" in data["baseline_comparison"]

