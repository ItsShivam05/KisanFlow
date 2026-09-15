"""
Smart Demand Allocation API Route.
"""

from fastapi import APIRouter, HTTPException
from ai_service.app.schemas.allocation import AllocationRequest, AllocationResponse
from ai_service.app.optimization.allocation import solve_demand_allocation
from ai_service.app.utils.logger import logger

router = APIRouter(tags=["Demand Allocation Optimization"])

@router.post("/optimize-allocation", response_model=AllocationResponse)
def optimize_allocation_endpoint(request: AllocationRequest):
    """
    Find optimal multi-supplier procurement allocations minimizing Total Landed Cost
    with partial quantity fulfillment, quality filtering, and top-K ranked proposals.
    """
    try:
        response = solve_demand_allocation(request, top_k=3)
        return response
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error during demand allocation optimization: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Allocation optimization failed: {str(e)}")
