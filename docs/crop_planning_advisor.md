# KisanFlow • What Should We Grow? / Crop Planning Advisor Module

> **Pilot Geography:** Jharkhand, India (Ranchi, Jamshedpur, Dhanbad, Bokaro, Hazaribagh, Deoghar, Dumka)  
> **Classification:** Decision-Support System (DSS) — Economic Return & Risk Optimizer  
> **Status:** Production-Ready Modular Engine (Backend + Next.js UI)

---

## 1. Executive Summary & Vision

Traditional agricultural market interfaces only help farmers **sell what they have already harvested**—often forcing them into severe distress selling during regional gluts.

The **"What Should We Grow?" Crop Planning Advisor** answers the critical upstream question:
> *"What crop should I grow in the next season to maximize expected economic net return while controlling market, climatic, and production risk?"*

### The Complete KisanFlow End-to-End Pipeline
```text
Crop Planning & Risk Advisory (What to grow?)
               ↓
Demand Forecasting (XGBoost)
               ↓
Price Prediction & Mandi Timing (XGBoost)
               ↓
Farmer / Buyer Matching Engine
               ↓
Hub Selection & Aggregation
               ↓
Route & Fleet Optimization (OR-Tools CVRP)
               ↓
Consumer Distribution
```

---

## 2. Core Architectural Principles

1. **No Redundant Machine Learning Models**:
   - The advisor **does not** train an unnecessary separate price or demand model.
   - Instead, the decision/optimization layer consumes predictions directly from:
     - **Price Intelligence XGBoost** (`ai_service/app/pricing`): Multi-day regional price distributions and volatility spreads across Jharkhand mandis.
     - **Demand Forecasting XGBoost** (`ai_service/app/forecasting`): Regional consumer demand baselines.
   - **Machine Learning role:** *"What is likely to happen?"*
   - **Optimization/Decision role:** *"What should the farmer do?"*

2. **Net Realization Over Gross Nominal Price**:
   - High nominal selling prices (e.g. green chillies or tomatoes during spikes) frequently mislead farmers.
   - The engine evaluates net profit after deducting:
     - **Production & Seed Costs**
     - **Freight / Transport Logistics** (OR-Tools / Haversine road circuity)
     - **Holding & Cold Storage Costs**
     - **Spoilage / Wastage Losses** (shelf-life decay)

3. **Honest AI Decision-Support Framing**:
   - Strictly framed as **expected decision-support estimates**, not guaranteed profit.
   - All prototype agronomic yield and cost parameters are labeled as **calibrated prototype assumptions** and can be replaced with real ICAR/Birsa Agricultural University empirical datasets.

---

## 3. Mathematical & Economic Model

For every candidate crop $c$, given land area $A$ (acres), distance to market $d$ (km), and irrigation flag:

### 3.1. Yield & Revenue
$$\text{Effective Yield} = Y_{\text{base}} \times (1 - P_{\text{rainfed}})$$
$$\text{Total Harvest (kg)} = A \times \text{Effective Yield}$$
$$\text{Expected Gross Revenue} = \text{Total Harvest} \times P_{\text{predicted}}$$

### 3.2. Deductions & Costs
1. **Production Cost:**
   $$C_{\text{prod}} = A \times C_{\text{acre}}$$
2. **Transportation Freight:**
   $$d_{\text{road}} = d \times 1.28 \quad (\text{Circuity factor})$$
   $$C_{\text{trans}} = \text{Total Harvest} \times \left(\frac{d_{\text{road}} \times \text{Rate}_{\text{km}}}{\text{Truck Capacity}}\right)$$
3. **Holding / Storage Cost:**
   $$C_{\text{holding}} = \text{Total Harvest} \times \text{Days}_{\text{holding}} \times \text{Rate}_{\text{day}}$$
