"""
End-to-End Integrated Pipeline API Route.
"""

from fastapi import APIRouter, HTTPException, Depends
import pandas as pd

from ai_service.app.schemas.pipeline import PipelineRunRequest, PipelineRunResponse
from ai_service.app.services.pipeline_service import run_end_to_end_pipeline
from ai_service.app.api.forecast import get_forecast_model, get_historical_data
from ai_service.app.forecasting.model import DemandForecastModel
from ai_service.app.utils.logger import logger

router = APIRouter(tags=["Integrated Pipeline"])

@router.post("/pipeline/run", response_model=PipelineRunResponse)
def execute_pipeline_endpoint(
    request: PipelineRunRequest,
    model: DemandForecastModel = Depends(get_forecast_model),
    data: pd.DataFrame = Depends(get_historical_data)
):
    """
    Execute full KisanFlow AI & Optimization lifecycle:
    Demand Forecast (#8) -> Price Signal -> Supplier Matching (#9) -> OR-Tools Route Optimization (#10).
    """
    try:
        response = run_end_to_end_pipeline(
            request=request,
            forecast_model=model,
            historical_df=data
        )
        return response
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error during pipeline execution: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Pipeline execution failed: {str(e)}")
