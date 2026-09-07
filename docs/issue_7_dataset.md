# Issue #7: Agricultural Demand Dataset Preparation Pipeline

## Overview
This document details the data engineering pipeline for KisanFlow's agricultural demand forecasting engine. The pipeline processes historical mandi consumption and wholesale transaction data for essential commodities.

## Dataset Specifications

### Source & Provenance
- **Source Type**: Simulated Agricultural Mandi Time-Series (Calibrated against Agmarknet / Bihar State Agricultural Marketing Board patterns).
- **Data Labeling**: Explicitly marked with `is_synthetic = True` to adhere to academic and hackathon ethics.
- **Geographic Coverage**: Key trade clusters in Bihar and adjacent regions:
  - Patna (Primary Consumption Hub)
  - Hajipur (Horticulture Cluster)
  - Muzaffarpur (Agricultural Trading Center)
  - Gaya (Regional Distribution Center)
  - Varanasi (Inter-state Corridor)
- **Commodity Coverage**:
  - Tomato (High-perishability staple, volatile seasonal price cycles)
  - Potato (Semi-perishable staple, storage-driven demand)
  - Onion (High-demand staple, storage and festive sensitivity)
- **Time Horizon**: 2024-01-01 to 2026-09-01 (Daily observations, >14,000 records).

### Schema Definition
| Column | Type | Description |
|---|---|---|
| `date` | `string (YYYY-MM-DD)` | Daily observation timestamp |
| `commodity` | `string` | Commodity name (Title-cased) |
| `region` | `string` | Regional wholesale consumption hub |
| `demand_quantity_kg` | `float` | Daily wholesale demand in kilograms |
| `modal_price_per_kg` | `float` | Daily modal wholesale price in INR/kg |
| `day_of_week` | `string` | Day name (Monday - Sunday) |
| `day_of_month` | `int` | Day of month (1 - 31) |
| `month` | `int` | Month number (1 - 12) |
| `season` | `string` | Agricultural season (`Kharif`, `Rabi`, `Zaid`) |
| `season_code` | `int` | Numeric season indicator (`1=Rabi`, `2=Zaid`, `3=Kharif`) |
| `is_weekend` | `int` | `1` if Saturday/Sunday, `0` otherwise |
| `festival_flag` | `int` | `1` during major regional festivals (Chhath, Diwali, Holi) |
| `demand_lag_1` | `float` | Demand from 1 day prior ($D_{t-1}$) |
| `demand_lag_7` | `float` | Demand from 7 days prior ($D_{t-7}$) |
| `demand_lag_14` | `float` | Demand from 14 days prior ($D_{t-14}$) |
| `demand_rolling_mean_7` | `float` | 7-day rolling average demand (shifted by 1 day) |
| `demand_rolling_mean_14` | `float` | 14-day rolling average demand (shifted by 1 day) |
| `demand_rolling_std_7` | `float` | 7-day rolling standard deviation (shifted by 1 day) |
| `price_lag_1` | `float` | Modal price from 1 day prior ($P_{t-1}$) |
| `price_rolling_mean_7` | `float` | 7-day rolling average price (shifted by 1 day) |
| `is_synthetic` | `bool` | Explicit indicator (`True`) |

## Data Preparation Pipeline

### 1. Ingestion & Validation
The pipeline validates:
- Presence of all mandatory columns.
- Correct type coercion for numeric and datetime fields.
- Non-empty records.

### 2. Normalization & Cleaning
- Product and region names are whitespace-trimmed and normalized to Title Case.
- Rows with missing core values are dropped with logged warnings.
- Duplicate entries for identical `(date, commodity, region)` tuples are removed.

### 3. Outlier Capping (IQR Method)
Extreme anomalous values are capped per `(commodity, region)` slice using:
$$\text{IQR} = Q_{75} - Q_{25}$$
$$\text{Lower Bound} = \max(0, Q_{25} - 1.5 \times \text{IQR})$$
$$\text{Upper Bound} = Q_{75} + 1.5 \times \text{IQR}$$

### 4. Leakage-Free Feature Engineering
To prevent future data leakage into historical rows:
- Lags ($t-1, t-7, t-14$) strictly use prior historical dates.
- Rolling statistics (`rolling_mean_7`, `rolling_mean_14`, `rolling_std_7`) are computed over `.shift(1)` to ensure the current day's target demand is never included in the moving window calculation.
- Backfilling and forward filling are strictly partitioned within each `(commodity, region)` time-series slice.

## Reproduction
To regenerate raw data and run the preprocessing pipeline:
```bash
python -m ai_service.scripts.prepare_dataset
```
Processed output is written to:
- Raw: `ai_service/data/raw/demand_raw.csv`
- Processed: `ai_service/data/processed/demand_processed.csv`
