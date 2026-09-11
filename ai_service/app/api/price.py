"""
Market Price Intelligence API Route (Prototype).
"""

from fastapi import APIRouter, HTTPException
from ai_service.app.schemas.price import PriceEstimateRequest, PriceEstimateResponse
from ai_service.app.services.price_service import estimate_current_market_price
from ai_service.app.utils.logger import logger

router = APIRouter(tags=["Market Price Intelligence"])

@router.post("/price-estimate", response_model=PriceEstimateResponse)
def estimate_price_endpoint(request: PriceEstimateRequest):
    """
    Estimate current market spot price using Gemini AI (if configured) or calibrated simulation.
    Compares against historical baseline to flag volatility.
    """
    try:
        response = estimate_current_market_price(request)
        return response
    except Exception as e:
        logger.error(f"Error during price estimation: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Price estimation failed: {str(e)}")
