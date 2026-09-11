"""
Model Training CLI Script (Issue #8).

Usage:
    python -m ai_service.scripts.train_forecasting
"""

import sys
from pathlib import Path
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(BASE_DIR))

from ai_service.app.config import settings
from ai_service.app.forecasting.model import DemandForecastModel
from ai_service.app.forecasting.dataset import run_data_preparation_pipeline
from ai_service.app.utils.logger import logger

def main():
    logger.info("=== STEP 1: Loading Processed Dataset ===")
    proc_path = Path(settings.PROCESSED_DATA_PATH)
    if not proc_path.exists():
        logger.info("Processed data not found. Running preparation pipeline...")
        from ai_service.scripts.prepare_dataset import main as prep_main
        prep_main()
        
    df = pd.read_csv(proc_path)
    logger.info(f"Loaded {len(df):,} records for model training.")
    
    logger.info("\n=== STEP 2: Training Chronological Demand Forecasting Model ===")
    model = DemandForecastModel()
    metrics = model.train(df)
    
    model_path = Path(settings.MODEL_PATH)
    model.save(str(model_path))
    
    logger.info("\n=== Model Training Summary ===")
    logger.info(f"Model saved to: {model_path}")
    logger.info(f"MAE:  {metrics['mae_kg']:.2f} kg")
    logger.info(f"RMSE: {metrics['rmse_kg']:.2f} kg")
    logger.info(f"MAPE: {metrics['mape_percent']:.2f} %")
    logger.info(f"Holdout test samples: {metrics['test_sample_count']:,}")
    
    logger.info("\n=== Testing Sample 7-day Forecast for Tomato in Patna ===")
    sample_forecast = model.predict_horizon(df, product="Tomato", region="Patna", horizon_days=7)
    logger.info(f"Total 7-day predicted demand: {sample_forecast.total_predicted_demand_kg:,.1f} kg")
    for d in sample_forecast.daily_forecast:
        logger.info(f"  {d.date} ({d.day_of_week}): {d.predicted_demand_kg:,.1f} kg (range: {d.lower_bound_kg} - {d.upper_bound_kg} kg)")
        
    logger.info("=== Training and Validation Complete! ===")

if __name__ == "__main__":
    main()
