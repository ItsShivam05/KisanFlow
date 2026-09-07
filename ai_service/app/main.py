"""
KisanFlow AI & Optimization Service - Main FastAPI Application.
"""

from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from ai_service.app.config import settings
from ai_service.app.api.router import api_router
from ai_service.app.utils.logger import logger
from ai_service.app.forecasting.generator import generate_agricultural_demand_data
from ai_service.app.forecasting.dataset import run_data_preparation_pipeline
from ai_service.app.forecasting.model import DemandForecastModel

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Service startup and shutdown lifecycle:
    Checks if raw dataset, processed dataset, and model exist; auto-initializes them if missing.
    """
    logger.info("Initializing KisanFlow AI & Optimization Service...")
    raw_path = Path(settings.RAW_DATA_PATH)
    proc_path = Path(settings.PROCESSED_DATA_PATH)
    model_path = Path(settings.MODEL_PATH)
    
    # Auto-initialize baseline dataset and model if not yet generated
    if not raw_path.exists():
        logger.info(f"Raw dataset not found at {raw_path}. Generating baseline agricultural demand dataset...")
        raw_path.parent.mkdir(parents=True, exist_ok=True)
        raw_df = generate_agricultural_demand_data()
        raw_df.to_csv(raw_path, index=False)
        logger.info(f"Generated raw dataset: {len(raw_df)} records.")
        
    if not proc_path.exists():
        logger.info(f"Processed dataset not found at {proc_path}. Running data preparation pipeline...")
        run_data_preparation_pipeline(str(raw_path), str(proc_path))
        
    if not model_path.exists():
        logger.info(f"Forecasting model not found at {model_path}. Training baseline model...")
        import pandas as pd
        df = pd.read_csv(proc_path)
        model = DemandForecastModel()
        model.train(df)
        model.save(str(model_path))
        logger.info("Baseline demand forecasting model successfully trained and persisted.")
        
    logger.info("KisanFlow AI Service initialization complete and ready to serve requests.")
    yield
    logger.info("Shutting down KisanFlow AI & Optimization Service...")

def create_app() -> FastAPI:
    app = FastAPI(
        title="KisanFlow AI & Optimization Service",
        description=(
            "AI-powered Agricultural Supply Chain Platform API:\n"
            "- Demand Forecasting (XGBoost baseline) [#8]\n"
            "- Demand Dataset Pipeline [#7]\n"
            "- Supplier Matching & Allocation (Multi-criteria scoring) [#9]\n"
            "- Capacitated Route Optimization (Google OR-Tools CVRP) [#10]\n"
            "- Market Price Intelligence (Prototype with Gemini fallback)"
        ),
        version="1.0.0",
        lifespan=lifespan
    )

    # CORS configuration to enable frontend / Node backend integration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include routers
    app.include_router(api_router)
    return app

app = create_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("ai_service.app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
