const crypto = require("crypto");
const { pool } = require("../config/database");

function httpError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function requireRole(user, roles) {
  if (!roles.includes(user.role))
    throw httpError("You are not authorized for this action", 403);
}

function parseNumber(value, name, { positive = false } = {}) {
  const number = Number(value);
  if (!Number.isFinite(number) || (positive ? number <= 0 : number < 0))
    throw httpError(
      `${name} must be ${positive ? "greater than zero" : "a valid non-negative number"}`,
    );
  return number;
}

async function getProfile(user, table, idColumn, role) {
  requireRole(user, [role]);
  const result = await pool.query(
    `SELECT * FROM ${table} WHERE ${idColumn} = $1`,
    [user.id],
  );
  if (!result.rows[0])
    throw httpError(`${role.toLowerCase()} profile not found`, 404);
  return result.rows[0];
}

async function saveProfile(user, table, idColumn, role, body, fields) {
  requireRole(user, [role]);
  const missing = fields.find(
    (field) =>
      field !== "phone" && (body[field] === undefined || body[field] === ""),
  );
  if (missing) throw httpError(`${missing} is required`);
  const values = fields.map((field) => body[field]);
  const placeholders = fields.map((_, index) => `$${index + 2}`).join(", ");
  const updates = fields
    .map((field, index) => `${field} = $${index + 2}`)
    .join(", ");
  const result = await pool.query(
    `INSERT INTO ${table} (${idColumn}, ${fields.join(", ")}) VALUES ($1, ${placeholders}) ON CONFLICT (${idColumn}) DO UPDATE SET ${updates}, updated_at = NOW() RETURNING *`,
    [user.id, ...values],
  );
  return result.rows[0];
}

async function getFarmer(user) {
  return getProfile(user, "farmers", "user_id", "FARMER");
}
async function saveFarmer(user, body) {
  return saveProfile(user, "farmers", "user_id", "FARMER", body, [
    "farm_name",
    "phone",
    "village",
    "district",
    "state",
    "latitude",
    "longitude",
  ]);
}
async function getBuyer(user) {
  return getProfile(user, "buyers", "user_id", "BUYER");
}
async function saveBuyer(user, body) {
  return saveProfile(user, "buyers", "user_id", "BUYER", body, [
    "organization_name",
    "phone",
    "buyer_type",
    "destination_name",
    "region",
    "latitude",
    "longitude",
  ]);
}

async function listInventory(user, filters = {}) {
  const values = [];
  const conditions = ["i.status = 'ACTIVE'", "i.available_quantity_kg > 0"];
  if (user.role === "FARMER") {
    values.push(user.id);
    conditions.push(`i.farmer_user_id = $${values.length}`);
  }
  if (filters.product) {
    values.push(filters.product);
    conditions.push(`LOWER(p.name) = LOWER($${values.length})`);
  }
  if (filters.region) {
    values.push(filters.region);
    conditions.push(`LOWER(i.region) = LOWER($${values.length})`);
  }
  if (filters.quality) {
    values.push(filters.quality);
    conditions.push(`i.quality_grade <= $${values.length}`);
  }
  const result = await pool.query(
    `SELECT i.*, p.name AS product_name, p.shelf_life_days, COALESCE(f.farm_name, fp.name) AS supplier_name FROM inventory i JOIN products p ON p.id = i.product_id LEFT JOIN farmers f ON f.user_id = i.farmer_user_id LEFT JOIN fpos fp ON fp.id = i.fpo_id WHERE ${conditions.join(" AND ")} ORDER BY i.created_at DESC`,
    values,
  );
  return result.rows;
}

