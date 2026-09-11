# KisanFlow: AI & Optimization Service

KisanFlow is an AI-powered agricultural supply-chain optimization platform designed for smart agricultural procurement, transparent farmer-buyer matching, and efficient route consolidation.

---

## Assigned Core Issues Completed

- **Issue #7 — Find and prepare demand dataset**:
  - Reproducible agricultural time-series demand dataset for essential crops (Tomato, Potato, Onion) across key Bihar hubs (Patna, Hajipur, Muzaffarpur, Gaya, Varanasi).
  - Preprocessing pipeline with schema validation, IQR outlier capping, chronological ordering, and leakage-free feature engineering (lags, moving averages, rolling volatility).
  - Explicitly labeled synthetic prototype data with full reproduction scripts.
- **Issue #8 — Build demand forecasting baseline**:
  - XGBoost regressor trained with strict chronological train/val/test splitting (no future data leakage).
  - Metrics: **MAE = 359.43 kg**, **RMSE = 477.91 kg**, **MAPE = 4.74%** (>50% improvement over naive moving average baseline).
  - Recursive multi-step forward forecasting supporting 7-day and 14-day horizons with confidence intervals.
  - REST endpoint: `POST /forecast`.
- **Market Price Intelligence Prototype**:
  - Isolated current spot price estimation service with Gemini API integration and calibrated fallback.
  - Automatically flags price volatility deviations (>15%) against historical baseline.
  - REST endpoint: `POST /price-estimate`.
- **Issue #9 — Build supplier matching prototype**:
  - Transparent, deterministic multi-criteria scoring function (Price 25%, Distance 20%, Quantity 20%, Quality 15%, Reliability 10%, Freshness 10%).
  - Iterative greedy allocation enforcing inventory conservation ($\sum \text{allocated} \le \text{required}$ and $\text{allocated}_i \le \text{available}_i$).
  - Full and partial fulfillment handling with human-readable decision reason codes.
  - REST endpoint: `POST /match-suppliers`.
- **Issue #10 — Build OR-Tools route optimization prototype**:
  - Real Google OR-Tools Capacitated Vehicle Routing Problem (CVRP) solver.
  - Enforces vehicle fleet payload limits (e.g. 5,000 kg per truck) and produces exact multi-stop route sequences.
  - Real geographic distance matrix using Haversine with road circuity scaling ($\gamma = 1.28$).
  - Evaluates against traditional unoptimized direct-trip baseline: **24.7% distance reduction** and **32.56% logistics cost reduction**.
  - REST endpoint: `POST /optimize-route`.
- **Integrated Pipeline (#7 -> #8 -> #9 -> #10)**:
  - Unified pipeline executing Forecast -> Price Signal -> Supplier Matching -> CVRP Routing.
  - REST endpoint: `POST /pipeline/run`.

---

## Quickstart & Local Setup

### 1. Prerequisites
- Python 3.11+
- Windows / Linux / macOS

### 2. Environment Setup
```bash
# Clone or navigate to the repository
cd sih2026

# Create and activate virtual environment
python -m venv .venv
# On Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# On Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
copy .env.example .env
```

### 3. Generate Data & Train Model
```bash
# Step 1: Generate and preprocess agricultural dataset (Issue #7)
python -m ai_service.scripts.prepare_dataset

# Step 2: Train and evaluate demand forecasting baseline (Issue #8)
python -m ai_service.scripts.train_forecasting
```

### 4. Run the SIH End-to-End Demo
```bash
# Executes the reproducible 10,000 kg Tomato in Patna procurement scenario
python -m ai_service.scripts.run_e2e_demo
```

### 5. Launch the FastAPI Server
```bash
uvicorn ai_service.app.main:app --host 0.0.0.0 --port 8000 --reload
```
- API Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health Check: [http://localhost:8000/health](http://localhost:8000/health)

### 6. Run Test Suite
```bash
pytest
```

---

## Detailed Documentation
- [Architecture & Flowchart](docs/architecture.md)
- [Issue #7: Demand Dataset Pipeline](docs/issue_7_dataset.md)
- [Issue #8: Demand Forecasting Baseline](docs/issue_8_forecasting.md)
- [Issue #9: Supplier Matching Engine](docs/issue_9_matching.md)
- [Issue #10: Google OR-Tools Route Optimization](docs/issue_10_routing.md)
- [API Reference Guide](docs/api_reference.md)
