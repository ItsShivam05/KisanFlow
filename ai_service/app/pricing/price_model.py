"""
XGBoost Price Forecasting Engine for Agricultural Mandis.

Implements:
- Chronological train (70%) / validation (15%) / test (15%) splits (strictly zero data leakage).
- XGBoost Regressor as the primary model with HistGradientBoosting fallback if needed.
- Commodity-specific model training with categorical region encoding.
- Empirical error dispersion range estimation (10th-90th percentiles of validation residuals).
- Model persistence and metadata tracking.
"""

from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, root_mean_squared_error, mean_absolute_percentage_error

try:
    from xgboost import XGBRegressor
    HAS_XGBOOST = True
except ImportError:
    HAS_XGBOOST = False

from sklearn.ensemble import HistGradientBoostingRegressor
from ai_service.app.pricing.price_data import SUPPORTED_COMMODITIES, JHARKHAND_MARKETS
from ai_service.app.pricing.price_features import PRICE_FEATURE_COLUMNS, generate_price_features
from ai_service.app.pricing.price_evaluation import calculate_price_metrics, evaluate_baselines, generate_slice_evaluation_report
from ai_service.app.pricing.price_explainability import extract_feature_importance
from ai_service.app.utils.logger import logger


DEFAULT_XGB_PARAMS: Dict[str, Any] = {
    "n_estimators": 300,
    "max_depth": 5,
    "learning_rate": 0.05,
    "subsample": 0.85,
    "colsample_bytree": 0.85,
    "random_state": 42,
    "n_jobs": -1,
}


