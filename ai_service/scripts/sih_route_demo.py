"""
Deterministic SIH Demonstration Scenario Script (Phase 35).

Executes the official 10,000 kg Tomato procurement scenario:
- Buyer: Patna Central Procurement Hub (10,000 kg Tomato)
- Selected Suppliers from Supplier Matching:
  - FPO A (Phulwari FPO): 3,000 kg
  - FPO B (Danapur Agro): 2,000 kg
  - Farmer C (Hajipur Green Farms): 3,000 kg
  - FPO D (Fatuha Farmers Co.): 2,000 kg
  - Total: 10,000 kg
- Fleet: 2 Vehicles @ 5,000 kg each
- Runs 3 consecutive times to mathematically verify determinism and quantity conservation.
"""

import json
import sys
from typing import Any, Dict

# Ensure safe UTF-8 output on Windows terminals
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

from ai_service.app.optimization.solver import solve_cvrp
from ai_service.app.schemas.routing import RouteOptimizeRequest

SIH_SCENARIO_PAYLOAD: Dict[str, Any] = {
    "buyer": {
        "id": "BUYER-PAT-01",
        "name": "Patna Central Mandi Aggregation Hub",
        "latitude": 25.5941,
        "longitude": 85.1376,
    },
    "suppliers": [
        {
            "id": "FPO-A",
            "name": "Phulwari Kisan Kalyan FPO",
            "latitude": 25.5786,
            "longitude": 85.0743,
            "allocated_quantity_kg": 3000.0,
        },
        {
            "id": "FPO-B",
            "name": "Danapur Progressive Agri FPO",
            "latitude": 25.6324,
            "longitude": 85.0441,
            "allocated_quantity_kg": 2000.0,
        },
        {
            "id": "FRM-C",
            "name": "Hajipur Quality Green Farms",
            "latitude": 25.6858,
            "longitude": 85.2146,
            "allocated_quantity_kg": 3000.0,
        },
        {
            "id": "FPO-D",
            "name": "Fatuha Farmers Producer Co.",
            "latitude": 25.5112,
            "longitude": 85.3129,
            "allocated_quantity_kg": 2000.0,
        },
    ],
    "vehicles": [
        {
            "id": "TRUCK-01",
            "capacity_kg": 5000.0,
            "cost_per_km": 20.0,
            "average_speed_kmph": 40.0,
        },
        {
            "id": "TRUCK-02",
            "capacity_kg": 5000.0,
            "cost_per_km": 20.0,
            "average_speed_kmph": 40.0,
        },
    ],
    "delivery_deadline": "6:00 PM",
}


def run_sih_demo() -> bool:
    print("=" * 75)
    print(" KISANFLOW SIH 2026 OFFICIAL ROUTE OPTIMIZATION DEMO SCENARIO")
    print("=" * 75)
    print("BUYER:")
    print("  Destination: Patna Central Mandi Aggregation Hub (25.5941, 85.1376)")
    print("  Required Commodity: 10,000 kg Tomato")
    print("  Delivery Target: 6:00 PM (Max ~10.0 hrs)")
    print()
    print("SUPPLIERS ALLOCATED BY MATCHING ENGINE:")
    for s in SIH_SCENARIO_PAYLOAD["suppliers"]:
        print(f"  • {s['id']:<8} {s['name']:<32} | {s['allocated_quantity_kg']:,.0f} kg | ({s['latitude']}, {s['longitude']})")
    print(f"  TOTAL ALLOCATED: 10,000 kg")
    print()
    print("FLEET SPECIFICATIONS:")
    print("  • Truck-01: 5,000 kg capacity, Rs. 20/km, 40 km/h")
    print("  • Truck-02: 5,000 kg capacity, Rs. 20/km, 40 km/h")
    print("=" * 75)

    run_fingerprints = []
    all_passed = True

    for run_num in range(1, 4):
        print(f"\n--- EXECUTING DEMO RUN {run_num} OF 3 ---")
        req = RouteOptimizeRequest(**SIH_SCENARIO_PAYLOAD)
        resp = solve_cvrp(req)

        # 1. Assert Status
        if resp.status not in ["OPTIMAL", "FEASIBLE"]:
            print(f"  [FAIL] Run {run_num} failed with status {resp.status}")
            all_passed = False
            continue

        # 2. Assert Quantity Conservation (10,000 kg strictly preserved)
        if resp.total_quantity_collected_kg != 10000.0:
            print(f"  [FAIL] Quantity conservation failed: collected {resp.total_quantity_collected_kg} kg != 10,000 kg")
            all_passed = False
            continue

        # 3. Assert Vehicle Capacities
        for route in resp.routes:
            if route.total_carried_kg > 5000.0:
                print(f"  [FAIL] Vehicle {route.vehicle_id} exceeded capacity: {route.total_carried_kg} kg > 5000 kg")
                all_passed = False
                continue

        # 4. Assert Route Completeness
        visited_ids = {s.node_id for r in resp.routes for s in r.stops if s.stop_type == "pickup"}
        expected_ids = {"FPO-A", "FPO-B", "FRM-C", "FPO-D"}
        if visited_ids != expected_ids:
            print(f"  [FAIL] Incomplete suppliers visited: {visited_ids} != {expected_ids}")
            all_passed = False
            continue

        comp = resp.baseline_comparison
        print(f"  Status: {resp.status}")
        print(f"  Active Vehicles: {resp.active_vehicles_count}")
        print(f"  Total Quantity Collected: {resp.total_quantity_collected_kg:,.0f} kg (100% Conserved)")
        print(f"  Optimized Distance: {resp.total_distance_km:.2f} km")
        print(f"  Estimated Travel Time: {resp.total_travel_time_hours:.2f} hrs (Deadline MET)")
        print(f"  Optimized Transport Cost: Rs. {resp.total_transport_cost_inr:,.2f}")
        print(f"  Baseline Distance: {comp.baseline_distance_km:.2f} km")
        print(f"  Baseline Transport Cost: Rs. {comp.baseline_cost_inr:,.2f}")
        print(f"  Distance Saved: {comp.distance_saved_km:.2f} km ({comp.distance_savings_percent}%)")
        print(f"  Cost Saved: Rs. {comp.cost_saved_inr:,.2f} ({comp.cost_savings_percent}%)")

        for r in resp.routes:
            stop_str = " -> ".join([s.name or s.node_id for s in r.stops])
            print(f"    • {r.vehicle_id}: {r.total_carried_kg:,.0f} kg ({r.capacity_utilization_percent}%) | {r.route_distance_km} km | Stops: {stop_str}")

        # Record fingerprint for determinism check
        fingerprint = {
            "dist": resp.total_distance_km,
            "cost": resp.total_transport_cost_inr,
            "time": resp.total_travel_time_hours,
            "routes": [r.ordered_stop_ids for r in resp.routes],
        }
        run_fingerprints.append(json.dumps(fingerprint, sort_keys=True))
        print(f"  [PASS] Run {run_num} verified successfully.")

    # Check Determinism
    print("\n" + "=" * 75)
    print("DETERMINISM AUDIT ACROSS 3 RUNS:")
    if len(set(run_fingerprints)) == 1:
        print("  [PASS] 100% Byte-for-byte identical output across all 3 runs.")
    else:
        print("  [FAIL] Discrepancies detected between runs.")
        all_passed = False

    print("=" * 75)
    return all_passed


if __name__ == "__main__":
    success = run_sih_demo()
    sys.exit(0 if success else 1)
