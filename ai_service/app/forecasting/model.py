"""
Demand Forecasting Baseline Engine (Issue #8).

Implements:
- Chronological train / val / test split (no future leakage)
- Gradient Boosting / XGBoost regressor
- Robust evaluation metrics: MAE, RMSE, MAPE
- Multi-step recursive forecasting for 7 and 14 day horizons
- Model persistence and metadata tracking
"""

import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, Any, Tuple, List, Optional
import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, root_mean_squared_error, mean_absolute_percentage_error
from sklearn.preprocessing import OrdinalEncoder

# Use XGBoost if available; gracefully fall back to HistGradientBoostingRegressor
try:
    from xgboost import XGBRegressor
    HAS_XGBOOST = True
except ImportError:
    HAS_XGBOOST = False

from sklearn.ensemble import HistGradientBoostingRegressor
from ai_service.app.utils.logger import logger
from ai_service.app.schemas.forecast import DailyForecast, ForecastResponse

FEATURE_COLUMNS = [
    "commodity_code",
    "region_code",
    "day_of_week_num",
    "day_of_month",
    "month",
    "season_code",
    "is_weekend",
    "price_lag_1",
    "price_rolling_mean_7",
    "demand_lag_1",
    "demand_lag_7",
    "demand_lag_14",
    "demand_rolling_mean_7",
    "demand_rolling_mean_14",
    "demand_rolling_std_7"
]

TARGET_COLUMN = "demand_quantity_kg"