async function createInventory(user, body) {
  requireRole(user, ["FARMER", "FPO"]);
  const quantity = parseNumber(body.total_quantity_kg, "total_quantity_kg", {
    positive: true,
  });
  const price = parseNumber(body.asking_price_per_kg, "asking_price_per_kg", {
    positive: true,
  });
  if (!body.product_id || !body.harvest_date)
    throw httpError("product_id and harvest_date are required");
  const farmerId = user.role === "FARMER" ? user.id : null;
  const fpoId = user.role === "FPO" ? body.fpo_id : null;
  if (user.role === "FPO" && !fpoId)
    throw httpError("fpo_id is required for FPO inventory");

  if (user.role === "FARMER") {
    await pool.query(
      `INSERT INTO farmers (user_id, farm_name, village, district, state)
       VALUES ($1, $2, 'Patna Village', 'Patna', 'Bihar')
       ON CONFLICT (user_id) DO NOTHING`,
      [user.id, `${user.name || "Farmer"}'s Farm`]
    );
  }
  const result = await pool.query(
    `INSERT INTO inventory (id, farmer_user_id, fpo_id, product_id, total_quantity_kg, available_quantity_kg, asking_price_per_kg, quality_grade, harvest_date, available_from, latitude, longitude, region) VALUES ($1, $2, $3, $4, $5, $5, $6, $7, $8, COALESCE($9::date, CURRENT_DATE), $10, $11, $12) RETURNING *`,
    [
      crypto.randomUUID(),
      farmerId,
      fpoId,
      body.product_id,
      quantity,
      price,
      body.quality_grade || "A",
      body.harvest_date,
      body.available_from || null,
      body.latitude || null,
      body.longitude || null,
      body.region || null,
    ],
  );
  return result.rows[0];
}

async function getInventoryItem(user, id) {
  const result = await pool.query("SELECT * FROM inventory WHERE id = $1", [
    id,
  ]);
  if (!result.rows[0]) throw httpError("Inventory item not found", 404);
  if (user.role === "FARMER" && result.rows[0].farmer_user_id !== user.id)
    throw httpError("You cannot access this inventory item", 403);
  return result.rows[0];
}