4. **Expected Wastage / Spoilage:**
   $$W_{\text{pct}} = \min(0.20, \text{Base Spoilage} + (\text{Holding Days} \times \text{Decay Rate}))$$
   $$C_{\text{wastage}} = \text{Gross Revenue} \times W_{\text{pct}}$$

### 3.3. Net Return & Benefit-Cost Ratio
$$\text{Expected Net Return} = \text{Gross Revenue} - (C_{\text{prod}} + C_{\text{trans}} + C_{\text{holding}} + C_{\text{wastage}})$$
$$\text{Net Return Per Acre} = \frac{\text{Expected Net Return}}{A}$$
$$\text{Benefit-Cost Ratio (BCR)} = \frac{\text{Gross Revenue}}{C_{\text{prod}} + C_{\text{trans}} + C_{\text{holding}} + C_{\text{wastage}}}$$

---

## 4. Multi-Criteria Scoring & Risk Adjustment

Crops receive a transparent composite score $S \in [0, 100]$:

| Criterion | Decision Weight | Normalized Metric |
| :--- | :---: | :--- |
| **Farmer Net Return** | **40%** | Expected net profit per acre normalized against regional benchmark |
| **Regional Demand Absorption** | **20%** | Harvest tonnage as a safe share of regional mandi demand |
| **Price Stability** | **15%** | Inverse of XGBoost historical error volatility spread $(P_{\text{upper}} - P_{\text{lower}})$ |
| **Wastage & Shelf-Life Safety** | **10%** | Perishability tier (75-day Potato > 5-day Tomato) |
| **Transport Efficiency** | **10%** | Freight cost relative to crop value density |
| **Agronomic Suitability** | **5%** | Season match (Rabi, Kharif, Zaid) and irrigation resilience |

### Supply-Demand Balance Penalization
- **Shortage (Demand / Supply > 1.10):** Penalty = 0 (Strong demand pull).
- **Balanced (0.90 to 1.10):** Standard baseline.
- **Glut / Surplus (Demand / Supply < 0.90):** -15.0 score penalty to prevent encouraging market saturation.

---

## 5. Candidate Crop Registry (Jharkhand Pilot)

| Crop | Category | Suitable Seasons | Yield (kg/ac) | Prod. Cost (₹/ac) | Shelf Life | Volatility |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| **Potato** | Tuber | Rabi | 9,000 | ₹38,000 | 75 days | Low |
| **Tomato** | Solanaceous | Rabi, Kharif, Zaid | 10,500 | ₹42,000 | 7 days | High |
| **Onion** | Bulb | Rabi, Kharif | 7,500 | ₹40,000 | 45 days | Medium |
| **Green Chilli** | Spice/Vegetable | Kharif, Zaid | 4,000 | ₹36,000 | 10 days | High |
| **Cauliflower** | Brassica | Rabi | 8,500 | ₹34,000 | 8 days | Medium-High |
| **Cabbage** | Brassica | Rabi | 10,000 | ₹32,000 | 14 days | Medium |
| **Brinjal** | Solanaceous | Rabi, Kharif, Zaid | 11,000 | ₹35,000 | 9 days | Medium |
| **Okra** | Fruit Vegetable | Kharif, Zaid | 4,500 | ₹28,000 | 5 days | High |

*Note: All crops are configurable in `ai_service/app/crop_planning/crop_data.py`.*

---

## 6. Land Diversification Portfolio

To prevent catastrophic single-crop failure, the advisor formulates an acreage portfolio:
- **Smallholder (< 1.5 acres):** Recommends 100% single-crop anchor to preserve scale economies.
- **Commercial Farm ($\ge$ 1.5 acres):**
  - **50% Primary Anchor:** Highest composite risk-adjusted score (e.g. Potato).
  - **30% High-Margin Complement:** Higher nominal upside (e.g. Onion or Tomato).
  - **20% Risk Hedge:** Low-perishability or low-cost insurance crop (e.g. Cabbage).

---

## 7. "What If?" Scenario Stress-Testing

