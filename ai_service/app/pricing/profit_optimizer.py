"""
Farmer Profit Optimization & Economic Decision Support Engine.

Implements:
1. Expected Net Realization Calculation:
   Net Realization = Expected Price - Transport Cost - Holding Cost - Handling Cost - Wastage Cost.
2. Sell Now vs Wait Decision Rule:
   Compares selling today vs waiting 1, 3, or 7 days, balancing price appreciation against perishable decay and storage costs.
3. Multi-Market Comparison across candidate Jharkhand mandis.
4. Consumer Protection Constraints & Market Volume Allocation:
   Distributes farmer harvest across multiple mandis to avoid local price depression and flags consumer affordability thresholds.
5. Integration with KisanFlow OR-Tools Distance Matrix & Cost Calculation.
"""

from typing import Dict, List, Optional, Tuple, Any, Union
from ai_service.app.config import settings
from ai_service.app.pricing.price_data import JHARKHAND_MARKETS, SUPPORTED_COMMODITIES
from ai_service.route_optimization.distance import calculate_distance
from ai_service.route_optimization.models import Location
from ai_service.app.utils.logger import logger


class FarmerProfitOptimizer:
    """Economic decision engine for farmer net realization maximization and balanced market supply."""

    def __init__(
        self,
        cost_per_km: float = settings.COST_PER_KM,
        road_circuity_factor: float = settings.ROAD_CIRCUITY_FACTOR,
        holding_cost_per_kg_day: float = settings.DEFAULT_HOLDING_COST_PER_KG_DAY,
        handling_cost_per_kg: float = settings.DEFAULT_HANDLING_COST_PER_KG,
        consumer_price_threshold: float = settings.DEFAULT_CONSUMER_PRICE_THRESHOLD,
    ):
        self.cost_per_km = cost_per_km
        self.circuity_factor = road_circuity_factor
        self.holding_cost_per_kg_day = holding_cost_per_kg_day
        self.handling_cost_per_kg = handling_cost_per_kg
        self.consumer_price_threshold = consumer_price_threshold

    def calculate_transit_distance_km(
        self,
        farmer_location: Union[Location, Dict[str, Any], str],
        market_region: str,
    ) -> float:
        """
        Calculate realistic road distance in km from farmer location to candidate market
        using Haversine spherical distance multiplied by road circuity factor (1.28).
        """
        market_meta = JHARKHAND_MARKETS.get(market_region)
        if not market_meta:
            return 50.0  # Safe default regional transit

        mkt_loc = Location(
            id=market_region,
            name=f"{market_region} Mandi",
            latitude=market_meta["latitude"],
            longitude=market_meta["longitude"],
        )

        if isinstance(farmer_location, str):
            # If farmer location is named market or district
            floc = farmer_location.strip().title()
            if floc in JHARKHAND_MARKETS:
                f_meta = JHARKHAND_MARKETS[floc]
                f_loc = Location(
                    id=floc,
                    name=f"{floc} Origin",
                    latitude=f_meta["latitude"],
                    longitude=f_meta["longitude"],
                )
            else:
                # Default baseline: Assume ~35 km from rural hinterland to nearest mandi
                return 35.0
        elif isinstance(farmer_location, Location):
            f_loc = farmer_location
        elif isinstance(farmer_location, dict):
            f_loc = Location(
                id=farmer_location.get("id", "farmer_origin"),
                name=farmer_location.get("name", "Farmer Location"),
                latitude=farmer_location.get("latitude", 23.34),
                longitude=farmer_location.get("longitude", 85.31),
            )
        else:
            return 35.0


        dist = calculate_distance(f_loc, mkt_loc, circuity_factor=self.circuity_factor)
        return max(5.0, dist)

    def calculate_net_realization(
        self,
        commodity: str,
        expected_price_per_kg: float,
        distance_km: float,
        quantity_kg: float,
        days_held: int = 0,
        vehicle_capacity_kg: float = 5000.0,
    ) -> Dict[str, Any]:
        """
        Calculate Expected Net Realization per kg for a specific market option:

        Expected Net Realization = Expected Selling Price
                                 - Transport Cost per kg
                                 - Holding Cost per kg
                                 - Handling Cost per kg
                                 - Wastage / Spoilage Loss per kg
        """
        comm_meta = SUPPORTED_COMMODITIES.get(commodity, {
            "holding_loss_rate_per_day": settings.DEFAULT_DAILY_WASTAGE_RATE,
            "consumer_threshold_price": self.consumer_price_threshold,
        })
        daily_loss_rate = comm_meta.get("holding_loss_rate_per_day", settings.DEFAULT_DAILY_WASTAGE_RATE)

        # 1. Transportation cost per kg
        # Direct trip cost = total vehicle freight / batch size (capped at vehicle capacity)
        effective_load = min(max(100.0, quantity_kg), vehicle_capacity_kg)
        total_trip_cost = distance_km * self.cost_per_km
        transport_cost_per_kg = round(total_trip_cost / effective_load, 2)

        # 2. Holding cost per kg
        holding_cost_per_kg = round(self.holding_cost_per_kg_day * days_held, 2)

        # 3. Handling cost (loading, unloading, mandi entrance cess)
        handling_cost_per_kg = round(self.handling_cost_per_kg, 2)

        # 4. Spoilage / Quality downgrade loss per kg
        wastage_cost_per_kg = round(expected_price_per_kg * daily_loss_rate * days_held, 2)

        # Total deductions
        total_costs_per_kg = round(
            transport_cost_per_kg + holding_cost_per_kg + handling_cost_per_kg + wastage_cost_per_kg, 2
        )

        expected_net_realization = round(expected_price_per_kg - total_costs_per_kg, 2)
        total_expected_revenue = round(expected_price_per_kg * quantity_kg, 2)
        total_expected_net_profit = round(expected_net_realization * quantity_kg, 2)

        return {
            "expected_price_per_kg": expected_price_per_kg,
            "transport_cost_per_kg": transport_cost_per_kg,
            "holding_cost_per_kg": holding_cost_per_kg,
            "handling_cost_per_kg": handling_cost_per_kg,
            "wastage_cost_per_kg": wastage_cost_per_kg,
            "total_deductions_per_kg": total_costs_per_kg,
            "expected_net_realization_per_kg": expected_net_realization,
            "total_expected_revenue": total_expected_revenue,
            "total_expected_net_profit": total_expected_net_profit,
            "days_held": days_held,
            "distance_km": round(distance_km, 1),
        }

    def evaluate_sell_now_vs_wait(
        self,
        commodity: str,
        current_spot_price: float,
        daily_predictions: List[Dict[str, Any]],
        distance_km: float,
        quantity_kg: float,
    ) -> Dict[str, Any]:
        """
        Evaluate Sell Now vs Wait decision:
        Compares selling today (Day 0) against selling at future horizons (Day 1, 3, 7).
        Incorporates holding cost and perishable wastage deterioration over time.
        """
        # Day 0: Sell immediately
        day0_econ = self.calculate_net_realization(
            commodity=commodity,
            expected_price_per_kg=current_spot_price,
            distance_km=distance_km,
            quantity_kg=quantity_kg,
            days_held=0,
        )
        base_net = day0_econ["expected_net_realization_per_kg"]

        horizons_analysis = []
        best_option = {
            "recommendation": "SELL_NOW",
            "optimal_days_to_wait": 0,
            "net_gain_vs_today_per_kg": 0.0,
            "expected_net_realization": base_net,
            "reason": "Selling immediately avoids perishable storage degradation and inventory holding costs.",
        }

        max_net = base_net

        for pred in daily_predictions:
            h_day = pred.get("horizon_day", 1)
            f_price = pred["predicted_price"]

            econ = self.calculate_net_realization(
                commodity=commodity,
                expected_price_per_kg=f_price,
                distance_km=distance_km,
                quantity_kg=quantity_kg,
                days_held=h_day,
            )
            future_net = econ["expected_net_realization_per_kg"]
            net_gain = round(future_net - base_net, 2)

            is_better = future_net > max_net
            if is_better and net_gain >= 0.50:  # Require at least ₹0.50/kg net margin to justify wait risk
                max_net = future_net
                best_option = {
                    "recommendation": f"WAIT_{h_day}_DAYS",
                    "optimal_days_to_wait": h_day,
                    "net_gain_vs_today_per_kg": net_gain,
                    "expected_net_realization": future_net,
                    "reason": (
                        f"Projected price rise (+₹{pred['price_change_vs_current']:.2f}/kg) exceeds additional "
                        f"holding & wastage costs (₹{econ['holding_cost_per_kg'] + econ['wastage_cost_per_kg']:.2f}/kg), "
                        f"yielding a net gain of ₹{net_gain:.2f}/kg."
                    ),
                }

            horizons_analysis.append({
                "horizon_day": h_day,
                "date": pred["date"],
                "predicted_price": f_price,
                "expected_net_realization": future_net,
                "net_gain_vs_today": net_gain,
                "holding_and_wastage_cost": round(econ["holding_cost_per_kg"] + econ["wastage_cost_per_kg"], 2),
                "is_profitable_to_wait": net_gain >= 0.50,
            })

        return {
            "sell_now_net_realization": base_net,
            "decision": best_option["recommendation"],
            "optimal_wait_days": best_option["optimal_days_to_wait"],
            "expected_net_gain_per_kg": best_option["net_gain_vs_today_per_kg"],
            "recommended_net_realization": best_option["expected_net_realization"],
            "decision_rationale": best_option["reason"],
            "horizon_breakdown": horizons_analysis,
        }

    def compare_markets(
        self,
        commodity: str,
        quantity_kg: float,
        farmer_location: Any,
        market_predicted_prices: Dict[str, float],
    ) -> List[Dict[str, Any]]:
        """
        Compare all reachable Jharkhand markets for a given crop and quantity.
        Ranks options by Expected Net Realization (NOT raw price).
        """
        options: List[Dict[str, Any]] = []

        for region, pred_price in market_predicted_prices.items():
            dist = self.calculate_transit_distance_km(farmer_location, region)
            econ = self.calculate_net_realization(
                commodity=commodity,
                expected_price_per_kg=pred_price,
                distance_km=dist,
                quantity_kg=quantity_kg,
                days_held=0,
            )

            comm_meta = SUPPORTED_COMMODITIES.get(commodity, {})
            threshold = comm_meta.get("consumer_threshold_price", self.consumer_price_threshold)
            affordability_alert = pred_price > threshold

            options.append({
                "market": region,
                "mandi_name": JHARKHAND_MARKETS.get(region, {}).get("mandi_name", f"{region} Mandi"),
                "distance_km": round(dist, 1),
                "predicted_price": pred_price,
                "transport_cost_per_kg": econ["transport_cost_per_kg"],
                "handling_and_holding_per_kg": round(econ["holding_cost_per_kg"] + econ["handling_cost_per_kg"], 2),
                "expected_net_realization": econ["expected_net_realization_per_kg"],
                "total_expected_net_profit": econ["total_expected_net_profit"],
                "consumer_affordability_alert": affordability_alert,
                "recommended": False,
            })

        # Rank by net realization descending
        options.sort(key=lambda x: x["expected_net_realization"], reverse=True)
        if options:
            options[0]["recommended"] = True

        return options

    def allocate_market_supply(
        self,
        commodity: str,
        total_quantity_kg: float,
        market_options: List[Dict[str, Any]],
        max_single_market_share: float = settings.DEFAULT_MAX_MARKET_SHARE,
    ) -> List[Dict[str, Any]]:
        """
        Multi-market quantity allocation to protect against local market saturation.
        Prevents dumping excessive supply into one mandi that would collapse its price.
        """
        if not market_options:
            return []

        allocations: List[Dict[str, Any]] = []
        remaining_qty = total_quantity_kg

        # Eligible candidate markets sorted by net realization
        viable_markets = [m for m in market_options if m["expected_net_realization"] > 0]
        if not viable_markets:
            viable_markets = market_options[:1]

        # For smaller volumes (< 1500 kg), direct allocation to top market is optimal
        if total_quantity_kg <= 1500.0 or len(viable_markets) == 1:
            top_m = viable_markets[0]
            allocations.append({
                "market": top_m["market"],
                "allocated_quantity_kg": total_quantity_kg,
                "allocation_pct": 100.0,
                "expected_net_realization": top_m["expected_net_realization"],
                "projected_net_revenue": round(total_quantity_kg * top_m["expected_net_realization"], 2),
                "reason": "Batch size fits within single market daily absorption threshold.",
            })
            return allocations

        # For larger volumes, cap single market allocation and spread across top 2-3 markets
        max_single_qty = total_quantity_kg * max_single_market_share
        
        # Primary market
        prim_qty = min(remaining_qty, max_single_qty)
        allocations.append({
            "market": viable_markets[0]["market"],
            "allocated_quantity_kg": round(prim_qty, 1),
            "allocation_pct": round((prim_qty / total_quantity_kg) * 100.0, 1),
            "expected_net_realization": viable_markets[0]["expected_net_realization"],
            "projected_net_revenue": round(prim_qty * viable_markets[0]["expected_net_realization"], 2),
            "reason": "Primary high net-realization allocation (capped at market absorption limit).",
        })
        remaining_qty -= prim_qty

        # Secondary market(s)
        for idx in range(1, len(viable_markets)):
            if remaining_qty <= 0:
                break
            m = viable_markets[idx]
            alloc_qty = min(remaining_qty, max_single_qty)
            allocations.append({
                "market": m["market"],
                "allocated_quantity_kg": round(alloc_qty, 1),
                "allocation_pct": round((alloc_qty / total_quantity_kg) * 100.0, 1),
                "expected_net_realization": m["expected_net_realization"],
                "projected_net_revenue": round(alloc_qty * m["expected_net_realization"], 2),
                "reason": "Secondary diversified allocation to prevent local price collapse.",
            })
            remaining_qty -= alloc_qty

        return allocations
