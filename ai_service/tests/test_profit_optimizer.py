"""
Unit Tests for Farmer Profit Optimization, Decision Rules, and Market Allocation.
"""

import pytest
from ai_service.app.pricing.profit_optimizer import FarmerProfitOptimizer


@pytest.fixture
def optimizer():
    return FarmerProfitOptimizer(
        cost_per_km=20.0,
        road_circuity_factor=1.28,
        holding_cost_per_kg_day=0.15,
        handling_cost_per_kg=0.30,
        consumer_price_threshold=45.0,
    )


def test_net_realization_exact_deductions(optimizer):
    """
    Verify exact accounting:
    Expected Net Realization = Expected Selling Price
                             - Transport Cost
                             - Holding Cost
                             - Handling Cost
                             - Wastage Cost
    """
    res = optimizer.calculate_net_realization(
        commodity="Tomato",
        expected_price_per_kg=25.0,
        distance_km=100.0,
        quantity_kg=2000.0,
        days_held=2,
    )

    # Transport: (100 km * 20 ₹/km) / 2000 kg = ₹1.00/kg
    assert res["transport_cost_per_kg"] == 1.00
    # Holding: 2 days * 0.15 ₹/kg/day = ₹0.30/kg
    assert res["holding_cost_per_kg"] == 0.30
    # Handling: ₹0.30/kg
    assert res["handling_cost_per_kg"] == 0.30
    # Wastage: 25 ₹/kg * 2.5% per day * 2 days = ₹1.25/kg
    assert res["wastage_cost_per_kg"] == 1.25

    total_costs = 1.00 + 0.30 + 0.30 + 1.25  # 2.85
    expected_net = round(25.0 - total_costs, 2)  # 22.15

    assert res["total_deductions_per_kg"] == total_costs
    assert res["expected_net_realization_per_kg"] == expected_net
    assert res["total_expected_net_profit"] == round(expected_net * 2000.0, 2)


def test_sell_now_vs_wait_profitable_wait(optimizer):
    """Test scenario where expected price appreciation easily beats holding and wastage -> WAIT."""
    daily_preds = [
        {"horizon_day": 1, "date": "2026-03-01", "predicted_price": 24.0, "price_change_vs_current": 2.0},
        {"horizon_day": 3, "date": "2026-03-03", "predicted_price": 29.0, "price_change_vs_current": 7.0},
        {"horizon_day": 7, "date": "2026-03-07", "predicted_price": 31.0, "price_change_vs_current": 9.0},
    ]

    eval_res = optimizer.evaluate_sell_now_vs_wait(
        commodity="Tomato",
        current_spot_price=22.0,
        daily_predictions=daily_preds,
        distance_km=20.0,
        quantity_kg=1000.0,
    )

    assert "WAIT" in eval_res["decision"]
    assert eval_res["optimal_wait_days"] > 0
    assert eval_res["expected_net_gain_per_kg"] > 0
    assert eval_res["recommended_net_realization"] > eval_res["sell_now_net_realization"]


def test_sell_now_vs_wait_unprofitable_wait(optimizer):
    """Test scenario where price is flat or drops, so holding costs reduce net profit -> SELL_NOW."""
    daily_preds = [
        {"horizon_day": 1, "date": "2026-03-01", "predicted_price": 21.5, "price_change_vs_current": -0.5},
        {"horizon_day": 3, "date": "2026-03-03", "predicted_price": 21.0, "price_change_vs_current": -1.0},
        {"horizon_day": 7, "date": "2026-03-07", "predicted_price": 20.0, "price_change_vs_current": -2.0},
    ]

    eval_res = optimizer.evaluate_sell_now_vs_wait(
        commodity="Tomato",
        current_spot_price=22.0,
        daily_predictions=daily_preds,
        distance_km=20.0,
        quantity_kg=1000.0,
    )

    assert eval_res["decision"] == "SELL_NOW"
    assert eval_res["optimal_wait_days"] == 0
    assert eval_res["expected_net_gain_per_kg"] == 0.0


def test_multi_market_comparison_net_realization_trumps_gross_price(optimizer):
    """
    CRITICAL TEST:
    Mandi A has price ₹28/kg but is 200 km away (high transport cost).
    Mandi B has price ₹26/kg but is 15 km away (low transport cost).
    Net realization in Mandi B must be higher, so Mandi B must be RECOMMENDED over Mandi A!
    """
    market_prices = {
        "Ranchi": 26.0,       # 15 km away
        "Dumka": 28.0,        # 280 km away
    }

    results = optimizer.compare_markets(
        commodity="Tomato",
        quantity_kg=500.0,
        farmer_location="Ranchi",
        market_predicted_prices=market_prices,
    )

    assert len(results) == 2
    recommended_mkt = [r for r in results if r["recommended"]][0]
    # Local market Ranchi should win on net realization despite lower raw price
    assert recommended_mkt["market"] == "Ranchi"
    assert recommended_mkt["expected_net_realization"] > results[1]["expected_net_realization"]


def test_market_allocation_saturation_prevention(optimizer):
    """Verify that bulk quantities (e.g. 5,000 kg) are distributed across markets capped at max share."""
    market_options = [
        {"market": "Ranchi", "expected_net_realization": 24.0},
        {"market": "Jamshedpur", "expected_net_realization": 23.5},
        {"market": "Dhanbad", "expected_net_realization": 22.0},
    ]

    allocations = optimizer.allocate_market_supply(
        commodity="Tomato",
        total_quantity_kg=5000.0,
        market_options=market_options,
        max_single_market_share=0.50,
    )

    assert len(allocations) >= 2
    # First market must not exceed 50%
    assert allocations[0]["allocated_quantity_kg"] <= 2500.0
    total_allocated = sum(a["allocated_quantity_kg"] for a in allocations)
    assert total_allocated == 5000.0
