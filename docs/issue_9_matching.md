# Issue #9: Multi-Supplier Matching & Allocation Engine

## Overview
KisanFlow connects bulk buyers (retailers, food processors, institutional canteens) with clusters of smallholder farmers and FPOs. The Supplier Matching Engine deterministically ranks and allocates procurement orders to maximize fill rate while optimizing cost, proximity, quality, and freshness.

## Multi-Criteria Scoring Formulation
Every candidate supplier $i$ is scored across six normalized criteria (each scaled to $[0, 100]$):

### 1. Price Fit ($w_p = 0.25$)
Suppliers offering produce at or below benchmark rates receive higher scores:
$$S_{\text{price}} = 100 \times \left( \frac{P_{\max} - P_i}{P_{\max} - P_{\min} + \epsilon} \right)$$

### 2. Distance Fit ($w_d = 0.20$)
Shorter road distances from the supplier's farm to the central buyer hub minimize logistics transit time and post-harvest degradation:
$$S_{\text{dist}} = 100 \times \max\left(0, 1 - \frac{d_i}{D_{\max}}\right)$$

### 3. Quantity Fit ($w_q = 0.20$)
Prioritizes suppliers who can fulfill significant chunks of demand, reducing procurement fragmentation:
$$S_{\text{qty}} = 100 \times \min\left(1.0, \frac{Q_i}{Q_{\text{req}}}\right)$$

### 4. Quality Fit ($w_{\text{ql}} = 0.15$)
Produce is graded according to AGMARK agricultural standards:
- Grade A: $100.0$
- Grade B: $75.0$
- Grade C: $50.0$
Suppliers below the buyer's `minimum_quality` threshold are strictly filtered out.

### 5. Reliability ($w_r = 0.10$)
Historical fulfillment track record score ($R_i \in [0.0, 1.0]$):
$$S_{\text{rel}} = 100 \times R_i$$

### 6. Freshness & Low Wastage ($w_f = 0.10$)
Rewards recent harvest time ($H_i$ days) and low spoilage risk ($W_i \in [0.0, 1.0]$):
$$S_{\text{fresh}} = 0.5 \times \left(100 \times \max\left(0, 1 - \frac{H_i}{7}\right)\right) + 0.5 \times (100 \times (1 - W_i))$$

### Composite Score
$$\text{Composite Score} = \frac{\sum w_k S_k}{\sum w_k} \in [0, 100]$$

## Iterative Allocation Algorithm
1. **Filter**: Incompatible commodity, quality below required threshold, zero available stock, or price exceeding buyer budget are immediately discarded.
2. **Score & Rank**: All eligible suppliers are scored using the multi-criteria formula and sorted in descending order of composite score.
3. **Greedy Allocation**:
   $$\text{Allocated}_i = \min(\text{Remaining Demand}, \text{Available Inventory}_i)$$
4. **Conservation of Mass**:
   - $\sum \text{Allocated} \le Q_{\text{req}}$
   - $\text{Allocated}_i \le \text{Available}_i$
   - $\text{Allocated}_i \ge 0$
5. **Explainability**: Every allocation includes human-readable decision reasons (e.g. "Favorable price fit (₹28.50/kg)", "Grade A superior quality", "High reliability rating (94%)").

## API Endpoint
- **Endpoint**: `POST /match-suppliers`
- **Request**:
  ```json
  {
    "requirement": {
      "product": "Tomato",
      "required_quantity_kg": 10000,
      "region": "Patna",
      "buyer_location": {"latitude": 25.5941, "longitude": 85.1376},
      "minimum_quality": "B"
    }
  }
  ```
- **Response**:
  ```json
  {
    "product": "Tomato",
    "required_quantity_kg": 10000.0,
    "total_allocated_quantity_kg": 10000.0,
    "fulfillment_percentage": 100.0,
    "unfulfilled_quantity_kg": 0.0,
    "is_fully_fulfilled": true,
    "average_procurement_price_per_kg": 29.39,
    "total_procurement_cost_inr": 293900.0,
    "selected_suppliers": [ ... ],
    "matching_summary": "Matched 5 suppliers for Tomato. Fulfillment: 100.0% (10,000 / 10,000 kg). Avg Price: ₹29.39/kg."
  }
  ```
