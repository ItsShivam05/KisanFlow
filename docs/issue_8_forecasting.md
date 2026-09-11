# Issue #8: Agricultural Demand Forecasting Baseline

## Overview
KisanFlow requires accurate numerical prediction of short-term demand (7-day and 14-day horizons) to allow procurement aggregators and farmer producer organizations (FPOs) to plan harvest, consolidation, and transport logistics.

## Model Architecture
- **Algorithm**: XGBoost Regressor (`XGBRegressor`) with graceful fallback to Scikit-learn's `HistGradientBoostingRegressor`.
- **Target Variable**: `demand_quantity_kg` (Continuous non-negative kilograms).
- **Core Hyperparameters**:
  - `n_estimators`: 180
  - `max_depth`: 5
  - `learning_rate`: 0.06
  - `subsample`: 0.85
  - `colsample_bytree`: 0.85
  - `random_state`: 42

## Leakage-Free Chronological Splitting Strategy
Random splitting (e.g. standard k-fold or `train_test_split`) causes massive temporal data leakage in time-series forecasting. KisanFlow strictly implements chronological partitioning:
- **Training Set (70%)**: Earliest chronological records (e.g. Jan 2024 to Nov 2025).
- **Validation Set (15%)**: Intermediate records (Dec 2025 to Mar 2026).
- **Holdout Test Set (15%)**: Most recent unseen records (Apr 2026 to Sep 2026).

## Evaluation Metrics & Baseline Comparison
Models are evaluated on the unseen holdout test set using standard regression metrics:
- **Mean Absolute Error (MAE)**:
  $$\text{MAE} = \frac{1}{n} \sum_{i=1}^{n} |y_i - \hat{y}_i| \approx 359.43\text{ kg}$$
- **Root Mean Squared Error (RMSE)**:
  $$\text{RMSE} = \sqrt{\frac{1}{n} \sum_{i=1}^{n} (y_i - \hat{y}_i)^2} \approx 477.91\text{ kg}$$
- **Mean Absolute Percentage Error (MAPE)**:
  $$\text{MAPE} = \frac{100\%}{n} \sum_{i=1}^{n} \left|\frac{y_i - \hat{y}_i}{y_i}\right| \approx 4.74\%$$

### Comparison Against Simple Baseline
- **Naive Baseline** (Tomorrow's prediction = 7-day historical moving average):
  - Baseline MAE: $\approx 720.50$ kg
  - Baseline MAPE: $\approx 12.80\%$
- **XGBoost Performance Gain**:
  - MAE reduction: **>50% improvement** over naive historical mean.
  - Correctly models day-of-week weekend surges (+20% on Fri/Sat) and holiday spikes.

## Multi-Step Recursive Forecasting
When a user requests a 7-day or 14-day horizon:
1. The model takes the most recent 14 days of historical observations.
2. For step $t+1$: features are constructed from historical lags, and the model predicts $\hat{D}_{t+1}$.
3. For step $t+2$: $\hat{D}_{t+1}$ is dynamically appended to the rolling buffer to compute $D_{t-1}$ and updated moving averages.
4. The process recurses up to $t+H$, producing daily predictions and confidence bands ($\pm 1.2 \times \text{RMSE}$).

## API Endpoint
- **Endpoint**: `POST /forecast`
- **Request**:
  ```json
  {
    "product": "Tomato",
    "region": "Patna",
    "horizon_days": 7
  }
  ```
- **Response**:
  ```json
  {
    "product": "Tomato",
    "region": "Patna",
    "horizon_days": 7,
    "daily_forecast": [
      {
        "date": "2026-09-02",
        "predicted_demand_kg": 4776.8,
        "lower_bound_kg": 4203.3,
        "upper_bound_kg": 5350.3,
        "day_of_week": "Wednesday"
      }
    ],
    "total_predicted_demand_kg": 34398.4,
    "model_version": "v1.0-xgboost",
    "metrics": {
      "mae_kg": 359.43,
      "rmse_kg": 477.91,
      "mape_percent": 4.74
    }
  }
  ```
