"""
OR-Tools Route Optimization API Route (Issue #10).
"""

from fastapi import APIRouter, HTTPException
from ai_service.app.schemas.routing import RouteOptimizeRequest, RouteOptimizeResponse
from ai_service.app.optimization.solver import solve_cvrp
from ai_service.app.utils.logger import logger

router = APIRouter(tags=["Route Optimization"])

@router.post("/optimize-route", response_model=RouteOptimizeResponse)
def optimize_route_endpoint(request: RouteOptimizeRequest):
    """
    Solve Capacitated Vehicle Routing Problem (CVRP) with Google OR-Tools.
    Generates multi-stop pickup routes and compares against unoptimized baseline.
    """
    try:
        response = solve_cvrp(request)
        return response
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error during route optimization: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Route optimization failed: {str(e)}")
