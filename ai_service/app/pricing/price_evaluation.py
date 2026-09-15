"""
Model Evaluation and Baseline Benchmarking for Agricultural Price Prediction.

Implements:
- Naive Baseline: Tomorrow's price = Today's price (P_t = P_t-1).
- Moving Average Baseline: Tomorrow's price = 7-day moving average of past prices.
- Primary Model: XGBoost Regressor.
- Metric calculation: MAE (INR/kg), RMSE (INR/kg), MAPE (%).
- Slice-based out-of-sample evaluation by commodity and region.
- Rigorous reporting without falsely labelling MAPE as "accuracy".
"""

from typing import Dict, List, Any, Tuple
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, root_mean_squared_error, mean_absolute_percentage_error
from ai_service.app.utils.logger import logger


def calculate_price_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
    """
    Compute time-series evaluation metrics for agricultural prices:
    - MAE: Mean Absolute Error (INR/kg)
    - RMSE: Root Mean Squared Error (INR/kg)
    - MAPE: Mean Absolute Percentage Error (%) - Note: Not accuracy!
    """
    y_true = np.asarray(y_true, dtype=float)
    y_pred = np.asarray(y_pred, dtype=float)

    # Avoid zero division in MAPE
    nonzero_mask = y_true > 0
    if not np.any(nonzero_mask):
        return {"mae": 0.0, "rmse": 0.0, "mape_pct": 0.0}

    mae = float(mean_absolute_error(y_true, y_pred))
    rmse = float(root_mean_squared_error(y_true, y_pred))
    mape = float(mean_absolute_percentage_error(y_true[nonzero_mask], y_pred[nonzero_mask]) * 100.0)

    return {
        "mae": round(mae, 2),
        "rmse": round(rmse, 2),
        "mape_pct": round(mape, 2),
    }


def evaluate_baselines(test_df: pd.DataFrame) -> Dict[str, Any]:
    """
    Compute Naive (P_t = P_t-1) and 7-day Moving Average baselines on the test split.
    """
    y_true = test_df["modal_price"].values
    y_naive = test_df["price_lag_1"].values
    y_ma7 = test_df["price_rolling_mean_7"].values

    naive_metrics = calculate_price_metrics(y_true, y_naive)
    ma7_metrics = calculate_price_metrics(y_true, y_ma7)

    return {
        "naive": naive_metrics,
        "moving_average_7d": ma7_metrics,
    }


def generate_slice_evaluation_report(
    test_df: pd.DataFrame,
    predictions: np.ndarray,
) -> pd.DataFrame:
    """
    Generate detailed slice-based evaluation comparing XGBoost vs Naive & 7d MA
    across every (commodity, region) combination in the out-of-sample test set.
    """
    df = test_df.copy()
    df["xgb_pred"] = predictions

    records = []
    for (commodity, region), group in df.groupby(["commodity", "region"]):
        y_true = group["modal_price"].values
        y_xgb = group["xgb_pred"].values
        y_naive = group["price_lag_1"].values
        y_ma7 = group["price_rolling_mean_7"].values

        xgb_m = calculate_price_metrics(y_true, y_xgb)
        naive_m = calculate_price_metrics(y_true, y_naive)
        ma7_m = calculate_price_metrics(y_true, y_ma7)

        # Improvement over naive
        mae_imp_pct = round(((naive_m["mae"] - xgb_m["mae"]) / max(0.01, naive_m["mae"])) * 100.0, 1)

        records.append({
            "commodity": commodity,
            "region": region,
            "sample_size": len(group),
            "xgb_mae": xgb_m["mae"],
            "xgb_rmse": xgb_m["rmse"],
            "xgb_mape_pct": xgb_m["mape_pct"],
            "naive_mae": naive_m["mae"],
            "naive_rmse": naive_m["rmse"],
            "naive_mape_pct": naive_m["mape_pct"],
            "ma7_mae": ma7_m["mae"],
            "ma7_rmse": ma7_m["rmse"],
            "mae_improvement_over_naive_pct": mae_imp_pct,
            "beats_naive_baseline": xgb_m["mae"] < naive_m["mae"],
        })

    report_df = pd.DataFrame(records)
    return report_df