class CommodityPriceModel:
    """Individual model trained for a specific agricultural commodity across regions."""

    def __init__(
        self,
        commodity: str,
        params: Optional[Dict[str, Any]] = None,
    ):
        self.commodity = commodity
        self.params = params or DEFAULT_XGB_PARAMS.copy()
        self.model: Any = None
        self.feature_columns: List[str] = []
        self.metrics: Dict[str, Any] = {}
        self.baseline_metrics: Dict[str, Any] = {}
        self.residual_lower_quantile: float = -2.5
        self.residual_upper_quantile: float = 2.5
        self.feature_importances: List[Dict[str, Any]] = []
        self.trained_at: Optional[str] = None

    def _init_estimator(self):
        if HAS_XGBOOST:
            return XGBRegressor(**self.params)
        else:
            logger.warning("XGBoost not installed; falling back to HistGradientBoostingRegressor.")
            return HistGradientBoostingRegressor(
                max_iter=self.params.get("n_estimators", 300),
                max_depth=self.params.get("max_depth", 5),
                learning_rate=self.params.get("learning_rate", 0.05),
                random_state=42,
            )

    def train(
        self,
        commodity_df: pd.DataFrame,
        feature_columns: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Train the model using strict chronological splitting:
        - First 70%: Training set
        - Next 15%: Validation set (for residual dispersion calibration and hyperparameter validation)
        - Final 15%: Test set (strictly out-of-sample test evaluation)
        """
        data = commodity_df.sort_values("date").reset_index(drop=True)
        n = len(data)
        if n < 60:
            raise ValueError(f"Insufficient historical data for {self.commodity}: {n} records (need >= 60).")

        n_train = int(n * 0.70)
        n_val = int(n * 0.15)

        train_df = data.iloc[:n_train]
        val_df = data.iloc[n_train : n_train + n_val]
        test_df = data.iloc[n_train + n_val :]

        # Determine feature columns present in dataset
        feats = feature_columns or [c for c in PRICE_FEATURE_COLUMNS if c in train_df.columns]
        self.feature_columns = feats

        X_train, y_train = train_df[feats].values, train_df["modal_price"].values
        X_val, y_val = val_df[feats].values, val_df["modal_price"].values
        X_test, y_test = test_df[feats].values, test_df["modal_price"].values

        # Initialize & fit estimator
        self.model = self._init_estimator()
        self.model.fit(X_train, y_train)

        # Validation set evaluation & empirical residual calibration
        val_preds = self.model.predict(X_val)
        val_residuals = y_val - val_preds
        # 10th and 90th percentile of residuals for estimated prediction range
        self.residual_lower_quantile = float(np.percentile(val_residuals, 10))
        self.residual_upper_quantile = float(np.percentile(val_residuals, 90))

        # Test set evaluation (out-of-sample)
        test_preds = self.model.predict(X_test)
        self.metrics = calculate_price_metrics(y_test, test_preds)
        self.baseline_metrics = evaluate_baselines(test_df)

        # Feature importances
        self.feature_importances = extract_feature_importance(self.model, self.feature_columns)
        self.trained_at = datetime.utcnow().isoformat()

        logger.info(
            f"Trained {self.commodity} price model: "
            f"Test MAE={self.metrics['mae']} INR/kg, RMSE={self.metrics['rmse']} INR/kg, MAPE={self.metrics['mape_pct']}%. "
            f"Baseline Naive MAE={self.baseline_metrics['naive']['mae']} INR/kg."
        )

        return {
            "commodity": self.commodity,
            "train_samples": len(train_df),
            "val_samples": len(val_df),
            "test_samples": len(test_df),
            "metrics": self.metrics,
            "baseline_metrics": self.baseline_metrics,
            "residual_bounds": (self.residual_lower_quantile, self.residual_upper_quantile),
            "top_features": self.feature_importances[:5],
        }

    def predict_one(self, feature_row: Dict[str, Any]) -> Tuple[float, float, float]:
        """
        Predict modal price for a single feature vector.
        Returns: (predicted_price, lower_estimate, upper_estimate)
        """
        if self.model is None:
            raise RuntimeError(f"Model for {self.commodity} is not trained.")

        feature_vector = np.array([[feature_row.get(col, 0.0) for col in self.feature_columns]], dtype=float)
        raw_pred = float(self.model.predict(feature_vector)[0])
        pred_price = max(4.0, round(raw_pred, 2))

        # Apply empirical validation residuals for estimated prediction range
        lower_est = max(3.0, round(pred_price + self.residual_lower_quantile, 2))
        upper_est = round(pred_price + self.residual_upper_quantile, 2)
        if lower_est > pred_price:
            lower_est = round(pred_price * 0.92, 2)
        if upper_est < pred_price:
            upper_est = round(pred_price * 1.08, 2)

        return pred_price, lower_est, upper_est


class JharkhandPriceModelRegistry:
    """Registry holding commodity-specific trained price models for Jharkhand."""

    def __init__(self, storage_path: Optional[str] = None):
        self.storage_path = Path(storage_path) if storage_path else None
        self.models: Dict[str, CommodityPriceModel] = {}
        self.slice_reports: Dict[str, pd.DataFrame] = {}

    def train_all(self, feature_df: pd.DataFrame) -> Dict[str, Any]:
        """Train models for all supported commodities present in feature_df."""
        results: Dict[str, Any] = {}
        for commodity in SUPPORTED_COMMODITIES.keys():
            comm_data = feature_df[feature_df["commodity"] == commodity]
            if comm_data.empty:
                logger.warning(f"No data found for commodity '{commodity}', skipping.")
                continue

            model = CommodityPriceModel(commodity=commodity)
            res = model.train(comm_data)
            self.models[commodity] = model
            results[commodity] = res

        return results

    def save(self, filepath: Optional[str] = None) -> None:
        """Persist all models and metadata to a single file."""
        target_path = Path(filepath) if filepath else self.storage_path
        if not target_path:
            raise ValueError("No target filepath specified for saving models.")

        target_path.parent.mkdir(parents=True, exist_ok=True)
        payload = {
            "version": "1.0.0",
            "saved_at": datetime.utcnow().isoformat(),
            "models": self.models,
        }
        joblib.dump(payload, target_path)
        logger.info(f"Saved {len(self.models)} price models to {target_path}")

    def load(self, filepath: Optional[str] = None) -> None:
        """Load persisted models."""
        src_path = Path(filepath) if filepath else self.storage_path
        if not src_path or not src_path.exists():
            raise FileNotFoundError(f"Model file not found at {src_path}")

        payload = joblib.load(src_path)
        self.models = payload.get("models", {})
        logger.info(f"Loaded {len(self.models)} price models from {src_path}")

    def get_model(self, commodity: str) -> Optional[CommodityPriceModel]:
        return self.models.get(commodity.strip().title())
