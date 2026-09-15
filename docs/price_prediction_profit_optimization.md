# Price Prediction & Farmer Profit Optimization Module (Jharkhand Pilot)

A production-grade, modular machine-learning and economic decision-support service for regional agricultural price forecasting and farmer net-realization optimization across agricultural mandis in Jharkhand, India.

---

## 1. System Overview & Objective

Agricultural price forecasting alone is insufficient for improving farmer livelihoods. Knowing tomorrow's wholesale price in a distant market does not guarantee profitability if freight costs, in-transit spoilage, or storage holding costs exceed the price spread. 

**Core Mission**:
> *"Predict future regional agricultural prices and utilize those forecasts within a rigorous economic decision layer to recommend the highest Expected Net Realization for farmers while maintaining consumer affordability and preventing local market oversupply."*

```
Regional Agricultural Data (Jharkhand Mandis)
                     ↓
Feature Engineering (Strictly Leakage-Free Lags & Rolling Stats)
                     ↓
XGBoost Price Forecasting vs Naive & Moving Average Baselines
                     ↓
Future Regional Prices (1, 3, 7 Days) with Empirical Error Bounds
                     ↓
Economic Decision Layer (Transport + Holding + Handling + Wastage Deductions)
                     ↓
Farmer Selling Recommendation (Sell Now vs Wait Decision Rule)
                     ↓
Multi-Market Comparison & Volume Allocation (Consumer Protection)
                     ↓
OR-Tools Route Optimization Bridge (Haversine × 1.28 Circuity)
```

---

## 2. Pilot Geography: Jharkhand Agricultural Mandis

The pilot deployment focuses on the state of **Jharkhand, India**. The architecture uses an extensible market registry allowing dynamic addition of new mandis without code changes:

| Mandi / District | Latitude | Longitude | Market Classification | Daily Capacity (Tonnes) |
| :--- | :---: | :---: | :--- | :---: |
| **Ranchi** | 23.3441 | 85.3096 | Central Terminal Mandi (Pandra) | 150.0 |
| **Jamshedpur** | 22.8046 | 86.2029 | Industrial Consumption Hub (Sakchi) | 120.0 |
| **Dhanbad** | 23.7957 | 86.4304 | Urban Mining Consumption Hub (Barwadda) | 100.0 |
| **Bokaro** | 23.6693 | 86.1511 | Urban Wholesale Market (Chas) | 80.0 |
| **Hazaribagh** | 23.9925 | 85.3637 | Agricultural Production Center | 70.0 |
| **Deoghar** | 24.4826 | 86.7001 | Regional Hub / Pilgrimage Demand (Mohanpur) | 60.0 |
| **Dumka** | 24.2676 | 87.2504 | Santhal Pargana District Mandi | 50.0 |

---

## 3. Supported Commodities & Economic Baseline Parameters

The system ships with calibrated baseline parameters for essential high-volume crops:

| Commodity | Base Spot Price (₹/kg) | Perishability Tier | Daily Spoilage Rate | Consumer Price Ceiling (₹/kg) |
| :--- | :---: | :---: | :---: | :---: |
| **Tomato** | ₹24.00 | High | 2.5% / day | ₹45.00 |
| **Potato** | ₹19.50 | Low | 0.5% / day | ₹35.00 |
| **Onion** | ₹27.00 | Medium | 1.2% / day | ₹50.00 |
| **Green Chilli** | ₹48.00 | High | 3.0% / day | ₹85.00 |

---

## 4. Dataset Design & Synthetic Development Dataset

To enable offline reproduction and rigorous benchmark validation prior to connecting live Agmarknet/e-NAM feeds, the repository includes a clearly labeled synthetic development dataset:
- **Raw File**: `ai_service/data/raw/jharkhand_price_synthetic.csv` (22,120 records spanning 2024-01-01 to 2026-02-28).
- **Target Variable**: `modal_price` (wholesale auction modal price in ₹/kg), accompanied by `minimum_price` and `maximum_price`.
- **Notice**: Stamped with explicit developer warnings that this is synthetic prototype data.

---

## 5. Leakage-Free Feature Engineering

In time-series forecasting, calculating features using contemporaneous or future observations creates devastating data leakage. KisanFlow enforces **zero target leakage**:

1. **Shifted Price Lags**: $P_{t-1}, P_{t-2}, P_{t-3}, P_{t-7}, P_{t-14}, P_{t-21}, P_{t-30}$.
2. **Rolling Statistics**: Rolling means (3, 7, 14, 30 days) and rolling standard deviations (7, 14, 30 days) computed strictly on $P_{\le t-1}$.
3. **Price Momentum**: 
   $$\Delta P_{1d} = P_{t-1} - P_{t-2}, \quad \Delta P_{7d} = P_{t-1} - P_{t-7}, \quad \Delta P_{14d} = P_{t-1} - P_{t-14}$$
4. **Calendar & Agronomic Seasonality**:
   - `day_of_week` (0-6), `day_of_month`, `month`, `week_of_year`, `is_weekend`.
   - Indian crop cycles: `Kharif` (June-Oct), `Rabi` (Nov-March), `Zaid` (April-May).
   - Regional festival surge indicator (Chhath Puja, Durga Puja, Diwali in Jharkhand).
5. **Spatial Cross-Market Signals**:
   - Lagged state-wide average modal price across neighboring Jharkhand mandis.
   - Distance to the capital terminal market (Ranchi) in kilometers.

---

## 6. Baseline Models & XGBoost Out-of-Sample Evaluation

Before deploying XGBoost, every commodity model is benchmarked against two simple reference baselines on the strictly chronological out-of-sample test split (latest 15% timeline window):

