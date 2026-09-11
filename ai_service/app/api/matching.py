"""
Supplier Matching API Route (Issue #9).
"""

from fastapi import APIRouter, HTTPException
from ai_service.app.schemas.matching import MatchSuppliersRequest, MatchSuppliersResponse
from ai_service.app.matching.engine import match_suppliers
from ai_service.app.utils.logger import logger

router = APIRouter(tags=["Supplier Matching"])

@router.post("/match-suppliers", response_model=MatchSuppliersResponse)
def match_suppliers_endpoint(request: MatchSuppliersRequest):
    """
    Score and rank available farmer/FPO suppliers against buyer procurement requirements.
    Iteratively allocates quantities, enforces inventory capacity limits, and provides explainable reasons.
    """
    try:
        response = match_suppliers(
            requirement=request.requirement,
            candidate_suppliers=request.custom_suppliers,
            weights=request.weights
        )
        return response
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error during supplier matching: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Supplier matching failed: {str(e)}")
