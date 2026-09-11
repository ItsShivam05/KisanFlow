"""
Main API Router aggregating all sub-routers.
"""

from fastapi import APIRouter
from ai_service.app.api.health import router as health_router
from ai_service.app.api.forecast import router as forecast_router
from ai_service.app.api.matching import router as matching_router
from ai_service.app.api.routing import router as routing_router
from ai_service.app.api.price import router as price_router
from ai_service.app.api.pipeline import router as pipeline_router

api_router = APIRouter()

api_router.include_router(health_router)
api_router.include_router(forecast_router)
api_router.include_router(matching_router)
api_router.include_router(routing_router)
api_router.include_router(price_router)
api_router.include_router(pipeline_router)
