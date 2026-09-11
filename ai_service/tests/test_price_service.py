"""
Tests for Market Price Intelligence Prototype Service.
"""

import pytest
from ai_service.app.schemas.price import PriceEstimateRequest
from ai_service.app.services.price_service import estimate_current_market_price

def test_price_service_deterministic_fallback():
    """Test price service generates valid response even when GEMINI_API_KEY is unset."""
    req = PriceEstimateRequest(
        commodity="Tomato",
        region="Patna",
        historical_baseline_price=30.0
    )
    resp = estimate_current_market_price(req)
    
    assert resp.observation.commodity == "Tomato"
    assert resp.observation.region == "Patna"
    assert resp.observation.price_per_kg > 0
    assert resp.observation.is_simulated is True
    assert resp.observation.source in ["gemini_ai_estimated", "simulated_market_signal"]
    assert resp.price_deviation_inr is not None
    assert resp.price_deviation_percent is not None

def test_price_service_volatility_alert():
    """Test price volatility alert triggered when price deviation >= 15%."""
    req = PriceEstimateRequest(
        commodity="Tomato",
        region="Patna",
        historical_baseline_price=20.0  # low baseline will create >15% surge
    )
    resp = estimate_current_market_price(req)
    if resp.price_deviation_percent >= 15.0:
        assert resp.market_alert is not None
        assert "ALERT" in resp.market_alert
