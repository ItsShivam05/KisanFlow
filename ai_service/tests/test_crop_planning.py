"""
Unit & Integration Tests for 'What Should We Grow?' / Crop Planning Advisor Module.
Tests:
- Crop Data Registry & Prototype Disclaimers
- Agronomic Financial Economics Engine
- Multi-Criteria Decision Scoring & Risk-Adjusted Return
- Diversification Portfolio Generation
- Explainability Reasoning Engine
- 'What If?' Scenario Stress-Testing Engine
- FastAPI Endpoints: /crop-planning/crops, /crop-planning/scenarios, /crop-recommendation, /crop-planning/scenarios
"""

import pytest
from fastapi.testclient import TestClient

from ai_service.app.main import app
from ai_service.app.crop_planning.crop_data import (
    SUPPORTED_CROPS,
    SEASONS,
    CROP_DATA_DISCLAIMER,
)
from ai_service.app.crop_planning.crop_economics import calculate_crop_economics
from ai_service.app.crop_planning.crop_advisor import CropPlanningAdvisor
from ai_service.app.crop_planning.scenario_analyzer import SCENARIOS, run_scenario_analysis

client = TestClient(app)


# ---------------------------------------------------------------------------
# 1. Crop Data Registry Tests
# ---------------------------------------------------------------------------
def test_crop_data_registry_completeness():
    """Verify all 8 required crops are registered with required fields."""
    expected_crops = [
        "Tomato", "Potato", "Onion", "Green Chilli",
        "Cauliflower", "Cabbage", "Brinjal", "Okra"
    ]
    for crop in expected_crops:
        assert crop in SUPPORTED_CROPS, f"Missing required crop: {crop}"
        meta = SUPPORTED_CROPS[crop]
        assert "expected_yield_kg_per_acre" in meta
        assert "production_cost_per_acre" in meta
        assert "perishability_tier" in meta
        assert "suitable_seasons" in meta
        assert "shelf_life_days" in meta
        assert meta["expected_yield_kg_per_acre"] > 0
        assert meta["production_cost_per_acre"] > 0

    assert "SYNTHETIC" in CROP_DATA_DISCLAIMER or "PROTOTYPE" in CROP_DATA_DISCLAIMER


# ---------------------------------------------------------------------------
# 2. Crop Economics Engine Tests
# ---------------------------------------------------------------------------
def test_crop_economics_calculation():
    """Verify math for gross revenue, cost deductions, and net return."""
    acres = 3.0
    price_per_kg = 20.0
    econ = calculate_crop_economics(
        crop_name="Potato",
        land_area_acres=acres,
        expected_price_per_kg=price_per_kg,
        distance_to_market_km=30.0,
        irrigation=True,
    )

    # Base Potato yield = 9000 kg/acre -> 27,000 kg total
    assert econ["effective_yield_per_acre_kg"] == 9000.0
    assert econ["total_yield_kg"] == 27000.0
    assert econ["gross_revenue"] == 27000.0 * 20.0  # 540,000

    # Production cost = 3 * 38,000 = 114,000
    assert econ["production_cost"] == 114000.0

    # Transport cost > 0
    assert econ["transport_cost"] > 0

    # Net return = Revenue - Production - Transport - Holding - Wastage
    total_deductions = (
        econ["production_cost"]
        + econ["transport_cost"]
        + econ["holding_cost"]
        + econ["wastage_cost"]
    )
    assert abs(econ["expected_net_return"] - (econ["gross_revenue"] - total_deductions)) < 0.01
    assert econ["net_return_per_acre"] == round(econ["expected_net_return"] / acres, 2)
    assert econ["benefit_cost_ratio"] > 1.0


def test_crop_economics_rainfed_penalty():
    """Verify rainfed crops without irrigation suffer yield degradation."""
    irrigated = calculate_crop_economics(
        crop_name="Tomato",
        land_area_acres=2.0,
        expected_price_per_kg=25.0,
        irrigation=True,
    )
    rainfed = calculate_crop_economics(
        crop_name="Tomato",
        land_area_acres=2.0,
        expected_price_per_kg=25.0,
        irrigation=False,
    )
    assert rainfed["total_yield_kg"] < irrigated["total_yield_kg"]
    assert rainfed["expected_net_return"] < irrigated["expected_net_return"]


# ---------------------------------------------------------------------------
# 3. Crop Planning Advisor Engine Tests
# ---------------------------------------------------------------------------
def test_crop_advisor_evaluation_ranking():
    """Verify advisor evaluates all 8 crops and produces sorted rankings."""
    advisor = CropPlanningAdvisor()
    evals = advisor.evaluate_all_crops(
        region="Ranchi",
        land_area_acres=4.0,
        season="Rabi",
        irrigation=True,
    )
    assert len(evals) == 8
    # Ranks must be 1 to 8 in descending score order
    for idx, item in enumerate(evals):
        assert item["rank"] == idx + 1
        if idx > 0:
            assert evals[idx - 1]["score"] >= item["score"]

    # Seasonality check: Okra is primarily Kharif/Zaid, so in Rabi it should have low score
    okra_eval = next(e for e in evals if e["crop"] == "Okra")
    assert not okra_eval["is_seasonally_suited"]
    assert okra_eval["score"] < 50.0