Farmers can stress-test decisions across 7 climatic and economic scenarios:
1. **🌤️ Normal Season Baseline:** Standard forecast trends.
2. **📉 Price Crash:** 35% collapse in volatile vegetables (e.g. Tomato/Chilli).
3. **🌧️ Heavy Rainfall / Monsoon:** Spoilage and transit disruption shocks.
4. **☀️ Drought / Water Scarcity:** Yield penalties on high-water crops.
5. **📦 Market Supply Glut:** 25% price depression from neighbor district oversupply.
6. **📈 Regional Shortage:** 30% price premium on high-demand staples.
7. **⛽ Fuel Freight Shock:** Transport freight escalation from ₹20/km to ₹35/km.

---

## 8. API Reference

### `POST /crop-recommendation`
**Request:**
```json
{
  "region": "Ranchi",
  "land_area_acres": 5.0,
  "season": "Rabi",
  "irrigation": true,
  "distance_to_market_km": 25.0
}
```

**Response:**
```json
{
  "region": "Ranchi",
  "season": "Rabi",
  "land_area_acres": 5.0,
  "irrigation": true,
  "scenario": "NORMAL",
  "top_crop": {
    "crop": "Potato",
    "display_name": "Potato (Alu)",
    "predicted_price": 20.19,
    "expected_yield_kg_per_acre": 9000.0,
    "expected_revenue": 908550.0,
    "production_cost": 190000.0,
    "transport_cost": 2185.0,
    "expected_wastage_cost": 27256.5,
    "expected_net_return": 554691.5,
    "net_return_per_acre": 110938.3,
    "benefit_cost_ratio": 2.57,
    "risk_level": "LOW",
    "suitability": "HIGHLY SUITABLE",
    "score": 88.7
  },
  "recommendations": [ ... ],
  "diversification_plan": {
    "total_acres": 5.0,
    "is_diversified": true,
    "strategy": "Risk-Hedged Diversification Portfolio",
    "allocations": [
      { "crop": "Potato", "acres": 2.5, "fraction_pct": 50.0, "expected_net_return": 277345.75, "risk_level": "LOW" },
      { "crop": "Onion", "acres": 1.5, "fraction_pct": 30.0, "expected_net_return": 256324.5, "risk_level": "MEDIUM" },
      { "crop": "Cabbage", "acres": 1.0, "fraction_pct": 20.0, "expected_net_return": 113120.0, "risk_level": "MEDIUM" }
    ],
    "portfolio_net_return": 646790.25,
    "blended_net_return_per_acre": 129358.05
  },
  "explainability": {
    "why_top_crop": [ ... ],
    "why_not_alternatives": [ ... ]
  }
}
```

### `POST /crop-planning/scenarios`
Simulates crop evaluations across all 7 scenarios simultaneously.

### `GET /crop-planning/crops`
Lists all 8 candidate crops with agronomic metadata, yield baselines, and costs.

### `GET /crop-planning/scenarios`
Lists available scenario definitions and descriptions.

---

## 9. Verification & Automated Test Coverage

The module includes **15 dedicated automated tests** in `ai_service/tests/test_crop_planning.py` alongside the existing 56 tests in the KisanFlow suite (71 tests total, 100% pass rate):
- `test_crop_data_registry_completeness`
- `test_crop_economics_calculation`
- `test_crop_economics_rainfed_penalty`
- `test_crop_advisor_evaluation_ranking`
- `test_crop_advisor_recommend_pipeline`
- `test_diversification_portfolio_acreage_conservation`
- `test_diversification_smallholder_single_crop`
- `test_explainability_generation`
- `test_scenario_analysis`
- `test_api_get_crops`
- `test_api_get_scenarios`
- `test_api_crop_recommendation_success`
- `test_api_crop_recommendation_invalid_region`
- `test_api_crop_recommendation_invalid_season`
- `test_api_crop_scenarios_post`
