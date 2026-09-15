require("dotenv").config();

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required to run migrations.");

const { pool } = require("../src/config/database");

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(254) NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role VARCHAR(20) NOT NULL CHECK (role IN ('FARMER', 'FPO', 'BUYER', 'CONSUMER', 'ADMIN')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS farmers (
      user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      farm_name VARCHAR(160) NOT NULL,
      phone VARCHAR(30),
      village VARCHAR(120),
      district VARCHAR(120),
      state VARCHAR(120),
      latitude NUMERIC(10,7),
      longitude NUMERIC(10,7),
      reliability_score NUMERIC(4,3) NOT NULL DEFAULT 0.800 CHECK (reliability_score BETWEEN 0 AND 1),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS fpos (
      id UUID PRIMARY KEY,
      owner_user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(180) NOT NULL,
      registration_number VARCHAR(100),
      phone VARCHAR(30),
      region VARCHAR(120) NOT NULL,
      latitude NUMERIC(10,7),
      longitude NUMERIC(10,7),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS fpo_members (
      fpo_id UUID NOT NULL REFERENCES fpos(id) ON DELETE CASCADE,
      farmer_user_id UUID NOT NULL REFERENCES farmers(user_id) ON DELETE CASCADE,
      joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (fpo_id, farmer_user_id)
    );

    CREATE TABLE IF NOT EXISTS buyers (
      user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      organization_name VARCHAR(180) NOT NULL,
      phone VARCHAR(30),
      buyer_type VARCHAR(40) NOT NULL DEFAULT 'RETAILER',
      destination_name VARCHAR(180),
      region VARCHAR(120),
      latitude NUMERIC(10,7),
      longitude NUMERIC(10,7),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS products (
      id UUID PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      category VARCHAR(100) NOT NULL DEFAULT 'VEGETABLE',
      unit VARCHAR(20) NOT NULL DEFAULT 'kg',
      shelf_life_days INTEGER NOT NULL DEFAULT 7 CHECK (shelf_life_days > 0),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id UUID PRIMARY KEY,
      farmer_user_id UUID REFERENCES farmers(user_id) ON DELETE RESTRICT,
      fpo_id UUID REFERENCES fpos(id) ON DELETE RESTRICT,
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
      total_quantity_kg NUMERIC(12,2) NOT NULL CHECK (total_quantity_kg > 0),
      available_quantity_kg NUMERIC(12,2) NOT NULL CHECK (available_quantity_kg >= 0),
      reserved_quantity_kg NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (reserved_quantity_kg >= 0),
      sold_quantity_kg NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (sold_quantity_kg >= 0),
      unit VARCHAR(20) NOT NULL DEFAULT 'kg',
      asking_price_per_kg NUMERIC(12,2) NOT NULL CHECK (asking_price_per_kg > 0),
      quality_grade VARCHAR(2) NOT NULL DEFAULT 'A' CHECK (quality_grade IN ('A', 'B', 'C')),
      harvest_date DATE NOT NULL,
      available_from DATE NOT NULL DEFAULT CURRENT_DATE,
      latitude NUMERIC(10,7),
      longitude NUMERIC(10,7),
      region VARCHAR(120),
      status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PAUSED', 'SOLD_OUT')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CHECK ((farmer_user_id IS NOT NULL)::integer + (fpo_id IS NOT NULL)::integer = 1),
      CHECK (available_quantity_kg + reserved_quantity_kg + sold_quantity_kg <= total_quantity_kg)
    );

    CREATE TABLE IF NOT EXISTS procurement_requests (
      id UUID PRIMARY KEY,
      buyer_user_id UUID NOT NULL REFERENCES buyers(user_id) ON DELETE RESTRICT,
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
      requested_quantity_kg NUMERIC(12,2) NOT NULL CHECK (requested_quantity_kg > 0),
      max_price_per_kg NUMERIC(12,2) CHECK (max_price_per_kg > 0),
      quality_requirement VARCHAR(2) NOT NULL DEFAULT 'B' CHECK (quality_requirement IN ('A', 'B', 'C')),
      required_by DATE NOT NULL,
      destination_name VARCHAR(180) NOT NULL,
      destination_region VARCHAR(120) NOT NULL,
      destination_latitude NUMERIC(10,7) NOT NULL,
      destination_longitude NUMERIC(10,7) NOT NULL,
      status VARCHAR(24) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'MATCHED', 'CONFIRMED', 'PICKUP_SCHEDULED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS procurement_allocations (
      id UUID PRIMARY KEY,
      procurement_request_id UUID NOT NULL REFERENCES procurement_requests(id) ON DELETE CASCADE,
      inventory_id UUID NOT NULL REFERENCES inventory(id) ON DELETE RESTRICT,
      supplier_user_id UUID REFERENCES users(id) ON DELETE RESTRICT,
      fpo_id UUID REFERENCES fpos(id) ON DELETE RESTRICT,
      allocated_quantity_kg NUMERIC(12,2) NOT NULL CHECK (allocated_quantity_kg > 0),
      price_per_kg NUMERIC(12,2) NOT NULL CHECK (price_per_kg > 0),
      matching_score NUMERIC(6,2) NOT NULL DEFAULT 0,
      distance_km NUMERIC(10,2),
      matching_reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
      status VARCHAR(20) NOT NULL DEFAULT 'PROPOSED' CHECK (status IN ('PROPOSED', 'CONFIRMED', 'CANCELLED')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (procurement_request_id, inventory_id, status)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id UUID PRIMARY KEY,
      procurement_request_id UUID NOT NULL REFERENCES procurement_requests(id) ON DELETE RESTRICT,
      buyer_user_id UUID NOT NULL REFERENCES buyers(user_id) ON DELETE RESTRICT,
      supplier_user_id UUID REFERENCES users(id) ON DELETE RESTRICT,
      fpo_id UUID REFERENCES fpos(id) ON DELETE RESTRICT,
      status VARCHAR(24) NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('PENDING', 'MATCHED', 'CONFIRMED', 'PICKUP_SCHEDULED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED')),
      total_amount NUMERIC(14,2) NOT NULL CHECK (total_amount >= 0),
      payment_status VARCHAR(24) NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'PARTIAL', 'NOT_REQUIRED')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id UUID PRIMARY KEY,
      order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      inventory_id UUID NOT NULL REFERENCES inventory(id) ON DELETE RESTRICT,
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
      quantity_kg NUMERIC(12,2) NOT NULL CHECK (quantity_kg > 0),
      price_per_kg NUMERIC(12,2) NOT NULL CHECK (price_per_kg > 0),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS vehicles (
      id UUID PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      registration_number VARCHAR(60) NOT NULL UNIQUE,
      capacity_kg NUMERIC(12,2) NOT NULL CHECK (capacity_kg > 0),
      cost_per_km NUMERIC(12,2) NOT NULL DEFAULT 20 CHECK (cost_per_km >= 0),
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS routes (
      id UUID PRIMARY KEY,
      procurement_request_id UUID NOT NULL REFERENCES procurement_requests(id) ON DELETE RESTRICT,
      status VARCHAR(20) NOT NULL DEFAULT 'PLANNED' CHECK (status IN ('PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED')),
      total_distance_km NUMERIC(12,2) NOT NULL DEFAULT 0,
      estimated_time_hours NUMERIC(12,2) NOT NULL DEFAULT 0,
      estimated_cost NUMERIC(14,2) NOT NULL DEFAULT 0,
      baseline_cost NUMERIC(14,2) NOT NULL DEFAULT 0,
      savings NUMERIC(14,2) NOT NULL DEFAULT 0,
      optimizer_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS route_stops (
      id UUID PRIMARY KEY,
      route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
      vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
      order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
      stop_sequence INTEGER NOT NULL CHECK (stop_sequence >= 0),
      stop_type VARCHAR(24) NOT NULL CHECK (stop_type IN ('DEPOT_START', 'PICKUP', 'DEPOT_END')),
      name VARCHAR(180) NOT NULL,
      latitude NUMERIC(10,7) NOT NULL,
      longitude NUMERIC(10,7) NOT NULL,
      quantity_kg NUMERIC(12,2) NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS deliveries (
      id UUID PRIMARY KEY,
      order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
      route_id UUID REFERENCES routes(id) ON DELETE SET NULL,
      status VARCHAR(24) NOT NULL DEFAULT 'PICKUP_PENDING' CHECK (status IN ('PICKUP_PENDING', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'EXCEPTION')),
      pickup_time TIMESTAMPTZ,
      expected_delivery TIMESTAMPTZ,
      actual_delivery TIMESTAMPTZ,
      exception_reason TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_inventory_product_status ON inventory(product_id, status, available_quantity_kg);
    CREATE INDEX IF NOT EXISTS idx_inventory_supplier ON inventory(farmer_user_id, fpo_id);
    CREATE INDEX IF NOT EXISTS idx_procurement_buyer_status ON procurement_requests(buyer_user_id, status);
    CREATE INDEX IF NOT EXISTS idx_allocations_request_status ON procurement_allocations(procurement_request_id, status);
    CREATE INDEX IF NOT EXISTS idx_orders_buyer_supplier ON orders(buyer_user_id, supplier_user_id, fpo_id);
    CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);
  `);
  console.log("Database migration completed.");
}

migrate()
  .catch((error) => { console.error("Migration failed:", error.stack || error); process.exitCode = 1; })
  .finally(() => pool.end());
