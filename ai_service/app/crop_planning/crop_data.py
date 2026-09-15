"""
Agronomic and Crop Economics Data Registry for Jharkhand Pilot.

Contains:
- Supported crop profiles (yield, cultivation cost, seasonal suitability, perishability, water requirements).
- Clearly labeled synthetic / prototype assumptions for pilot testing.
"""

from typing import Dict, List, Any

CROP_DATA_DISCLAIMER = (
    "SYNTHETIC / PROTOTYPE AGRONOMIC ASSUMPTIONS FOR JHARKHAND PILOT: "
    "Crop yields, cultivation budgets, and perishability factors are calibrated "
    "prototype estimates reflecting typical smallholder vegetable farming in Jharkhand. "
    "This is a decision-support guide and can be updated with local KVK / ICAR / State Agronomic records."
)

SUPPORTED_CROPS: Dict[str, Dict[str, Any]] = {
    "Potato": {
        "display_name": "Potato (आलू)",
        "category": "Tuber / Root Crop",
        "suitable_seasons": ["Rabi"],
        "expected_yield_kg_per_acre": 9000.0,
        "production_cost_per_acre": 38000.0,
        "perishability_tier": "Low",
        "shelf_life_days": 75,
        "daily_spoilage_rate": 0.005,  # 0.5% per day
        "water_requirement": "Medium",
        "weather_sensitivity": "Low",
        "price_volatility_tier": "Low",
        "base_price_fallback": 22.0,
        "holding_days_typical": 14,
        "min_land_fraction": 0.30,
        "max_land_fraction": 0.60,
        "description": "Staple tuber with low perishability, steady regional demand, and reliable price downside protection.",
    },
    "Tomato": {
        "display_name": "Tomato (टमाटर)",
        "category": "Solanaceous Fruit",
        "suitable_seasons": ["Rabi", "Kharif"],
        "expected_yield_kg_per_acre": 10500.0,
        "production_cost_per_acre": 45000.0,
        "perishability_tier": "High",
        "shelf_life_days": 6,
        "daily_spoilage_rate": 0.025,  # 2.5% per day
        "water_requirement": "Medium-High",
        "weather_sensitivity": "High",
        "price_volatility_tier": "High",
        "base_price_fallback": 25.0,
        "holding_days_typical": 2,
        "min_land_fraction": 0.20,
        "max_land_fraction": 0.40,
        "description": "High gross revenue potential, but elevated price volatility and rapid post-harvest perishable degradation.",
    },
    "Onion": {
        "display_name": "Onion (प्याज)",
        "category": "Bulb Crop",
        "suitable_seasons": ["Rabi", "Kharif"],
        "expected_yield_kg_per_acre": 7500.0,
        "production_cost_per_acre": 36000.0,
        "perishability_tier": "Low-Medium",
        "shelf_life_days": 45,
        "daily_spoilage_rate": 0.012,  # 1.2% per day
        "water_requirement": "Medium",
        "weather_sensitivity": "Medium",
        "price_volatility_tier": "Medium",
        "base_price_fallback": 28.0,
        "holding_days_typical": 7,
        "min_land_fraction": 0.20,
        "max_land_fraction": 0.40,
        "description": "Essential kitchen staple with moderate holding capability and strong statewide consumption demand.",
    },
    "Green Chilli": {
        "display_name": "Green Chilli (हरी मिर्च)",
        "category": "Cash Spice / Vegetable",
        "suitable_seasons": ["Kharif", "Rabi", "Zaid"],
        "expected_yield_kg_per_acre": 4000.0,
        "production_cost_per_acre": 42000.0,
        "perishability_tier": "High",
        "shelf_life_days": 8,
        "daily_spoilage_rate": 0.030,  # 3.0% per day
        "water_requirement": "Medium",
        "weather_sensitivity": "Medium",
        "price_volatility_tier": "High",
        "base_price_fallback": 48.0,
        "holding_days_typical": 2,
        "min_land_fraction": 0.15,
        "max_land_fraction": 0.30,
        "description": "High-value cash spice demanding intensive picking labor, offering high margins during festival windows.",
    },
    "Cauliflower": {
        "display_name": "Cauliflower (फूलगोभी)",
        "category": "Cole Crop / Brassica",
        "suitable_seasons": ["Rabi"],
        "expected_yield_kg_per_acre": 8500.0,
        "production_cost_per_acre": 32000.0,
        "perishability_tier": "High",
        "shelf_life_days": 7,
        "daily_spoilage_rate": 0.022,
        "water_requirement": "Medium",
        "weather_sensitivity": "Medium-High",
        "price_volatility_tier": "Medium",
        "base_price_fallback": 22.0,
        "holding_days_typical": 2,
        "min_land_fraction": 0.20,
        "max_land_fraction": 0.35,
        "description": "Popular winter vegetable with synchronized harvest gluts; requires prompt market clearance.",
    },
    "Cabbage": {
        "display_name": "Cabbage (पत्तागोभी)",
        "category": "Cole Crop / Brassica",
        "suitable_seasons": ["Rabi"],
        "expected_yield_kg_per_acre": 10000.0,
        "production_cost_per_acre": 30000.0,
        "perishability_tier": "Medium",
        "shelf_life_days": 14,
        "daily_spoilage_rate": 0.015,
        "water_requirement": "Medium",
        "weather_sensitivity": "Low-Medium",
        "price_volatility_tier": "Low-Medium",
        "base_price_fallback": 16.0,
        "holding_days_typical": 4,
        "min_land_fraction": 0.20,
        "max_land_fraction": 0.40,
        "description": "High-yielding, robust cole crop with better transit resilience than cauliflower and lower input costs.",
    },
    "Brinjal": {
        "display_name": "Brinjal (बैंगन)",
        "category": "Solanaceous Fruit",
        "suitable_seasons": ["Kharif", "Rabi", "Zaid"],
        "expected_yield_kg_per_acre": 11000.0,
        "production_cost_per_acre": 34000.0,
        "perishability_tier": "High",
        "shelf_life_days": 6,
        "daily_spoilage_rate": 0.025,
        "water_requirement": "Medium-High",
        "weather_sensitivity": "Medium",
        "price_volatility_tier": "Medium",
        "base_price_fallback": 20.0,
        "holding_days_typical": 2,
        "min_land_fraction": 0.20,
        "max_land_fraction": 0.40,
        "description": "Prolific continuous harvest crop with reliable local dietary uptake across Jharkhand rural and urban markets.",
    },
    "Okra": {
        "display_name": "Okra / Bhindi (भिंडी)",
        "category": "Fruit Vegetable",
        "suitable_seasons": ["Zaid", "Kharif"],
        "expected_yield_kg_per_acre": 4500.0,
        "production_cost_per_acre": 28000.0,
        "perishability_tier": "Very High",
        "shelf_life_days": 4,
        "daily_spoilage_rate": 0.035,  # 3.5% per day
        "water_requirement": "Medium",
        "weather_sensitivity": "Medium",
        "price_volatility_tier": "Medium-High",
        "base_price_fallback": 32.0,
        "holding_days_typical": 1,
        "min_land_fraction": 0.15,
        "max_land_fraction": 0.30,
        "description": "Fast-growing summer and monsoon crop; highly tender with high perishable loss if held over 48 hours.",
    },
}

SEASONS = ["Kharif", "Rabi", "Zaid"]
