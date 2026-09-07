# KisanFlow AI & Optimization API Reference

Base URL: `http://localhost:8000`

Interactive OpenAPI Documentation: `http://localhost:8000/docs`

---

## Endpoints

### 1. Health Check
- **Path**: `GET /health`
- **Description**: Verifies service status, version, and server timestamp.
- **Response 200**:
  ```json
  {
    "status": "healthy",
    "service": "KisanFlow AI & Optimization Service",
    "version": "1.0.0",
    "timestamp": "2026-09-06T14:35:00.000Z"
  }
  ```

---

### 2. Demand Forecasting
- **Path**: `POST /forecast`
- **Description**: Generates numerical day-by-day demand forecasts for 7 or 14-day horizons using the trained XGBoost baseline.
- **Request Body**:
  ```json
  {
    "product": "Tomato",
    "region": "Patna",
    "horizon_days": 7
  }
  ```
- **Response 200**: Returns `daily_forecast` array, `total_predicted_demand_kg`, and model evaluation metrics (`mae_kg`, `rmse_kg`, `mape_percent`).

---

### 3. Model Metadata
- **Path**: `GET /model-info`
- **Description**: Retrieves current model version, training metrics, features list, and supported commodities/regions.
- **Response 200**: Returns model details and validation error metrics.

---

### 4. Supplier Matching & Allocation
- **Path**: `POST /match-suppliers`
- **Description**: Evaluates available farmer/FPO suppliers against buyer requirements using deterministic multi-criteria scoring.
- **Request Body**:
  ```json
  {
    "requirement": {
      "product": "Tomato",
      "required_quantity_kg": 10000.0,
      "region": "Patna",
      "buyer_location": {"latitude": 25.5941, "longitude": 85.1376},
      "minimum_quality": "B"
    },
    "custom_suppliers": null,
    "weights": null
  }
  ```
- **Response 200**: Returns list of selected suppliers with allocations, coordinates, distances, scores, and reason explanations.

---

### 5. Capacitated Route Optimization
- **Path**: `POST /optimize-route`
- **Description**: Solves CVRP using Google OR-Tools to plan multi-stop vehicle collection trips and compares against unoptimized baseline.
- **Request Body**:
  ```json
  {
    "depot_coordinates": {"latitude": 25.5941, "longitude": 85.1376},
    "depot_name": "Patna Central Delivery Hub",
    "pickups": [
      {
        "supplier_id": "FPO-PAT-01",
        "name": "Kisan Kalyan FPO Phulwari",
        "latitude": 25.5786,
        "longitude": 85.0743,
        "quantity_kg": 3500.0
      }
    ],
    "vehicle_capacity_kg": 5000.0,
    "fleet_size": 3
  }
  ```
- **Response 200**: Returns vehicle routes, stop sequences, cumulative loads, total distance, cost, and `baseline_comparison` with distance and cost savings.

---

### 6. Market Price Intelligence (Prototype)
- **Path**: `POST /price-estimate`
- **Description**: Generates estimated spot market price via Gemini AI (if `GEMINI_API_KEY` is configured) or calibrated simulation with volatility alerts.
- **Request Body**:
  ```json
  {
    "commodity": "Tomato",
    "region": "Patna",
    "historical_baseline_price": 32.0
  }
  ```
- **Response 200**: Returns `PriceObservation`, deviation percentage, and volatility alerts.

---

### 7. Integrated End-to-End Pipeline
- **Path**: `POST /pipeline/run`
- **Description**: Executes the entire lifecycle: Forecast -> Market Signal -> Supplier Matching -> OR-Tools Route Optimization.
- **Request Body**:
  ```json
  {
    "buyer_requirement": {
      "product": "Tomato",
      "required_quantity_kg": 10000.0,
      "region": "Patna",
      "buyer_location": {"latitude": 25.5941, "longitude": 85.1376},
      "minimum_quality": "B"
    },
    "forecast_horizon_days": 7,
    "vehicle_capacity_kg": 5000.0,
    "fleet_size": 3
  }
  ```
- **Response 200**: Returns composite results of all 4 pipeline stages with an executive summary.
