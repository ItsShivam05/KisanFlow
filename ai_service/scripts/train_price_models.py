"""
Script to train XGBoost price models for Jharkhand and benchmark against Naive and 7-day MA baselines.
"""

from pathlib import Path
import pandas as pd
from ai_service.app.config import settings
from ai_service.app.pricing.price_model import JharkhandPriceModelRegistry
from ai_service.app.pricing.price_evaluation import generate_slice_evaluation_report
from ai_service.app.utils.logger import logger


def run():
    proc_path = Path(settings.JHARKHAND_PROCESSED_PRICE_PATH)
    model_path = Path(settings.JHARKHAND_PRICE_MODEL_PATH)

    if not proc_path.exists():
        logger.info(f"Processed features not found at {proc_path}. Generating dataset first...")
        from ai_service.scripts.prepare_jharkhand_price_data import run as prep_run
        prep_run()

    logger.info(f"Loading features from {proc_path}...")
    df = pd.read_csv(proc_path)

    registry = JharkhandPriceModelRegistry(storage_path=str(model_path))
    logger.info("Training commodity-specific XGBoost price models...")
    train_results = registry.train_all(df)

    logger.info("=" * 70)
    logger.info("MODEL EVALUATION & BASELINE BENCHMARK REPORT (Out-of-sample Test Split)")
    logger.info("=" * 70)

    for commodity, res in train_results.items():
        m = res["metrics"]
        base = res["baseline_metrics"]
        naive = base["naive"]
        ma7 = base["moving_average_7d"]
        improvement = round(((naive["mae"] - m["mae"]) / max(0.01, naive["mae"])) * 100.0, 1)

        logger.info(f"\nCommodity: {commodity}")
        logger.info(f"  Test Sample Size: {res['test_samples']} observations")
        logger.info(f"  XGBoost Regressor  : MAE = INR {m['mae']}/kg | RMSE = INR {m['rmse']}/kg | MAPE = {m['mape_pct']}%")
        logger.info(f"  Naive (Today=Yest) : MAE = INR {naive['mae']}/kg | RMSE = INR {naive['rmse']}/kg | MAPE = {naive['mape_pct']}%")
        logger.info(f"  7-Day Moving Avg   : MAE = INR {ma7['mae']}/kg | RMSE = INR {ma7['rmse']}/kg | MAPE = {ma7['mape_pct']}%")
        logger.info(f"  Improvement over Naive Baseline: {improvement}%")
        logger.info(f"  Empirical Error Bounds (10th-90th percentile): [{res['residual_bounds'][0]:.2f}, +{res['residual_bounds'][1]:.2f}] INR/kg")

        logger.info("  Top 3 Explanatory Features:")
        for feat in res["top_features"][:3]:
            logger.info(f"    - {feat['display_name']} ({feat['percentage']}%)")

    # Persist registry
    registry.save()
    logger.info(f"\nPersisted trained price models and benchmark metadata to {model_path}.")


if __name__ == "__main__":
    run()
