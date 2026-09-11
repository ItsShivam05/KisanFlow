"""
Dataset Preparation CLI Script (Issue #7).

Usage:
    python -m ai_service.scripts.prepare_dataset
"""

import sys
from pathlib import Path
import pandas as pd

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(BASE_DIR))

from ai_service.app.config import settings
from ai_service.app.forecasting.generator import generate_agricultural_demand_data
from ai_service.app.forecasting.dataset import run_data_preparation_pipeline
from ai_service.app.utils.logger import logger

def main():
    logger.info("=== STEP 1: Generating Raw Agricultural Demand Dataset ===")
    raw_path = Path(settings.RAW_DATA_PATH)
    raw_path.parent.mkdir(parents=True, exist_ok=True)
    
    raw_df = generate_agricultural_demand_data(
        start_date="2024-01-01",
        end_date="2026-09-01",
        random_seed=42
    )
    raw_df.to_csv(raw_path, index=False)
    logger.info(f"Generated raw dataset: {len(raw_df):,} records saved to {raw_path}")
    logger.info(f"Commodities: {sorted(raw_df['commodity'].unique().tolist())}")
    logger.info(f"Regions: {sorted(raw_df['region'].unique().tolist())}")
    logger.info(f"Date range: {raw_df['date'].min()} to {raw_df['date'].max()}")
    
    logger.info("\n=== STEP 2: Running Data Preparation & Feature Engineering Pipeline ===")
    proc_path = Path(settings.PROCESSED_DATA_PATH)
    proc_df = run_data_preparation_pipeline(str(raw_path), str(proc_path))
    
    logger.info(f"Processed dataset ready: {len(proc_df):,} rows with {len(proc_df.columns)} features.")
    logger.info(f"Features created: {[c for c in proc_df.columns if 'lag' in c or 'rolling' in c or 'season' in c]}")
    logger.info("=== Dataset Preparation Complete! ===")

if __name__ == "__main__":
    main()