async function createProcurement(user, body) {
  requireRole(user, ["BUYER"]);
  const quantity = parseNumber(
    body.requested_quantity_kg,
    "requested_quantity_kg",
    { positive: true },
  );
  if (
    !body.product_id ||
    !body.required_by ||
    !body.destination_name ||
    !body.destination_region
  )
    throw httpError(
      "product_id, required_by, destination_name, and destination_region are required",
    );

  if (user.role === "BUYER") {
    await pool.query(
      `INSERT INTO buyers (user_id, organization_name, buyer_type, destination_name, region)
       VALUES ($1, $2, 'RETAILER', $3, $4)
       ON CONFLICT (user_id) DO NOTHING`,
      [user.id, `${user.name || "Buyer"} Org`, body.destination_name, body.destination_region]
    );
  }
  const result = await pool.query(
    `INSERT INTO procurement_requests (id, buyer_user_id, product_id, requested_quantity_kg, max_price_per_kg, quality_requirement, required_by, destination_name, destination_region, destination_latitude, destination_longitude) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
    [
      crypto.randomUUID(),
      user.id,
      body.product_id,
      quantity,
      body.max_price_per_kg || null,
      body.quality_requirement || "B",
      body.required_by,
      body.destination_name,
      body.destination_region,
      body.destination_latitude,
      body.destination_longitude,
    ],
  );
  return result.rows[0];
}

async function listProcurement(user) {
  requireRole(user, ["BUYER"]);
  const result = await pool.query(
    "SELECT r.*, p.name AS product_name FROM procurement_requests r JOIN products p ON p.id = r.product_id WHERE r.buyer_user_id = $1 ORDER BY r.created_at DESC",
    [user.id],
  );
  return result.rows;
}

async function getProcurement(user, id) {
  const result = await pool.query(
    "SELECT r.*, p.name AS product_name FROM procurement_requests r JOIN products p ON p.id = r.product_id WHERE r.id = $1",
    [id],
  );
  if (!result.rows[0]) throw httpError("Procurement request not found", 404);
  if (user.role === "BUYER" && result.rows[0].buyer_user_id !== user.id)
    throw httpError("You cannot access this procurement request", 403);
  return result.rows[0];
}

async function matchProcurement(user, id) {
  const request = await getProcurement(user, id);
  requireRole(user, ["BUYER"]);
  const inventory = await listInventory(
    { role: "ADMIN", id: user.id },
    { product: request.product_name, region: request.destination_region },
  );
  const payload = {
    requirement: {
      product: request.product_name,
      required_quantity_kg: Number(request.requested_quantity_kg),
      region: request.destination_region,
      buyer_location: {
        latitude: Number(request.destination_latitude),
        longitude: Number(request.destination_longitude),
      },
      required_by: request.required_by,
      minimum_quality: request.quality_requirement,
      max_budget_per_kg: request.max_price_per_kg
        ? Number(request.max_price_per_kg)
        : null,
    },
    custom_suppliers: inventory.map((item) => ({
      supplier_id: item.id,
      name: item.supplier_name || "KisanFlow supplier",
      supplier_type: item.fpo_id ? "FPO" : "Farmer",
      product: item.product_name,
      available_quantity_kg: Number(item.available_quantity_kg),
      price_per_kg: Number(item.asking_price_per_kg),
      latitude: Number(item.latitude),
      longitude: Number(item.longitude),
      quality_grade: item.quality_grade,
      reliability_score: 0.85,
      freshness_days: Math.max(
        0,
        Math.floor(
          (Date.now() - new Date(item.harvest_date).getTime()) / 86400000,
        ),
      ),
      wastage_risk_score: 0.1,
    })),
  };
  let matched;
  try {
    const response = await fetch(
      `${process.env.AI_SERVICE_URL || "http://localhost:8000"}/match-suppliers`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    if (!response.ok) throw new Error("AI matching service unavailable");
    matched = await response.json();
  } catch (_error) {
    throw httpError(
      "Supplier matching is temporarily unavailable. Start the AI service and try again.",
      503,
    );
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "DELETE FROM procurement_allocations WHERE procurement_request_id = $1 AND status = 'PROPOSED'",
      [id],
    );
    for (const allocation of matched.selected_suppliers)
      await client.query(
        "INSERT INTO procurement_allocations (id, procurement_request_id, inventory_id, supplier_user_id, fpo_id, allocated_quantity_kg, price_per_kg, matching_score, distance_km, matching_reasons) SELECT $1, $2, i.id, i.farmer_user_id, i.fpo_id, $3, $4, $5, $6, $7 FROM inventory i WHERE i.id = $8",
        [
          crypto.randomUUID(),
          id,
          allocation.allocated_quantity_kg,
          allocation.price_per_kg,
          allocation.score,
          allocation.distance_km,
          JSON.stringify(allocation.reasons),
          allocation.supplier_id,
        ],
      );
    await client.query(
      "UPDATE procurement_requests SET status = 'MATCHED', updated_at = NOW() WHERE id = $1",
      [id],
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
  return matched;
}

async function optimizeAllocation(user, id) {
  const request = await getProcurement(user, id);
  requireRole(user, ["BUYER", "FPO", "ADMIN"]);
  const inventory = await listInventory(user, { product: request.product_name });

  const payload = {
    product_name: request.product_name,
    demand_quantity_kg: Number(request.requested_quantity_kg),
    max_price_per_kg: request.max_price_per_kg ? Number(request.max_price_per_kg) : null,
    quality_requirement: request.quality_requirement || "B",
    required_by: request.required_by,
    destination: {
      latitude: Number(request.destination_latitude),
      longitude: Number(request.destination_longitude),
      name: request.destination_name
    },
    candidates: inventory.map((item) => ({
      supplier_id: item.id,
      name: item.supplier_name || "KisanFlow supplier",
      supplier_type: item.fpo_id ? "FPO" : "Farmer",
      available_quantity_kg: Number(item.available_quantity_kg),
      price_per_kg: Number(item.asking_price_per_kg),
      quality_grade: item.quality_grade,
      latitude: Number(item.latitude),
      longitude: Number(item.longitude),
      reliability_score: 0.85,
      freshness_days: Math.max(
        0,
        Math.floor((Date.now() - new Date(item.harvest_date).getTime()) / 86400000)
      ),
      shelf_life_days: Number(item.shelf_life_days) || 7
    }))
  };

  const aiService = require("./ai.service");
  return aiService.optimizeAllocation(payload);
}

async function confirmProcurement(user, id) {
  const request = await getProcurement(user, id);
  requireRole(user, ["BUYER"]);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const allocations = await client.query(
      "SELECT a.*, i.available_quantity_kg FROM procurement_allocations a JOIN inventory i ON i.id = a.inventory_id WHERE a.procurement_request_id = $1 AND a.status = 'PROPOSED' FOR UPDATE OF i",
      [id],
    );
    if (!allocations.rows.length)
      throw httpError(
        "No proposed allocations found. Match the request first",
        409,
      );
    for (const allocation of allocations.rows)
      if (
        Number(allocation.available_quantity_kg) <
        Number(allocation.allocated_quantity_kg)
      )
        throw httpError("Inventory changed; rematch this request", 409);
    for (const allocation of allocations.rows) {
      await client.query(
        "UPDATE inventory SET available_quantity_kg = available_quantity_kg - $1, reserved_quantity_kg = reserved_quantity_kg + $1, updated_at = NOW() WHERE id = $2",
        [allocation.allocated_quantity_kg, allocation.inventory_id],
      );
      await client.query(
        "UPDATE procurement_allocations SET status = 'CONFIRMED' WHERE id = $1",
        [allocation.id],
      );
      const orderId = crypto.randomUUID();
      await client.query(
        "INSERT INTO orders (id, procurement_request_id, buyer_user_id, supplier_user_id, fpo_id, status, total_amount) VALUES ($1, $2, $3, $4, $5, 'CONFIRMED', $6)",
        [
          orderId,
          id,
          user.id,
          allocation.supplier_user_id,
          allocation.fpo_id,
          Number(allocation.allocated_quantity_kg) *
            Number(allocation.price_per_kg),
        ],
      );
      await client.query(
        "INSERT INTO order_items (id, order_id, inventory_id, product_id, quantity_kg, price_per_kg) VALUES ($1, $2, $3, $4, $5, $6)",
        [
          crypto.randomUUID(),
          orderId,
          allocation.inventory_id,
          request.product_id,
          allocation.allocated_quantity_kg,
          allocation.price_per_kg,
        ],
      );
      await client.query(
        "INSERT INTO deliveries (id, order_id, status, expected_delivery) VALUES ($1, $2, 'PICKUP_PENDING', $3)",
        [crypto.randomUUID(), orderId, request.required_by],
      );
    }
    await client.query(
      "UPDATE procurement_requests SET status = 'CONFIRMED', updated_at = NOW() WHERE id = $1",
      [id],
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
  return { procurement_request_id: id, status: "CONFIRMED" };
}

async function listOrders(user) {
  let query = `
    SELECT DISTINCT o.*, d.status AS delivery_status, d.expected_delivery
    FROM orders o
    LEFT JOIN deliveries d ON d.order_id = o.id
  `;
  let params = [];

  if (user.role === "BUYER" || user.role === "CONSUMER") {
    query += " WHERE o.buyer_user_id = $1";
    params.push(user.id);
  } else if (user.role === "FARMER") {
    query += ` WHERE o.supplier_user_id = $1 OR o.id IN (SELECT oi.order_id FROM order_items oi JOIN inventory i ON i.id = oi.inventory_id WHERE i.farmer_user_id = $1)`;
    params.push(user.id);
  } else if (user.role === "FPO") {
    query += ` WHERE o.fpo_id = $1 OR o.supplier_user_id = $1 OR o.id IN (SELECT oi.order_id FROM order_items oi JOIN inventory i ON i.id = oi.inventory_id WHERE i.fpo_id = $1)`;
    params.push(user.id);
  } else if (user.role === "ADMIN") {
    // No WHERE clause needed for admin
  } else {
    throw httpError("Orders are not available for this role", 403);
  }

  query += " ORDER BY o.created_at DESC";

  const result = await pool.query(query, params);
  return result.rows;
}

async function updateDelivery(user, orderId, status, exceptionReason) {
  requireRole(user, ["FARMER", "BUYER", "CONSUMER", "FPO", "ADMIN"]);
  if (
    ![
      "PICKUP_PENDING",
      "PICKED_UP",
      "IN_TRANSIT",
      "DELIVERED",
      "EXCEPTION",
    ].includes(status)
  )
    throw httpError("Invalid delivery status");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const result = await client.query(
      `SELECT o.*, d.id AS delivery_id
       FROM orders o
       JOIN deliveries d ON d.order_id = o.id
       WHERE o.id = $1
         AND (
           o.buyer_user_id = $2
           OR o.supplier_user_id = $2
           OR o.fpo_id = $2
           OR $3::text = 'ADMIN'
           OR o.id IN (
             SELECT oi.order_id
             FROM order_items oi
             JOIN inventory i ON i.id = oi.inventory_id
             WHERE i.farmer_user_id = $2 OR i.fpo_id = $2
           )
         )`,
      [orderId, user.id, user.role],
    );
    if (!result.rows[0]) throw httpError("Order not found", 404);

    await client.query(
      "UPDATE deliveries SET status = $1::text, exception_reason = $2, actual_delivery = CASE WHEN $1::text = 'DELIVERED' THEN NOW() ELSE actual_delivery END, updated_at = NOW() WHERE id = $3",
      [status, exceptionReason || null, result.rows[0].delivery_id],
    );

    const orderStatus =
      status === "DELIVERED"
        ? "DELIVERED"
        : status === "IN_TRANSIT"
          ? "IN_TRANSIT"
          : status === "PICKED_UP"
            ? "PICKUP_SCHEDULED"
            : result.rows[0].status;

    await client.query(
      "UPDATE orders SET status = $1::text, updated_at = NOW() WHERE id = $2",
      [orderStatus, orderId],
    );

    // If status becomes EXCEPTION (e.g. cancelled/delivery failed), release reserved inventory back
    if (status === "EXCEPTION") {
      const items = await client.query(
        "SELECT inventory_id, quantity_kg FROM order_items WHERE order_id = $1",
        [orderId],
      );
      for (const item of items.rows) {
        await client.query(
          "UPDATE inventory SET reserved_quantity_kg = GREATEST(0, reserved_quantity_kg - $1), available_quantity_kg = available_quantity_kg + $1, updated_at = NOW() WHERE id = $2",
          [item.quantity_kg, item.inventory_id],
        );
      }
    }

    await client.query("COMMIT");

    return {
      order_id: orderId,
      delivery_status: status,
      order_status: orderStatus,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function optimizeProcurement(user, id) {
  const request = await getProcurement(user, id);
  requireRole(user, ["BUYER"]);
  const result = await pool.query(
    `SELECT o.id AS order_id, oi.quantity_kg, i.latitude, i.longitude,
       COALESCE(f.farm_name, fp.name) AS supplier_name
     FROM orders o JOIN order_items oi ON oi.order_id = o.id JOIN inventory i ON i.id = oi.inventory_id
     LEFT JOIN farmers f ON f.user_id = i.farmer_user_id LEFT JOIN fpos fp ON fp.id = i.fpo_id
     WHERE o.procurement_request_id = $1 AND o.status <> 'CANCELLED'`,
    [id],
  );
  if (!result.rows.length)
    throw httpError(
      "Confirm the procurement request before planning a route",
      409,
    );
  let optimized;
  try {
    const response = await fetch(
      `${process.env.AI_SERVICE_URL || "http://localhost:8000"}/optimize-route`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          depot_coordinates: {
            latitude: Number(request.destination_latitude),
            longitude: Number(request.destination_longitude),
          },
          depot_name: request.destination_name,
          pickups: result.rows.map((row) => ({
            supplier_id: row.order_id,
            name: row.supplier_name || "Supplier",
            latitude: Number(row.latitude),
            longitude: Number(row.longitude),
            quantity_kg: Number(row.quantity_kg),
          })),
          vehicle_capacity_kg: 5000,
          fleet_size: 4,
        }),
      },
    );
    if (!response.ok) throw new Error("AI route service unavailable");
    optimized = await response.json();
  } catch (_error) {
    throw httpError(
      "Route optimization is temporarily unavailable. Start the AI service and try again.",
      503,
    );
  }
  const comparison = optimized.baseline_comparison || {};
  const routeId = crypto.randomUUID();
  await pool.query(
    "INSERT INTO routes (id, procurement_request_id, status, total_distance_km, estimated_time_hours, estimated_cost, baseline_cost, savings, optimizer_payload) VALUES ($1, $2, 'PLANNED', $3, $4, $5, $6, $7, $8)",
    [
      routeId,
      id,
      optimized.total_distance_km,
      optimized.total_travel_time_hours || 0,
      optimized.total_transport_cost_inr,
      comparison.baseline_cost_inr || 0,
      comparison.cost_saved_inr || 0,
      JSON.stringify(optimized),
    ],
  );
  for (const route of optimized.routes || [])
    for (const stop of route.stops || []) {
      await pool.query(
        "INSERT INTO route_stops (id, route_id, order_id, stop_sequence, stop_type, name, latitude, longitude, quantity_kg) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
        [
          crypto.randomUUID(),
          routeId,
          stop.node_id === "depot_start" || stop.node_id === "depot_end"
            ? null
            : stop.node_id,
          stop.sequence,
          stop.stop_type.toUpperCase(),
          stop.name,
          stop.latitude,
          stop.longitude,
          stop.pickup_quantity_kg || 0,
        ],
      );
    }
  await pool.query(
    "UPDATE procurement_requests SET status = 'PICKUP_SCHEDULED', updated_at = NOW() WHERE id = $1",
    [id],
  );
  return { route_id: routeId, ...optimized };
}

async function getImpact(user) {
  requireRole(user, ["FARMER", "BUYER", "ADMIN"]);
  const result = await pool.query(
    "SELECT COALESCE(SUM(r.savings), 0) AS logistics_savings, COALESCE(SUM(r.total_distance_km), 0) AS optimized_km, COALESCE(SUM((r.optimizer_payload->'baseline_comparison'->>'baseline_distance_km')::numeric), 0) AS baseline_km, COALESCE(SUM(r.baseline_cost), 0) AS baseline_cost, COALESCE(SUM(r.estimated_cost), 0) AS optimized_cost, COUNT(DISTINCT o.id) AS confirmed_orders FROM routes r LEFT JOIN procurement_requests pr ON pr.id = r.procurement_request_id LEFT JOIN orders o ON o.procurement_request_id = pr.id WHERE ($1 = 'ADMIN' OR pr.buyer_user_id = $2)",
    [user.role, user.id],
  );
  const row = result.rows[0];
  return {
    ...row,
    kilometers_saved: Math.max(
      0,
      Number(row.baseline_km) - Number(row.optimized_km),
    ),
    demo_label:
      "Calculated from confirmed routes; values are zero until a route is planned.",
  };
}

module.exports = {
  getFarmer,
  saveFarmer,
  getBuyer,
  saveBuyer,
  listInventory,
  createInventory,
  getInventoryItem,
  createProcurement,
  listProcurement,
  getProcurement,
  matchProcurement,
  optimizeAllocation,
  confirmProcurement,
  listOrders,
  updateDelivery,
  optimizeProcurement,
  getImpact,
};
