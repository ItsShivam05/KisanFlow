"""
Market Price Intelligence Service (Prototype).

Provides current market price estimation and deviation analysis:
- Connects to Gemini API if GEMINI_API_KEY is configured
- Gracefully falls back to deterministic simulated market price if key is absent
- Strictly isolates AI estimations and flags them as simulated
- Analyzes price deviations vs historical baseline to trigger market volatility alerts
"""

import os
from datetime import datetime
from typing import Optional
from ai_service.app.schemas.price import PriceEstimateRequest, PriceEstimateResponse, PriceObservation
from ai_service.app.config import settings
from ai_service.app.utils.logger import logger

COMMODITY_FALLBACK_BASELINES = {
    "Tomato": 34.0,
    "Potato": 22.5,
    "Onion": 29.0
}

def estimate_current_market_price(request: PriceEstimateRequest) -> PriceEstimateResponse:
    """
    Estimate current market price using Gemini if available, or deterministic simulated baseline.
    """
    commodity = request.commodity.strip().title()
    region = request.region.strip().title()
    api_key = os.getenv("GEMINI_API_KEY") or settings.GEMINI_API_KEY
    
    price: float = COMMODITY_FALLBACK_BASELINES.get(commodity, 30.0)
    source: str = "simulated_market_signal"
    confidence: float = 0.85
    market_name: str = f"{region} APMC Wholesale Mandi"
    
    # Attempt Gemini Prototype Market Intelligence if key is available
    if api_key:
        try:
            from google import genai
            client = genai.Client(api_key=api_key)
            prompt = (
                f"You are an agricultural market intelligence prototype for Indian mandis. "
                f"Estimate the current wholesale spot price range in INR/kg for {commodity} in {region}. "
                f"Respond ONLY with a single numeric float representing the modal price in INR/kg (e.g. 34.50)."
            )
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )
            text = response.text.strip()
            # Extract float
            import re
            match = re.search(r"(\d+(\.\d+)?)", text)
            if match:
                price = float(match.group(1))
                source = "gemini_ai_estimated"
                confidence = 0.80
                logger.info(f"Gemini price estimation for {commodity} in {region}: ₹{price}/kg")
        except Exception as e:
            logger.warning(f"Gemini API estimation failed or unavailable ({e}). Using deterministic fallback.")
            source = "simulated_market_signal"
            confidence = 0.85
    else:
        logger.info(f"GEMINI_API_KEY not configured. Using calibrated simulated market signal for {commodity}.")
        
    obs = PriceObservation(
        commodity=commodity,
        region=region,
        market=market_name,
        price_per_kg=round(price, 2),
        timestamp=datetime.utcnow().isoformat(),
        source=source,
        confidence=confidence,
        is_simulated=True
    )
    
    # Analyze deviation against historical baseline
    baseline = request.historical_baseline_price or COMMODITY_FALLBACK_BASELINES.get(commodity, 30.0)
    dev_inr = round(price - baseline, 2)
    dev_pct = round((dev_inr / baseline) * 100.0, 2) if baseline > 0 else 0.0
    
    alert = None
    if dev_pct >= 15.0:
        alert = f"HIGH VOLATILITY ALERT: Market spot price is +{dev_pct}% above historical baseline (+₹{dev_inr}/kg)."
    elif dev_pct <= -15.0:
        alert = f"MARKET DIP SIGNAL: Market spot price is {dev_pct}% below historical baseline (₹{dev_inr}/kg discount)."
        
    return PriceEstimateResponse(
        observation=obs,
        historical_baseline_price=baseline,
        price_deviation_inr=dev_inr,
        price_deviation_percent=dev_pct,
        market_alert=alert
    )
