"""
Crop Financial and Economic Calculation Engine.

Calculates:
- Expected Total Yield (kg) based on acreage and irrigation constraints.
- Gross Expected Revenue.
- Cultivation, Freight, Holding, and Spoilage Cost Deductions.
- Expected Net Return (Total & Per Acre).
"""

from typing import Dict, Any, Optional
from ai_service.app.config import settings
from ai_service.app.crop_planning.crop_data import SUPPORTED_CROPS


def calculate_crop_economics(
    crop_name: str,
    land_area_acres: float,
    expected_price_per_kg: float,
    distance_to_market_km: float = 25.0,
    production_cost_override_per_acre: Optional[float] = None,
    irrigation: bool = True,
    holding_days: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Compute rigorous economic breakdown for a crop on a given acreage.
    """
    crop_meta = SUPPORTED_CROPS.get(crop_name)
    if not crop_meta:
        raise ValueError(f"Unsupported crop: '{crop_name}'")

    land_acres = max(0.1, float(land_area_acres))
    base_yield_per_acre = float(crop_meta["expected_yield_kg_per_acre"])

    # Agronomic water stress adjustment
    # If farmer lacks irrigation and the crop has Medium-High water demand, yield drops by 18-25%
    water_req = crop_meta.get("water_requirement", "Medium")
    yield_multiplier = 1.0
    if not irrigation:
        if water_req in ["High", "Medium-High"]:
            yield_multiplier = 0.78  # 22% yield penalty under rainfed conditions
        elif water_req == "Medium":
            yield_multiplier = 0.90

    effective_yield_per_acre = round(base_yield_per_acre * yield_multiplier, 1)
    total_yield_kg = round(effective_yield_per_acre * land_acres, 1)

    # 1. Gross Revenue
    expected_price = max(1.0, float(expected_price_per_kg))
    gross_revenue = round(total_yield_kg * expected_price, 2)

    # 2. Production / Cultivation Cost
    base_cost_per_acre = (
        float(production_cost_override_per_acre)
        if production_cost_override_per_acre is not None and production_cost_override_per_acre > 0
        else float(crop_meta["production_cost_per_acre"])
    )
    production_cost = round(base_cost_per_acre * land_acres, 2)

    # 3. Transportation Freight Cost (Haversine × 1.28 Circuity × Cost/km)
    # Using batch vehicle logistics: ₹20/km rate across vehicle capacity (5,000 kg)
    circuity = settings.ROAD_CIRCUITY_FACTOR
    rate_per_km = settings.COST_PER_KM
    truck_capacity = settings.VEHICLE_CAPACITY_KG

    effective_distance = max(5.0, float(distance_to_market_km)) * circuity
    num_truckloads = max(1.0, total_yield_kg / truck_capacity)
    transport_cost = round(effective_distance * rate_per_km * num_truckloads, 2)
    transport_cost_per_kg = round(transport_cost / max(1.0, total_yield_kg), 2)

    # 4. Holding / Temporary Storage Cost
    days_held = int(holding_days if holding_days is not None else crop_meta.get("holding_days_typical", 2))
    daily_holding_rate = settings.DEFAULT_HOLDING_COST_PER_KG_DAY  # ₹0.15/kg/day
    holding_cost = round(daily_holding_rate * days_held * total_yield_kg, 2)

    # 5. Wastage & Perishable Decay Cost
    daily_spoilage = float(crop_meta.get("daily_spoilage_rate", 0.015))
    total_spoilage_pct = min(0.35, daily_spoilage * days_held)
    wastage_cost = round(gross_revenue * total_spoilage_pct, 2)

    # Total Deductions & Net Realization
    total_costs = round(production_cost + transport_cost + holding_cost + wastage_cost, 2)
    net_return = round(gross_revenue - total_costs, 2)
    net_return_per_acre = round(net_return / land_acres, 2)
    benefit_cost_ratio = round(gross_revenue / max(1.0, total_costs), 2)

    return {
        "crop": crop_name,
        "land_acres": land_acres,
        "effective_yield_per_acre_kg": effective_yield_per_acre,
        "total_yield_kg": total_yield_kg,
        "expected_price_per_kg": expected_price,
        "gross_revenue": gross_revenue,
        "production_cost": production_cost,
        "production_cost_per_acre": base_cost_per_acre,
        "transport_cost": transport_cost,
        "transport_cost_per_kg": transport_cost_per_kg,
        "holding_cost": holding_cost,
        "wastage_cost": wastage_cost,
        "total_costs": total_costs,
        "expected_net_return": net_return,
        "net_return_per_acre": net_return_per_acre,
        "benefit_cost_ratio": benefit_cost_ratio,
        "days_held": days_held,
        "irrigation_yield_factor": yield_multiplier,
    }