class DemandForecastModel:
    def __init__(self, model_path: Optional[str] = None):
        self.model_path = model_path
        self.model = None
        self.commodity_encoder = OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1)
        self.region_encoder = OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1)
        self.feature_columns = FEATURE_COLUMNS
        self.metrics: Dict[str, float] = {}
        self.metadata: Dict[str, Any] = {}
        
        if model_path and Path(model_path).exists():
            self.load(model_path)
            
    def _create_base_regressor(self):
        if HAS_XGBOOST:
            return XGBRegressor(
                n_estimators=180,
                max_depth=5,
                learning_rate=0.06,
                subsample=0.85,
                colsample_bytree=0.85,
                random_state=42,
                n_jobs=-1
            )
        else:
            return HistGradientBoostingRegressor(
                max_iter=180,
                max_depth=6,
                learning_rate=0.06,
                random_state=42
            )
            
    def prepare_xy(self, df: pd.DataFrame, fit_encoders: bool = False) -> Tuple[pd.DataFrame, pd.Series]:
        """Encode categoricals and extract features/target."""
        data = df.copy()
        
        if fit_encoders:
            data["commodity_code"] = self.commodity_encoder.fit_transform(data[["commodity"]])
            data["region_code"] = self.region_encoder.fit_transform(data[["region"]])
        else:
            data["commodity_code"] = self.commodity_encoder.transform(data[["commodity"]])
            data["region_code"] = self.region_encoder.transform(data[["region"]])
            
        X = data[self.feature_columns]
        y = data[TARGET_COLUMN] if TARGET_COLUMN in data.columns else None
        return X, y

    def train(self, df: pd.DataFrame) -> Dict[str, float]:
        """
        Train the model using a strict chronological train/val/test split.
        Splits:
        - Train: 70% earliest
        - Validation: next 15%
        - Test: most recent 15%
        """
        data = df.sort_values("date").reset_index(drop=True)
        n = len(data)
        train_end = int(n * 0.70)
        val_end = int(n * 0.85)
        
        train_df = data.iloc[:train_end].copy()
        val_df = data.iloc[train_end:val_end].copy()
        test_df = data.iloc[val_end:].copy()
        
        logger.info(f"Chronological split: Train={len(train_df)}, Val={len(val_df)}, Test={len(test_df)}")
        
        X_train, y_train = self.prepare_xy(train_df, fit_encoders=True)
        X_val, y_val = self.prepare_xy(val_df, fit_encoders=False)
        X_test, y_test = self.prepare_xy(test_df, fit_encoders=False)
        
        self.model = self._create_base_regressor()
        
        if HAS_XGBOOST:
            self.model.fit(
                X_train, y_train,
                eval_set=[(X_val, y_val)],
                verbose=False
            )
        else:
            self.model.fit(X_train, y_train)
            
        # Evaluate on the holdout test set (unseen future data)
        y_pred = self.model.predict(X_test)
        y_pred = np.maximum(y_pred, 50.0) # non-negative demand floor
        
        mae = float(mean_absolute_error(y_test, y_pred))
        rmse = float(root_mean_squared_error(y_test, y_pred))
        mape = float(mean_absolute_percentage_error(y_test, y_pred) * 100.0)
        
        self.metrics = {
            "mae_kg": round(mae, 2),
            "rmse_kg": round(rmse, 2),
            "mape_percent": round(mape, 2),
            "test_sample_count": len(y_test)
        }
        
        self.metadata = {
            "model_name": "KisanFlow XGBoost Baseline" if HAS_XGBOOST else "KisanFlow HistGradientBoosting Baseline",
            "model_version": "v1.0-xgboost" if HAS_XGBOOST else "v1.0-histgradient",
            "supported_commodities": list(self.commodity_encoder.categories_[0]),
            "supported_regions": list(self.region_encoder.categories_[0]),
            "features": self.feature_columns,
            "trained_at": datetime.utcnow().isoformat(),
            "metrics": self.metrics
        }
        
        logger.info(f"Model evaluation metrics: MAE={mae:.2f} kg, RMSE={rmse:.2f} kg, MAPE={mape:.2f}%")
        return self.metrics

    def predict_horizon(
        self,
        historical_df: pd.DataFrame,
        product: str,
        region: str,
        horizon_days: int = 7
    ) -> ForecastResponse:
        """
        Generate recursive multi-day demand forecast.
        Rolls forward day by day, iteratively computing lags and rolling stats.
        """
        if self.model is None:
            raise ValueError("Model is not loaded or trained.")
            
        prod_norm = product.strip().title()
        reg_norm = region.strip().title()
        
        supported_prods = list(self.commodity_encoder.categories_[0])
        supported_regs = list(self.region_encoder.categories_[0])
        
        if prod_norm not in supported_prods:
            raise ValueError(f"Commodity '{product}' not supported. Available: {supported_prods}")
        if reg_norm not in supported_regs:
            raise ValueError(f"Region '{region}' not supported. Available: {supported_regs}")
            
        # Filter series for this product and region
        sub = historical_df[
            (historical_df["commodity"].str.title() == prod_norm) &
            (historical_df["region"].str.title() == reg_norm)
        ].sort_values("date").copy()
        
        if len(sub) < 14:
            raise ValueError(f"Insufficient historical data for {prod_norm} in {reg_norm} (minimum 14 days required).")
            
        # Recursive forward forecasting
        last_known = sub.iloc[-14:].copy()
        last_date = pd.to_datetime(last_known["date"].iloc[-1])
        
        daily_results: List[DailyForecast] = []
        recent_demands = list(last_known["demand_quantity_kg"].values)
        recent_prices = list(last_known["modal_price_per_kg"].values)
        
        for step in range(1, horizon_days + 1):
            next_date = last_date + timedelta(days=step)
            day_of_week = next_date.weekday()
            month = next_date.month
            
            # Season code
            if month in [11, 12, 1, 2, 3]:
                season_code = 1
            elif month in [4, 5, 6]:
                season_code = 2
            else:
                season_code = 3
                
            is_weekend = int(day_of_week in [5, 6])
            
            # Compute lags from recent demands buffer
            d_lag_1 = recent_demands[-1]
            d_lag_7 = recent_demands[-7] if len(recent_demands) >= 7 else recent_demands[0]
            d_lag_14 = recent_demands[-14] if len(recent_demands) >= 14 else recent_demands[0]
            
            roll_7 = float(np.mean(recent_demands[-7:]))
            roll_14 = float(np.mean(recent_demands[-14:]))
            roll_std_7 = float(np.std(recent_demands[-7:]))
            
            p_lag_1 = recent_prices[-1]
            p_roll_7 = float(np.mean(recent_prices[-7:]))
            
            row = pd.DataFrame([{
                "commodity": prod_norm,
                "region": reg_norm,
                "day_of_week_num": day_of_week,
                "day_of_month": next_date.day,
                "month": month,
                "season_code": season_code,
                "is_weekend": is_weekend,
                "price_lag_1": p_lag_1,
                "price_rolling_mean_7": p_roll_7,
                "demand_lag_1": d_lag_1,
                "demand_lag_7": d_lag_7,
                "demand_lag_14": d_lag_14,
                "demand_rolling_mean_7": roll_7,
                "demand_rolling_mean_14": roll_14,
                "demand_rolling_std_7": roll_std_7
            }])
            
            X, _ = self.prepare_xy(row, fit_encoders=False)
            pred_kg = float(self.model.predict(X)[0])
            pred_kg = max(50.0, round(pred_kg, 1))
            
            # Estimated bounds based on RMSE
            uncertainty = self.metrics.get("rmse_kg", pred_kg * 0.1)
            lower_bound = max(10.0, round(pred_kg - (1.2 * uncertainty), 1))
            upper_bound = round(pred_kg + (1.2 * uncertainty), 1)
            
            daily_results.append(DailyForecast(
                date=next_date.strftime("%Y-%m-%d"),
                predicted_demand_kg=pred_kg,
                lower_bound_kg=lower_bound,
                upper_bound_kg=upper_bound,
                day_of_week=next_date.strftime("%A")
            ))
            
            # Append predicted demand to rolling buffer for next day prediction
            recent_demands.append(pred_kg)
            recent_prices.append(p_lag_1)
            
        total_demand = round(sum(d.predicted_demand_kg for d in daily_results), 1)
        
        return ForecastResponse(
            product=prod_norm,
            region=reg_norm,
            horizon_days=horizon_days,
            daily_forecast=daily_results,
            total_predicted_demand_kg=total_demand,
            model_version=self.metadata.get("model_version", "v1.0-baseline"),
            metrics=self.metrics
        )

    def save(self, filepath: str) -> None:
        """Save model, encoders, and metadata."""
        p = Path(filepath)
        p.parent.mkdir(parents=True, exist_ok=True)
        bundle = {
            "model": self.model,
            "commodity_encoder": self.commodity_encoder,
            "region_encoder": self.region_encoder,
            "feature_columns": self.feature_columns,
            "metrics": self.metrics,
            "metadata": self.metadata
        }
        joblib.dump(bundle, p)
        
        # Save JSON metadata alongside
        meta_path = p.with_suffix(".json")
        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump(self.metadata, f, indent=2)
        logger.info(f"Model saved to {filepath} (metadata: {meta_path})")

    def load(self, filepath: str) -> None:
        """Load model, encoders, and metadata."""
        p = Path(filepath)
        if not p.exists():
            raise FileNotFoundError(f"Model file not found: {filepath}")
        bundle = joblib.load(p)
        self.model = bundle["model"]
        self.commodity_encoder = bundle["commodity_encoder"]
        self.region_encoder = bundle["region_encoder"]
        self.feature_columns = bundle["feature_columns"]
        self.metrics = bundle.get("metrics", {})
        self.metadata = bundle.get("metadata", {})
        logger.info(f"Model loaded from {filepath}")
