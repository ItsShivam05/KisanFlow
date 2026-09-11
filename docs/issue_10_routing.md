# Issue #10: Google OR-Tools Capacitated Route Optimization

## Overview
Once bulk procurement is allocated across distributed farmers and FPOs, KisanFlow solves a multi-stop Capacitated Vehicle Routing Problem (CVRP) to collect produce and deliver it to the central aggregation hub.

---

## Mathematical Formulation

### Problem Model: CVRP
- **Depot / Buyer Hub ($0$)**: Central Procurement Hub / Warehouse (Patna: $25.5941^\circ\text{ N}, 85.1376^\circ\text{ E}$).
- **Customer / Pickup Nodes ($1 \dots N$)**: Matched supplier locations with positive collection demands $q_i > 0$.
- **Fleet ($V$)**: Homogeneous or heterogeneous trucks with payload capacity $C_v$ (e.g. 5,000 kg each).
- **Network Arc Distance ($c_{ij}$)**: Calculated via Haversine great-circle distance scaled by empirical road circuity factor ($\gamma = 1.28$):
  $$c_{ij} = \gamma \times 2 R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos \phi_i \cos \phi_j \sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)$$
  *(Note: Haversine distance is a geographic approximation, not real-time road GPS routing).*

### Objective Function
Minimize total fleet traveled road distance and vehicle mobilization costs:
$$\min \sum_{v \in V} \sum_{i=0}^N \sum_{j=0}^N c_{ij} x_{ijv} + \sum_{v \in V} F_v y_v$$

### Constraints
1. **Visit Constraint & Route Completeness**: Every supplier pickup stop is visited exactly once:
   $$\sum_{v \in V} \sum_{j=0}^N x_{ijv} = 1 \quad \forall i \in \{1 \dots N\}$$
2. **Depot Start and Return**: Each vehicle starts at depot $0$ and returns to depot $0$:
   $$\sum_{j=1}^N x_{0jv} = \sum_{i=1}^N x_{i0v} \le 1 \quad \forall v \in V$$
3. **Vehicle Capacity**: Cumulative load picked up along route $v$ cannot exceed vehicle maximum payload:
   $$\sum_{i=1}^N q_i \sum_{j=0}^N x_{ijv} \le C_v \quad \forall v \in V$$
4. **Quantity Conservation Guarantee**:
   $$\sum_{v \in V} \text{Load}_v = \sum_{i=1}^N q_i$$
5. **Delivery Deadline**:
   $$t_v = \frac{\text{Distance}_v}{\text{Speed}_v} \le T_{\text{deadline}}$$

---

## Solver Configuration
- **Library**: `ortools.constraint_solver.pywrapcp`
- **First Solution Strategy**: `PATH_CHEAPEST_ARC`
- **Local Search Metaheuristic**: `GUIDED_LOCAL_SEARCH`
- **Time Limit**: 3.0 seconds

---

## Dual Input Contract Support

The API accepts either the native KisanFlow schema or the modular contract:

### 1. Standard Contract (with `buyer`, `suppliers`, `vehicles`)
```json
{
  "buyer": {
    "id": "BUYER-PAT-01",
    "name": "Patna Central Mandi Aggregation Hub",
    "latitude": 25.5941,
    "longitude": 85.1376
  },
  "suppliers": [
    {
      "id": "FPO-A",
      "name": "Phulwari Kisan Kalyan FPO",
      "latitude": 25.5786,
      "longitude": 85.0743,
      "allocated_quantity_kg": 3000.0
    },
    {
      "id": "FPO-B",
      "name": "Danapur Progressive Agri FPO",
      "latitude": 25.6324,
      "longitude": 85.0441,
      "allocated_quantity_kg": 2000.0
    }
  ],
  "vehicles": [
    {
      "id": "TRUCK-01",
      "capacity_kg": 5000.0,
      "cost_per_km": 20.0,
      "average_speed_kmph": 40.0
    }
  ],
  "delivery_deadline": "6:00 PM"
}
```

---

## Baseline Comparison & Savings Formulation
- **Baseline Distance**:
  $$D_{\text{baseline}} = \sum_{i=1}^N 2 \times c_{0i}$$
- **Optimized Distance**:
  $$D_{\text{optimized}} = \text{Total Distance of CVRP Solution}$$
- **Distance Saved**:
  $$\Delta D = D_{\text{baseline}} - D_{\text{optimized}}$$
- **Savings Percentage**:
  $$\%_{\text{saved}} = \frac{\Delta D}{D_{\text{baseline}}} \times 100\%$$

In the official SIH 10,000 kg Tomato scenario:
- Baseline Distance: **126.76 km**
- Optimized CVRP Distance: **99.83 km**
- **Distance Saved: 26.93 km (21.24% reduction)**
- **Logistics Cost Saved: Rs. 2,538.60 (38.85% reduction)**
- **Travel Time Saved: 1.43 hours (45.11% reduction)**

---

## Verification & Execution Commands

### Run SIH 3-Run Demonstration
```bash
python -m ai_service.scripts.sih_route_demo
```

### Run Scalability Benchmark (1 to 100 suppliers)
```bash
python -m ai_service.scripts.route_benchmark
```

### Run Full Pytest Suite
```bash
pytest ai_service/tests/test_routing.py -v
```