- **Naive Baseline**: Tomorrow's price = Yesterday's price ($\hat{P}_t = P_{t-1}$).
- **7-Day Moving Average Baseline**: Tomorrow's price = Average of the preceding 7 days ($\hat{P}_t = \frac{1}{7} \sum_{i=1}^7 P_{t-i}$).
- **Primary Model**: XGBoost Regressor (`n_estimators=300`, `max_depth=5`, `learning_rate=0.05`, `subsample=0.85`, `colsample_bytree=0.85`).

### Out-of-Sample Test Benchmark Results

| Commodity | XGBoost MAE | Naive MAE | 7-Day MA MAE | MAE Improvement over Naive | Empirical Error Range (10th–90th) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Tomato** | **₹2.70/kg** | ₹3.54/kg | ₹2.81/kg | **+23.7%** | [-3.74, +3.82] ₹/kg |
| **Potato** | **₹1.37/kg** | ₹1.82/kg | ₹1.44/kg | **+24.7%** | [-1.88, +1.91] ₹/kg |
| **Onion** | **₹2.06/kg** | ₹2.75/kg | ₹2.14/kg | **+24.9%** | [-3.33, +3.17] ₹/kg |
| **Green Chilli** | **₹5.35/kg** | ₹7.10/kg | ₹5.57/kg | **+24.6%** | [-7.80, +7.90] ₹/kg |

*Note: MAPE is explicitly reported as error dispersion, never falsely labeled as "accuracy".*

---

## 7. Farmer Profit Optimization (Mathematical Formulation)

Farmers do not take home the gross auction price. The decision engine evaluates **Expected Net Realization**:

$$\text{Expected Net Realization (₹/kg)} = P_{\text{expected}} - C_{\text{transport}} - C_{\text{holding}} - C_{\text{handling}} - C_{\text{wastage}}$$

Where:
- **Transportation Freight ($C_{\text{transport}}$)**:
  $$C_{\text{transport}} = \frac{\text{Road Distance (km)} \times \text{Road Circuity Factor (1.28)} \times \text{Vehicle Rate (₹20/km)}}{\min(\text{Batch Volume (kg)}, \text{Vehicle Capacity (5000 kg)})}$$
- **Holding / Storage Cost ($C_{\text{holding}}$)**:
  $$C_{\text{holding}} = \text{Daily Holding Rate (₹0.15/kg/day)} \times \text{Days Held}$$
- **Handling & Mandi Cess ($C_{\text{handling}}$)**:
  $$C_{\text{handling}} = \text{Loading / Unloading / Auction Mandi Entry Fee (₹0.30/kg)}$$
- **Perishable Wastage / Decay Loss ($C_{\text{wastage}}$)**:
  $$C_{\text{wastage}} = P_{\text{expected}} \times \text{Daily Degradation Rate} \times \text{Days Held}$$

---

## 8. Sell Now vs Wait Decision Logic

For each forward forecast day $h \in \{1, 3, 7\}$:
$$\text{Expected Net Gain} = \text{Net Realization}(t+h) - \text{Net Realization}(t=0)$$

- If $\text{Expected Net Gain} \ge \text{₹0.50/kg}$: Recommends `WAIT_h_DAYS` with the projected financial benefit.
- If $\text{Expected Net Gain} < \text{₹0.50/kg}$: Recommends `SELL_NOW` to avoid perishable deterioration and storage cost bleed.

---

## 9. Balanced Market Allocation & Consumer Protection

To avoid dumping an entire harvest into a single market (which depresses prices and creates local gluts), the allocation engine enforces:
- **Single-Market Absorption Cap**: Max 50% allocation to any single mandi for batch sizes $> 1,500\text{ kg}$.
- **Consumer Price Ceiling Alert**: Flags mandis where predicted wholesale prices exceed affordability thresholds (e.g. > ₹45/kg for Tomato).

---

## 10. REST API Endpoints

The AI service exposes these endpoints on port `8000`:

1. `POST /price-predict`:
   - **Input**: `{"commodity": "Tomato", "region": "Ranchi", "forecast_days": 7}`
   - **Output**: Current price, daily forecasts with empirical bounds, explainability factors, timing recommendation.
2. `POST /farmer-profit-recommendation`:
   - **Input**: `{"commodity": "Tomato", "quantity_kg": 2500, "farmer_location": "Hazaribagh"}`
   - **Output**: Ranked comparison of all 7 Jharkhand mandis by Net Realization (₹/kg) and Total Net Profit (₹).
3. `POST /market-allocation`:
   - **Input**: `{"commodity": "Tomato", "quantity_kg": 5000, "farmer_location": "Ranchi", "max_single_market_share": 0.5}`
   - **Output**: Quantity distribution preventing single-mandi saturation.
4. `GET /price-markets`: List of supported Jharkhand mandis and coordinates.
5. `GET /price-commodities`: Supported vegetables and economic parameters.
6. `GET /price-model-metrics`: Benchmark leaderboard against Naive and 7-day MA baselines.

---

## 11. Quickstart & Verification Commands

```powershell
# 1. Activate Python 3.11 environment
cd "c:\Users\SAM BIJU\KisanFlow\KisanFlow"
.\.venv\Scripts\Activate.ps1

# 2. Run Data Generation & Preprocessing
python -m ai_service.scripts.prepare_jharkhand_price_data

# 3. Train Models and Generate Benchmark Leaderboard
python -m ai_service.scripts.train_price_models

# 4. Execute Complete End-to-End Demonstration Scenario
python -m ai_service.scripts.run_price_profit_demo

# 5. Run Automated Test Suite (56 tests across the entire AI service)
pytest ai_service/tests/

# 6. Start the FastAPI AI Service
uvicorn ai_service.app.main:app --port 8000 --reload
```
