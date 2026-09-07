const db = require("../config/db");

class FarmerService {
  /**
   * Aggregate farmer dashboard metrics
   */
  async getFarmerDashboard(farmerId) {
    // 1. Farmer profile & acreage
    const farmerRes = await db.query(
      `SELECT f.*, p.full_name, p.phone, p.role 
       FROM farmers f 
       JOIN profiles p ON f.profile_id = p.id 
       WHERE f.id = $1`,
      [farmerId]
    );

    if (farmerRes.rows.length === 0) {
      return null;
    }
    const farmer = farmerRes.rows[0];

    // 2. Inventory stats
    const invRes = await db.query(
      `SELECT 
        COUNT(id) AS total_lots,
        COALESCE(SUM(quantity), 0) AS total_quantity,
        COALESCE(SUM(available_quantity), 0) AS total_available,
        COALESCE(SUM(available_quantity * price_per_unit), 0) AS total_stock_value
       FROM inventory 
       WHERE farmer_id = $1`,
      [farmerId]
    );
    const invStats = invRes.rows[0];

    // 3. Orders & Earnings stats
    const orderStatsRes = await db.query(
      `SELECT 
        COUNT(DISTINCT o.id) AS total_orders,
        COUNT(DISTINCT CASE WHEN o.order_status IN ('pending', 'confirmed', 'processing') THEN o.id END) AS pending_orders,
        COUNT(DISTINCT CASE WHEN o.order_status = 'delivered' THEN o.id END) AS fulfilled_orders,
        COALESCE(SUM(oi.subtotal), 0) AS total_earnings
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       JOIN inventory i ON oi.inventory_id = i.id
       WHERE i.farmer_id = $1`,
      [farmerId]
    );
    const orderStats = orderStatsRes.rows[0];

    // 4. Recent orders for this farmer
    const recentOrdersRes = await db.query(
      `SELECT 
        o.id AS order_id,
        o.order_status,
        o.created_at,
        p.name AS product_name,
        oi.quantity,
        p.unit,
        oi.subtotal,
        b.business_name AS buyer_business
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       JOIN inventory i ON oi.inventory_id = i.id
       JOIN products p ON oi.product_id = p.id
       JOIN buyers b ON o.buyer_id = b.id
       WHERE i.farmer_id = $1
       ORDER BY o.created_at DESC
       LIMIT 5`,
      [farmerId]
    );

    return {
      farmer,
      metrics: {
        totalLots: parseInt(invStats.total_lots, 10),
        totalAvailableQty: parseFloat(invStats.total_available),
        totalStockValue: parseFloat(invStats.total_stock_value),
        totalOrders: parseInt(orderStats.total_orders, 10),
        pendingOrders: parseInt(orderStats.pending_orders, 10),
        fulfilledOrders: parseInt(orderStats.fulfilled_orders, 10),
        totalEarnings: parseFloat(orderStats.total_earnings),
      },
      recentOrders: recentOrdersRes.rows,
    };
  }

  async getFarmerInventory(farmerId) {
    const res = await db.query(
      `SELECT 
        i.*,
        p.name AS product_name,
        p.category,
        p.unit
       FROM inventory i
       JOIN products p ON i.product_id = p.id
       WHERE i.farmer_id = $1
       ORDER BY i.created_at DESC`,
      [farmerId]
    );
    return res.rows;
  }

  async getFarmerOrders(farmerId) {
    const res = await db.query(
      `SELECT 
        o.id,
        o.order_status,
        o.payment_status,
        o.delivery_address,
        o.created_at,
        p.name AS product_name,
        p.category,
        p.unit,
        oi.quantity,
        oi.price_per_unit,
        oi.subtotal,
        b.business_name AS buyer_name,
        b_prof.phone AS buyer_phone
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       JOIN inventory i ON oi.inventory_id = i.id
       JOIN products p ON oi.product_id = p.id
       JOIN buyers b ON o.buyer_id = b.id
       JOIN profiles b_prof ON b.profile_id = b_prof.id
       WHERE i.farmer_id = $1
       ORDER BY o.created_at DESC`,
      [farmerId]
    );
    return res.rows;
  }

  async getFarmerProfile(farmerId) {
    const res = await db.query(
      `SELECT f.*, p.full_name, p.phone, p.role
       FROM farmers f
       JOIN profiles p ON f.profile_id = p.id
       WHERE f.id = $1`,
      [farmerId]
    );
    return res.rows[0] || null;
  }

  async updateFarmerProfile(farmerId, { farm_name, farm_size_acres, address, phone, full_name }) {
    const farmerRes = await db.query("SELECT profile_id FROM farmers WHERE id = $1", [farmerId]);
    if (farmerRes.rows.length === 0) return null;

    const profileId = farmerRes.rows[0].profile_id;

    if (farm_name !== undefined || farm_size_acres !== undefined || address !== undefined) {
      await db.query(
        `UPDATE farmers 
         SET farm_name = COALESCE($1, farm_name), 
             farm_size_acres = COALESCE($2, farm_size_acres), 
             address = COALESCE($3, address), 
             updated_at = NOW() 
         WHERE id = $4`,
        [farm_name, farm_size_acres, address, farmerId]
      );
    }

    if (phone !== undefined || full_name !== undefined) {
      await db.query(
        `UPDATE profiles 
         SET full_name = COALESCE($1, full_name), 
             phone = COALESCE($2, phone), 
             updated_at = NOW() 
         WHERE id = $3`,
        [full_name, phone, profileId]
      );
    }

    return this.getFarmerProfile(farmerId);
  }
}

module.exports = new FarmerService();
