# Farm-to-Buyer Route Optimization Sub-Module

A modular, standalone Python library for farm-to-buyer agricultural logistics. Powered by **Google OR-Tools**, this sub-module solves the **Capacitated Vehicle Routing Problem (CVRP)** with an open Depot-to-Buyer topology. It collects agricultural cargo from pre-selected farmers/FPOs and delivers it to a destination buyer while strictly enforcing vehicle capacities and delivery deadlines.

---

## Architecture Diagram

```text
+-------------------------------------------------------------------------+
|                        KisanFlow Logistics Core                         |
|                                                                         |
|   +--------------------------+                                          |
|   | AI Supplier Matching     |                                          |
|   | (Teammate Responsibility)|                                          |
|   +------------+-------------+                                          |
|                | Selected Farmers & Buyer Demands                       |
|                v                                                        |
|   +-----------------------------------------------------------------+   |
|   |              route_optimization Sub-Module                      |   |
|   |                                                                 |   |
|   |  +--------------------+        +-----------------------------+  |   |
|   |  | models.py          |        | validators.py               |  |   |
|   |  | Pydantic Schemas   |        | Capacity & Supply Checks    |  |   |
|   |  +---------+----------+        +--------------+--------------+  |   |
|   |            |                                  |                 |   |
|   |            v                                  v                 |   |
|   |  +--------------------+        +-----------------------------+  |   |
|   |  | distance.py        |        | cost.py                     |  |   |
|   |  | Haversine Matrix   |        | Transit Cost & Travel Time  |  |   |
|   |  +---------+----------+        +--------------+--------------+  |   |
|   |            |                                  |                 |   |
|   |            +-----------------+----------------+                 |   |
|   |                              |                                  |   |
|   |                              v                                  |   |
|   |              +--------------------------------+                 |   |
|   |              | optimizer.py (Google OR-Tools) |                 |   |
|   |              | - Open CVRP (Depot -> Buyer)   |                 |   |
|   |              | - Capacity Dimension           |                 |   |
|   |              | - Guided Local Search          |                 |   |
|   |              +---------------+----------------+                 |   |
|   |                              |                                  |   |
|   |            +-----------------+-----------------+                |   |
|   |            |                                   |                |   |
|   |            v                                   v                |   |
|   |  +--------------------+        +-----------------------------+  |   |
|   |  | baseline.py        |        | comparison.py               |  |   |
|   |  | Input-Order Route  |        | % Savings & Efficiency      |  |   |
|   |  +---------+----------+        +--------------+--------------+  |   |
|   |            |                                  |                 |   |
|   |            +-----------------+----------------+                 |   |
|   |                              |                                  |   |
|   |                              v                                  |   |
|   |                   Standardized RouteResult                      |   |
|   +------------------------------+----------------------------------+   |
|                                  |                                      |
|                                  v                                      |
|       +------------------------------------------------------+          |
|       | Backend API (FastAPI / Express / Django / Frontend)  |          |
|       +------------------------------------------------------+          |
+-------------------------------------------------------------------------+
```

---

## 1. What This Module Does
* **Input-agnostic**: Accepts Python dataclasses, Pydantic models, or raw dictionaries.
* **Optimal Collection Sequencing**: Determines the shortest and most cost-effective order to collect agricultural products from farmers and transport them to the buyer hub.
* **Capacity Enforcement**: Ensures that vehicle payload capacities are never exceeded. Supports multi-vehicle fleet partitioning.
* **Temporal Feasibility**: Checks travel time against buyer delivery deadlines ($t = d / v$).
* **Automatic Benchmark Comparison**: Generates a baseline (sequential input-order) route and calculates percentage reductions for distance, cost, and travel time.
* **Failure Handling**: Catches physical infeasibilities (`INSUFFICIENT_SUPPLY`, `INSUFFICIENT_VEHICLE_CAPACITY`, `DEADLINE_CANNOT_BE_MET`) with helpful error payloads instead of exposing solver crashes.

---

## 2. Installation & Dependencies

Dependencies:
* `ortools >= 9.8.0` (Google Optimization Tools)
* `pydantic >= 2.0.0` (Data validation)
* `pytest >= 7.0.0` (Automated testing)

Install via pip:
```bash
pip install -r route_optimization/requirements.txt
```

---

## 3. Folder Structure

