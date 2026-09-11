"""
Agricultural Demand Dataset Generator (Synthetic Baseline for Prototype).

Generates realistic, deterministic historical mandi demand time series
for agricultural staples (Tomato, Potato, Onion) across Bihar regional hubs (Patna, Hajipur, etc.).

Note: All records are explicitly labeled with `is_synthetic=True`.
"""

import math
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Optional

def generate_agricultural_demand_data(
    start_date: str = "2024-01-01",
    end_date: str = "2026-09-01",
    random_seed: int = 42
) -> pd.DataFrame:
    """
    Generate synthetic, realistic agricultural demand data.
    
    Includes:
    - Base demand per commodity and region
    - Annual seasonality (Kharif, Rabi, Zaid seasons)
    - Weekly patterns (higher weekend demand)
    - Festival spikes (Diwali, Chhath Puja, Holi, Eid)
    - Price fluctuations with realistic inverse elasticity
    - Explicit `is_synthetic` column
    """
    np.random.seed(random_seed)
    
    start = datetime.strptime(start_date, "%Y-%m-%d")
    end = datetime.strptime(end_date, "%Y-%m-%d")
    total_days = (end - start).days + 1
    date_list = [start + timedelta(days=i) for i in range(total_days)]
    
    commodities = {
        "Tomato": {"base_demand": 3500.0, "base_price": 32.0, "price_volatility": 12.0, "perishability_days": 5},
        "Potato": {"base_demand": 8000.0, "base_price": 22.0, "price_volatility": 4.0, "perishability_days": 45},
        "Onion": {"base_demand": 5500.0, "base_price": 28.0, "price_volatility": 8.0, "perishability_days": 30}
    }
    
    regions = {
        "Patna": {"demand_multiplier": 1.4, "price_multiplier": 1.05},
        "Hajipur": {"demand_multiplier": 0.85, "price_multiplier": 0.95},
        "Muzaffarpur": {"demand_multiplier": 1.1, "price_multiplier": 0.98},
        "Gaya": {"demand_multiplier": 0.9, "price_multiplier": 1.0},
        "Varanasi": {"demand_multiplier": 1.3, "price_multiplier": 1.02}
    }
    
    rows = []
    
    for comm_name, comm_cfg in commodities.items():
        for reg_name, reg_cfg in regions.items():
            base_d = comm_cfg["base_demand"] * reg_cfg["demand_multiplier"]
            base_p = comm_cfg["base_price"] * reg_cfg["price_multiplier"]
            
            for current_date in date_list:
                day_of_year = current_date.timetuple().tm_yday
                day_of_week = current_date.weekday() # 0 = Monday, 6 = Sunday
                month = current_date.month
                
                # 1. Annual seasonality (Trigonometric cycle simulating winter harvest vs summer scarcity)
                # For Tomato: Peak scarcity in July-August (higher price, slightly subdued volume)
                seasonal_cycle = math.sin(2 * math.pi * (day_of_year - 60) / 365.25)
                
                # 2. Season categorization
                if month in [11, 12, 1, 2, 3]:
                    season = "Rabi"
                elif month in [4, 5, 6]:
                    season = "Zaid"
                else:
                    season = "Kharif"
                
                # 3. Weekly cycle (Weekend surge of 15% - 25% due to retail/restaurant stock-up)
                weekly_factor = 1.0
                if day_of_week in [4, 5]: # Friday, Saturday
                    weekly_factor = 1.20
                elif day_of_week == 6: # Sunday
                    weekly_factor = 1.15
                elif day_of_week == 0: # Monday
                    weekly_factor = 0.90
                
                # 4. Festival spikes in Bihar (October/November Chhath & Diwali, March Holi)
                festival_factor = 1.0
                festival_flag = 0
                if (month == 10 and current_date.day >= 20) or (month == 11 and current_date.day <= 15):
                    # Chhath Puja / Diwali surge
                    festival_factor = 1.45
                    festival_flag = 1
                elif month == 3 and 15 <= current_date.day <= 25:
                    # Holi surge
                    festival_factor = 1.30
                    festival_flag = 1
                
                # 5. Price generation
                price_noise = np.random.normal(0, comm_cfg["price_volatility"] * 0.3)
                price = base_p - (seasonal_cycle * comm_cfg["price_volatility"] * 0.7) + price_noise
                price = max(8.0, round(float(price), 2))
                
                # 6. Demand elasticity (Price elasticity ~ -0.3 for vegetables)
                price_deviation_ratio = (price - base_p) / base_p
                elasticity_factor = 1.0 - (0.25 * price_deviation_ratio)
                
                # 7. Random noise (weather disruption, localized events)
                random_noise = np.random.normal(1.0, 0.05)
                
                demand_kg = base_d * (1 + 0.18 * seasonal_cycle) * weekly_factor * festival_factor * elasticity_factor * random_noise
                demand_kg = max(200.0, round(float(demand_kg), 1))
                
                rows.append({
                    "date": current_date.strftime("%Y-%m-%d"),
                    "commodity": comm_name,
                    "region": reg_name,
                    "demand_quantity_kg": demand_kg,
                    "modal_price_per_kg": price,
                    "day_of_week": current_date.strftime("%A"),
                    "day_of_month": current_date.day,
                    "month": month,
                    "year": current_date.year,
                    "season": season,
                    "is_weekend": int(day_of_week in [5, 6]),
                    "festival_flag": festival_flag,
                    "is_synthetic": True,
                    "data_source": "KisanFlow Realistic Ag-Demand Simulator v1"
                })
                
    df = pd.DataFrame(rows)
    return df
