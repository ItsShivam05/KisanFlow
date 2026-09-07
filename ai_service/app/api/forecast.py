"""
Forecasting API Routes (Issue #8).
"""

from pathlib import Path
from fastapi import APIRouter, HTTPException, Depends
import pandas as pd

from ai_service.app.schemas.forecast import ForecastRequest, ForecastResponse, ModelInfoResponse
from ai_service.app.forecasting.model import DemandForecastModel
from ai_service.app.config import settings
from ai_service.app.utils.logger import logger

router = APIRouter(tags=["Forecasting"])

_model_instance = None
_historical_data_cache = None

def get_forecast_model() -> DemandForecastModel:
    global _model_instance
    if _model_instance is None:
        if not Path(settings.MODEL_PATH).exists():
            raise HTTPException(
                status_code=503,
                detail="Forecasting model is not trained yet. Run dataset preparation and model training first."
            )
        _model_instance = DemandForecastModel(settings.MODEL_PATH)
    return _model_instance

def get_historical_data() -> pd.DataFrame:
    global _historical_data_cache
    if _historical_data_cache is None:
        if not Path(settings.PROCESSED_DATA_PATH).exists():
            raise HTTPException(
                status_code=503,
                detail="Processed dataset not found. Please run data preparation pipeline first."
            )
        _historical_data_cache = pd.read_csv(settings.PROCESSED_DATA_PATH)
    return _historical_data_cache

@router.post("/forecast", response_model=ForecastResponse)
def generate_forecast(
    request: ForecastRequest,
    model: DemandForecastModel = Depends(get_forecast_model),
    data: pd.DataFrame = Depends(get_historical_data)
):
    """
    Generate future demand predictions (7 or 14 days) for an agricultural commodity in a given region.
    """
    try:
        forecast = model.predict_horizon(
            historical_df=data,
            product=request.product,
            region=request.region,
            horizon_days=request.horizon_days
        )
        return forecast
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error during forecasting: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Forecasting error: {str(e)}")

@router.get("/model-info", response_model=ModelInfoResponse)
def get_model_information(model: DemandForecastModel = Depends(get_forecast_model)):
    """Retrieve metadata, features, and validation metrics of the active forecasting model."""
    meta = model.metadata
    if not meta:
        raise HTTPException(status_code=404, detail="Model metadata not found.")
    return ModelInfoResponse(
        model_name=meta.get("model_name", "Demand Forecaster"),
        model_version=meta.get("model_version", "v1.0"),
        target_variable="demand_quantity_kg",
        supported_commodities=meta.get("supported_commodities", []),
        supported_regions=meta.get("supported_regions", []),
        features=meta.get("features", []),
        evaluation_metrics=meta.get("metrics", {}),
        trained_at=meta.get("trained_at")
    )