```text
route_optimization/
│
├── __init__.py             # Public exports: optimize_route, models, cost, distance
├── __main__.py             # Runnable CLI demo: python -m route_optimization
├── models.py               # Pydantic data models: Location, Supplier, Buyer, Vehicle, RouteRequest, RouteResult
├── distance.py             # Haversine distance calculator & reusable NxN distance matrix builder
├── cost.py                 # Transportation cost (distance * cost/km) & travel time (distance / speed)
├── baseline.py             # Baseline (input-order) route calculator
├── optimizer.py            # Primary OR-Tools CVRP optimizer
├── comparison.py           # Comparison engine: distance, cost, and time savings percentage calculations
├── validators.py           # Pre-solve validation: coordinate bounds, supply vs demand, capacity vs cargo
├── exceptions.py           # Domain exceptions: ValidationError, InfeasibleRouteError, RouteOptimizationError
├── sample_data.py          # Realistic agricultural logistics scenario (Depot, 3 Farmers, Buyer, Vehicles)
├── requirements.txt        # Isolated dependencies
├── README.md               # Documentation & Integration guide
└── tests/
    ├── __init__.py
    ├── test_distance.py    # Haversine accuracy, symmetry, matrix generation
    ├── test_capacity.py    # Capacity enforcement, multi-vehicle partitioning
    ├── test_optimizer.py   # Feasible route, deadline checks, edge cases, dict input compatibility
    └── test_comparison.py # Baseline calculation, savings percentage accuracy
```

---

## 4. Public Interface

The entire module is consumed via a single entry function:

```python
from route_optimization import optimize_route

# Pass either a dictionary or a RouteRequest object:
result = optimize_route(request_data)
```

No knowledge of OR-Tools internals, callbacks, indices, or solver flags is required by calling code.

---

## 5. Input Format

### Example Request (Dictionary or JSON)
```json
{
  "depot": {
    "id": "D001",
    "name": "Amritsar Central Agro Hub",
    "latitude": 31.6000,
    "longitude": 74.8400
  },
  "buyer": {
    "id": "B001",
    "name": "FreshMart Aggregation Buyer",
    "latitude": 31.6150,
    "longitude": 74.9450,
    "required_quantity_kg": 2000.0,
    "delivery_deadline": "4:00 PM"
  },
  "suppliers": [
    {
      "id": "F001",
      "name": "Farmer A",
      "latitude": 31.6600,
      "longitude": 74.8300,
      "available_quantity_kg": 800.0
    },
    {
      "id": "F002",
      "name": "Farmer B",
      "latitude": 31.6100,
      "longitude": 74.9100,
      "available_quantity_kg": 700.0
    },
    {
      "id": "F003",
      "name": "Farmer C",
      "latitude": 31.6700,
      "longitude": 74.8600,
      "available_quantity_kg": 500.0
    }
  ],
  "vehicle": {
    "id": "V001",
    "capacity_kg": 2500.0,
    "cost_per_km": 20.0,
    "average_speed_kmph": 40.0
  },
  "departure_time": "1:00 PM"
}
```

*Note: For multi-vehicle fleets, replace `"vehicle": { ... }` with `"vehicles": [ { ... }, { ... } ]`.*

---

## 6. Output Format

### Example Successful Response
```json
{
  "status": "success",
  "routes": [
    {
      "vehicle_id": "V001",
      "stops": [
        {
          "sequence": 0,
          "type": "depot",
          "id": "D001",
          "name": "Amritsar Central Agro Hub",
          "latitude": 31.6000,
          "longitude": 74.8400,
          "quantity_collected_kg": 0.0,
          "quantity_delivered_kg": 0.0,
          "cumulative_distance_km": 0.0,
          "arrival_time_hours": 0.0
        },
        {
          "sequence": 1,
          "type": "supplier",
          "id": "F001",
          "name": "Farmer A",
          "latitude": 31.6600,
          "longitude": 74.8300,
          "quantity_collected_kg": 800.0,
          "quantity_delivered_kg": 0.0,
          "cumulative_distance_km": 8.57,
          "arrival_time_hours": 0.21
        },
        {
          "sequence": 2,
          "type": "supplier",
          "id": "F003",
          "name": "Farmer C",
          "latitude": 31.6700,
          "longitude": 74.8600,
          "quantity_collected_kg": 500.0,
          "quantity_delivered_kg": 0.0,
          "cumulative_distance_km": 12.39,
          "arrival_time_hours": 0.31
        },
        {
          "sequence": 3,
          "type": "supplier",
          "id": "F002",
          "name": "Farmer B",
          "latitude": 31.6100,
          "longitude": 74.9100,
          "quantity_collected_kg": 700.0,
          "quantity_delivered_kg": 0.0,
          "cumulative_distance_km": 22.84,
          "arrival_time_hours": 0.57
        },
        {
          "sequence": 4,
          "type": "buyer",
          "id": "B001",
          "name": "FreshMart Aggregation Buyer",
          "latitude": 31.6150,
          "longitude": 74.9450,
          "quantity_collected_kg": 0.0,
          "quantity_delivered_kg": 2000.0,
          "cumulative_distance_km": 27.30,
          "arrival_time_hours": 0.68
        }
      ],
      "total_distance_km": 27.3,
      "estimated_travel_time_hours": 0.68,
      "estimated_transport_cost": 546.0,
      "capacity_used_kg": 2000.0,
      "capacity_utilization_percent": 80.0,
      "deadline_met": true
    }
  ],
  "comparison": {
    "baseline_distance_km": 44.1,
    "optimized_distance_km": 27.3,
    "distance_reduction_percent": 38.05,
    "baseline_cost": 881.4,
    "optimized_cost": 546.0,
    "cost_reduction_percent": 38.05,
    "baseline_time_hours": 1.10,
    "optimized_time_hours": 0.68,
    "time_reduction_percent": 38.18
  },
  "message": "Optimal route found using 1 vehicle(s)."
}
```

