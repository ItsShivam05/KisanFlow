# KisanFlow SIH Platform — Canonical API Contract Reference

**Architecture Overview**:

```
 ┌─────────────────────────────────────────────────────────────┐
 │                     NEXT.JS FRONTEND                        │
 │                  http://localhost:3000                      │
 └──────────────────────────────┬──────────────────────────────┘
                                │ (HTTP REST + JSON)
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │                  EXPRESS BACKEND SERVER                     │
 │               http://localhost:5000/api/v1                  │
 └───────────────────┬─────────────────────┬───────────────────┘
                     │                     │
      (Local SQLite / Postgres)     (Internal Microservice Proxy)
                     ▼                     ▼
 ┌───────────────────────────┐ ┌───────────────────────────────┐
 │    DATABASE STORAGE       │ │       FASTAPI AI SERVICE      │
 │  kisanflow_local.sqlite   │ │     http://127.0.0.1:8000     │
 └───────────────────────────┘ └───────────────────────────────┘
```

---

## 🔐 1. Authentication APIs

### 1.1 Register User
- **Method & Path**: `POST /api/v1/auth/register`
- **Auth**: None
- **Request Body**:
  ```json
  {
    "name": "Birsa Munda",
    "email": "birsa@demo.kisanflow.local",
    "password": "password123",
    "role": "FARMER"
  }
  ```
- **Supported Roles**: `FARMER`, `FPO`, `BUYER`, `CONSUMER`
- **Success Response (201)**:
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "data": {
      "user": {
        "id": "uuid-v4",
        "name": "Birsa Munda",
        "email": "birsa@demo.kisanflow.local",
        "role": "FARMER",
        "createdAt": "2026-09-15 20:35:09"
      },
      "token": "eyJhbGciOi..."
    }
  }
  ```

### 1.2 Login User
- **Method & Path**: `POST /api/v1/auth/login`
- **Auth**: None
- **Request Body**:
  ```json
  {
    "email": "birsa@demo.kisanflow.local",
    "password": "password123"
  }
  ```
- **Success Response (200)**:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "user": { "id": "...", "name": "...", "email": "...", "role": "FARMER" },
      "token": "eyJhbGciOi..."
    }
  }
  ```

### 1.3 Get Current User Session
- **Method & Path**: `GET /api/v1/auth/me`
- **Auth**: `Bearer <token>`
- **Success Response (200)**:
  ```json
  {
    "success": true,
    "data": {
      "user": { "id": "...", "name": "...", "email": "...", "role": "FARMER" }
    }
  }
  ```

---

## 🧑‍🌾 2. Inventory & Marketplace APIs

### 2.1 List Inventory / Available Produce
- **Method & Path**: `GET /api/v1/inventory`
- **Query Params**: `product`, `region`, `quality`
- **Auth**: `Bearer <token>`
- **Success Response (200)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "inv-uuid",
        "product_id": "10000000-0000-4000-8000-000000000001",
        "product_name": "Tomato",
        "supplier_name": "Chota Nagpur Harvests",
        "total_quantity_kg": 2500,
        "available_quantity_kg": 2500,
        "asking_price_per_kg": 28,
        "quality_grade": "A",
        "region": "Ranchi"
      }
    ]
  }
  ```

### 2.2 Add Harvest Produce (Farmer / FPO)
- **Method & Path**: `POST /api/v1/inventory`
- **Auth**: `Bearer <token>` (Role: `FARMER` or `FPO`)
- **Request Body**:
  ```json
  {
    "product_id": "10000000-0000-4000-8000-000000000001",
    "total_quantity_kg": 500,
    "asking_price_per_kg": 32,
    "quality_grade": "A",
    "harvest_date": "2026-09-15",
    "region": "Ranchi"
  }
  ```
- **Success Response (200)**: Returns created inventory object.

---

## 🛒 3. Procurement & Allocation APIs

### 3.1 Create Procurement Request (Buyer)
- **Method & Path**: `POST /api/v1/procurement-requests`
- **Auth**: `Bearer <token>` (Role: `BUYER`)
- **Request Body**:
  ```json
  {
    "product_id": "10000000-0000-4000-8000-000000000001",
    "requested_quantity_kg": 300,
    "max_price_per_kg": 35,
    "quality_requirement": "B",
    "required_by": "2026-09-20",
    "destination_name": "Ranchi Central Retail Co",
    "destination_region": "Ranchi"
  }
  ```
- **Success Response (200)**: Returns created procurement request object.

### 3.2 AI Supplier Matching for Procurement
- **Method & Path**: `POST /api/v1/procurement-requests/:id/match`
- **Auth**: `Bearer <token>` (Role: `BUYER`)
- **Backend Action**: Proxies requirement to FastAPI AI Service (`/match-suppliers`), computes distance scores, and saves proposed allocations.
- **Success Response (200)**: Returns selected suppliers, fulfillment percentages, and cost savings.

### 3.3 Confirm Procurement & Generate Orders
- **Method & Path**: `POST /api/v1/procurement-requests/:id/confirm`
- **Auth**: `Bearer <token>` (Role: `BUYER`)
- **Backend Action**: Deducts inventory stock, creates order & order items, updates procurement request status to `CONFIRMED`.
- **Success Response (200)**: Returns confirmed order details.

---

## 📦 4. Orders & Logistics APIs

### 4.1 List User Orders
- **Method & Path**: `GET /api/v1/orders`
- **Auth**: `Bearer <token>`
- **Success Response (200)**: Returns array of confirmed orders with items and status.

### 4.2 Update Delivery Status
- **Method & Path**: `PATCH /api/v1/orders/:id/delivery`
- **Auth**: `Bearer <token>`
- **Request Body**:
  ```json
  {
    "status": "PICKED_UP"
  }
  ```
- **Status Lifecycle**: `PICKUP_PENDING` → `PICKED_UP` → `IN_TRANSIT` → `DELIVERED`.
- **Success Response (200)**: Returns updated delivery status object.

---

## 🤖 5. AI / ML Microservice APIs (FastAPI `:8000`)

### 5.1 Price Prediction (XGBoost)
- **Method & Path**: `POST http://127.0.0.1:8000/price-predict`
- **Request Body**: `{"commodity": "Tomato", "region": "Ranchi", "forecast_days": 7}`

### 5.2 Crop Recommendation & "What If?" Scenario Stress-Testing
- **Method & Path**: `POST http://127.0.0.1:8000/crop-recommendation`
- **Request Body**: `{"region": "Ranchi", "land_size_acres": 5, "season": "Rabi", "scenario": "Excess Monsoon"}`

### 5.3 Capacitated Route Optimization (Google OR-Tools)
- **Method & Path**: `POST http://127.0.0.1:8000/optimize-route`
- **Request Body**: `{"depot_coordinates": {...}, "pickups": [...], "vehicle_capacity_kg": 5000}`

---

## 📊 6. Impact Dashboard APIs

### 6.1 Get Platform Impact Summary
- **Method & Path**: `GET /api/v1/impact`
- **Auth**: `Bearer <token>`
- **Success Response (200)**:
  ```json
  {
    "success": true,
    "data": {
      "logistics_savings": 12450,
      "optimized_km": 142.5,
      "baseline_km": 218.0,
      "confirmed_orders": 8,
      "kilometers_saved": 75.5
    }
  }
  ```
