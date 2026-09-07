"""
Health Check API Route.
"""

from fastapi import APIRouter
from datetime import datetime

router = APIRouter(tags=["Health"])

@router.get("/health")
def health_check():
    """Health check endpoint confirming service status and operational metadata."""
    return {
        "status": "healthy",
        "service": "KisanFlow AI & Optimization Service",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat()
    }