def test_crop_advisor_recommend_pipeline():
    """Verify unified recommend() pipeline outputs all expected sections."""
    advisor = CropPlanningAdvisor()
    result = advisor.recommend(
        region="Hazaribagh",
        land_area_acres=5.0,
        season="Rabi",
        irrigation=True,
    )
    assert result["region"] == "Hazaribagh"
    assert result["season"] == "Rabi"
    assert "top_crop" in result
    assert "recommendations" in result
    assert "diversification_plan" in result
    assert "explainability" in result
    assert len(result["recommendations"]) == 8


# ---------------------------------------------------------------------------
# 4. Land Diversification Plan Tests
# ---------------------------------------------------------------------------
def test_diversification_portfolio_acreage_conservation():
    """Verify diversification allocations sum exactly to total farm acreage."""
    advisor = CropPlanningAdvisor()
    evals = advisor.evaluate_all_crops(
        region="Ranchi",
        land_area_acres=5.0,
        season="Rabi",
        irrigation=True,
    )
    div_plan = advisor.generate_diversification_plan(
        ranked_crops=evals,
        total_acres=5.0,
        irrigation=True,
    )
    assert div_plan["is_diversified"] is True
    allocated_acres = sum(a["acres"] for a in div_plan["allocations"])
    assert abs(allocated_acres - 5.0) < 0.05
    assert div_plan["portfolio_net_return"] > 0


def test_diversification_smallholder_single_crop():
    """Verify smallholdings (< 1.5 acres) recommend single crop focus."""
    advisor = CropPlanningAdvisor()
    evals = advisor.evaluate_all_crops(
        region="Ranchi",
        land_area_acres=1.0,
        season="Rabi",
        irrigation=True,
    )
    div_plan = advisor.generate_diversification_plan(
        ranked_crops=evals,
        total_acres=1.0,
    )
    assert div_plan["is_diversified"] is False
    assert len(div_plan["allocations"]) == 1
    assert div_plan["allocations"][0]["fraction_pct"] == 100.0


# ---------------------------------------------------------------------------
# 5. Explainability Reasoning Engine Tests
# ---------------------------------------------------------------------------
def test_explainability_generation():
    """Verify transparent reasons are generated for top crop and runner up."""
    advisor = CropPlanningAdvisor()
    evals = advisor.evaluate_all_crops(
        region="Ranchi",
        land_area_acres=3.0,
        season="Rabi",
        irrigation=True,
    )
    expl = advisor.generate_explainability(top_crop=evals[0], ranked_crops=evals)
    assert len(expl["why_top_crop"]) >= 3
    assert len(expl["why_not_alternatives"]) >= 1
    for alt in expl["why_not_alternatives"]:
        assert "Why not" in alt["explanation"]


# ---------------------------------------------------------------------------
# 6. Scenario Analysis Engine Tests
# ---------------------------------------------------------------------------
def test_scenario_analysis():
    """Verify scenario analysis runs across all 7 scenarios."""
    advisor = CropPlanningAdvisor()
    res = run_scenario_analysis(
        advisor=advisor,
        region="Ranchi",
        land_area_acres=5.0,
        season="Rabi",
        irrigation=True,
    )
    assert len(res) == len(SCENARIOS)
    assert "NORMAL" in res
    assert "PRICE_CRASH" in res
    assert "HEAVY_RAINFALL" in res
    assert "DROUGHT_LOW_RAINFALL" in res

    price_crash = res["PRICE_CRASH"]
    assert "top_crop" in price_crash
    assert len(price_crash["rankings"]) <= 5


# ---------------------------------------------------------------------------
# 7. FastAPI Endpoint Integration Tests
# ---------------------------------------------------------------------------
def test_api_get_crops():
    resp = client.get("/crop-planning/crops")
    assert resp.status_code == 200
    crops = resp.json()
    assert len(crops) == 8
    names = [c["crop_name"] for c in crops]
    assert "Tomato" in names
    assert "Potato" in names


def test_api_get_scenarios():
    resp = client.get("/crop-planning/scenarios")
    assert resp.status_code == 200
    data = resp.json()
    assert "scenarios" in data
    assert len(data["scenarios"]) == 7


def test_api_crop_recommendation_success():
    payload = {
        "region": "Ranchi",
        "land_area_acres": 4.5,
        "season": "Rabi",
        "irrigation": True,
        "distance_to_market_km": 20.0,
    }
    resp = client.post("/crop-recommendation", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["region"] == "Ranchi"
    assert data["season"] == "Rabi"
    assert data["land_area_acres"] == 4.5
    assert len(data["recommendations"]) == 8
    assert data["top_crop"]["rank"] == 1
    assert data["diversification_plan"]["total_acres"] == 4.5
    assert len(data["explainability"]["why_top_crop"]) > 0


def test_api_crop_recommendation_invalid_region():
    payload = {
        "region": "UnknownCity",
        "land_area_acres": 3.0,
        "season": "Rabi",
    }
    resp = client.post("/crop-recommendation", json=payload)
    assert resp.status_code == 400
    assert "Unsupported Jharkhand region" in resp.json()["detail"]


def test_api_crop_recommendation_invalid_season():
    payload = {
        "region": "Ranchi",
        "land_area_acres": 3.0,
        "season": "InvalidSeason",
    }
    resp = client.post("/crop-recommendation", json=payload)
    assert resp.status_code == 400
    assert "Unsupported season" in resp.json()["detail"]


def test_api_crop_scenarios_post():
    payload = {
        "region": "Ranchi",
        "land_area_acres": 5.0,
        "season": "Rabi",
        "irrigation": True,
    }
    resp = client.post("/crop-planning/scenarios", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "scenarios" in data
    assert "NORMAL" in data["scenarios"]
    assert "PRICE_CRASH" in data["scenarios"]