---

## 7. How Capacity Constraints Work
* Each vehicle has a strict maximum capacity in kilograms (`vehicle.capacity_kg`).
* Demands are assigned to locations: Depot ($0\text{ kg}$), Suppliers ($+\text{available\_quantity\_kg}$), Buyer ($0\text{ kg}$).
* An OR-Tools `Capacity` dimension (`AddDimensionWithVehicleCapacity`) is registered with null slack.
* Cumulative load starts at 0 at the Depot, increases monotonically with each farmer visited, and is strictly capped at $\le \text{vehicle.capacity\_kg}$ before reaching the Buyer.
* If a single vehicle cannot accommodate all farmers, additional vehicles in the fleet are automatically dispatched and assigned non-overlapping farmer subsets.

---

## 8. How Delivery Deadlines Work
* Buyer deadlines can be specified as an ISO timestamp (`"2026-09-07T16:00:00"`), a standard time string (`"4:00 PM"`), or explicit allowed hours (`max_travel_time_hours: 2.5`).
* Travel time is calculated as $t = \frac{\text{distance\_km}}{\text{average\_speed\_kmph}}$.
* If the transit time exceeds the allowable window, the optimizer returns:
```json
{
  "status": "infeasible",
  "reason": "DEADLINE_CANNOT_BE_MET",
  "message": "Optimized route transit time (3.12 hrs) exceeds allowable deadline window (1.50 hrs)."
}
```

---

## 9. Baseline Comparison Logic
* The baseline algorithm (`calculate_baseline_route`) simulates standard manual logistics: visiting farmers strictly in their input order `Depot -> Farmer 1 -> Farmer 2 -> ... -> Farmer N -> Buyer`.
* If capacity is exceeded, subsequent vehicles are dispatched in input order.
* The comparison module (`compare_routes`) computes:
  $$\text{saving\_percent} = \frac{\text{baseline} - \text{optimized}}{\text{baseline}} \times 100$$
* Yields exact percentage reductions for distance, cost, and transit time.

---

## 10. Running the Tests & CLI Demo

### Run CLI Demonstration
```bash
python -m route_optimization
```

### Run Automated Pytest Suite
```bash
pytest route_optimization/tests/ -v
```

---

## 11. Backend Integration Guide

Teammates can integrate this module directly into any Python service:

```python
# Example: FastAPI router
from fastapi import APIRouter, HTTPException
from route_optimization import optimize_route, RouteRequest

router = APIRouter(prefix="/api/routes", tags=["Route Optimization"])

@router.post("/optimize")
def api_optimize_route(payload: RouteRequest):
    result = optimize_route(payload)
    if result.status == "infeasible":
        raise HTTPException(status_code=422, detail={"reason": result.reason, "message": result.message})
    elif result.status == "invalid_input":
        raise HTTPException(status_code=400, detail={"reason": result.reason, "message": result.message})
    return result.to_dict()
```

---

## 12. Future Roadmap: Real Road Matrix API Integration
The distance matrix calculation in `distance.py` is fully decoupled. In production, `build_distance_matrix` can be enhanced to query Google Maps Distance Matrix API or OSRM without changing the public `optimize_route()` contract:

```python
# Conceptual drop-in inside distance.py:
def build_distance_matrix_osrm(locations):
    # Call http://router.project-osrm.org/table/v1/driving/...
    # Return 2D float distance matrix
    pass
```
