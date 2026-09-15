"""
Script to generate and prepare the Jharkhand Agricultural Price Dataset.
Saves:
- Raw synthetic dataset: data/raw/jharkhand_price_synthetic.csv
- Processed feature dataset: data/processed/jharkhand_price_features.csv
"""

from pathlib import Path
from ai_service.app.config import settings
from ai_service.app.pricing.price_data import (
    generate_jharkhand_synthetic_price_data,
    clean_and_validate_price_data,
    SYNTHETIC_DATA_DISCLAIMER,
)
from ai_service.app.pricing.price_features import generate_price_features
from ai_service.app.utils.logger import logger


def run():
    raw_path = Path(settings.JHARKHAND_RAW_PRICE_PATH)
    proc_path = Path(settings.JHARKHAND_PROCESSED_PRICE_PATH)

    logger.info("=" * 60)
    logger.info("Generating Jharkhand Agricultural Price Dataset...")
    logger.info(SYNTHETIC_DATA_DISCLAIMER)
    logger.info("=" * 60)

    raw_path.parent.mkdir(parents=True, exist_ok=True)
    raw_df = generate_jharkhand_synthetic_price_data()
    raw_df.to_csv(raw_path, index=False)
    logger.info(f"Saved raw synthetic dataset to {raw_path} ({len(raw_df)} rows).")

    logger.info("Cleaning, validating, and applying IQR outlier clipping...")
    clean_df = clean_and_validate_price_data(raw_df)

    logger.info("Engineering leakage-free chronological features (lags, rolling stats, spatial)...")
    feature_df = generate_price_features(clean_df)

    proc_path.parent.mkdir(parents=True, exist_ok=True)
    feature_df.to_csv(proc_path, index=False)
    logger.info(f"Saved preprocessed feature dataset to {proc_path} ({len(feature_df)} rows).")
    logger.info("Jharkhand price dataset preparation complete!")


if __name__ == "__main__":
    run()
