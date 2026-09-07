const db = require("../config/db");

class OrderService {
  /**
   * Create an order atomically, inserting order items and deducting inventory available quantity
   */
  async createOrder({ buyer_id, delivery_address, delivery_preference = "Standard Transit", items = [] }) {
    if (!buyer_id || !items || items.length === 0) {
      throw new Error("buyer_id and at least one order item are required");
    }

    const client = await db.pool.connect();

    try {
      await client.query("BEGIN");

      // 1. Calculate total and verify inventory
      let totalAmount = 0;
      const verifiedItems = [];

      for (const item of items) {
        const { inventory_id, quantity } = item;
        const invRes = await client.query(
          "SELECT id, product_id, available_quantity, price_per_unit FROM inventory WHERE id = $1 FOR UPDATE",
          [inventory_id]
        );

        if (invRes.rows.length === 0) {
          throw new Error(`Inventory item '${inventory_id}' not found`);
        }

        const inv = invRes.rows[0];
        const numQty = parseFloat(quantity);
        const availQty = parseFloat(inv.available_quantity);

        if (numQty <= 0) {
          throw new Error(`Invalid quantity ${numQty} for item`);
        }

        if (availQty < numQty) {
          throw new Error(`Insufficient stock for inventory '${inventory_id}'. Requested: ${numQty}, Available: ${availQty}`);
        }

        const pricePerUnit = parseFloat(inv.price_per_unit);
        const subtotal = numQty * pricePerUnit;
        totalAmount += subtotal;

        verifiedItems.push({
          inventory_id: inv.id,
          product_id: inv.product_id,
          quantity: numQty,
          price_per_unit: pricePerUnit,
          subtotal,
        });
      }

      // 2. Insert into orders table
      const orderInsertRes = await client.query(
        `INSERT INTO orders (
          buyer_id, order_status, delivery_address, delivery_preference, total_amount, payment_status
        ) VALUES ($1, 'confirmed', $2, $3, $4, 'paid')
        RETURNING *`,
        [buyer_id, delivery_address, delivery_preference, totalAmount]
      );
      const order = orderInsertRes.rows[0];

      // 3. Insert order items & deduct available quantity
      const createdItems = [];
      for (const item of verifiedItems) {
        const itemRes = await client.query(
          `INSERT INTO order_items (
            order_id, inventory_id, product_id, quantity, price_per_unit, subtotal
          ) VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *`,
          [order.id, item.inventory_id, item.product_id, item.quantity, item.price_per_unit, item.subtotal]
        );
        createdItems.push(itemRes.rows[0]);

        // Deduct inventory
        await client.query(
          "UPDATE inventory SET available_quantity = available_quantity - $1, updated_at = NOW() WHERE id = $2",
          [item.quantity, item.inventory_id]
        );
      }

      await client.query("COMMIT");

      order.items = createdItems;
      return order;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Fetch all orders with items joined
   */
  async getAllOrders({ buyer_id, status } = {}) {
    let query = `
      SELECT 
        o.id,
        o.buyer_id,
        b.business_name,
        p.full_name AS buyer_name,
        p.phone AS buyer_phone,
        o.order_status,
        o.delivery_address,
        o.delivery_preference,
        o.total_amount,
        o.payment_status,
        o.created_at,
        o.updated_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id', oi.id,
              'product_id', oi.product_id,
              'product_name', pr.name,
              'category', pr.category,
              'unit', pr.unit,
              'quantity', oi.quantity,
              'price_per_unit', oi.price_per_unit,
              'subtotal', oi.subtotal,
              'inventory_id', oi.inventory_id
            )
          ) FILTER (WHERE oi.id IS NOT NULL), '[]'
        ) AS items
      FROM orders o
      JOIN buyers b ON o.buyer_id = b.id
      JOIN profiles p ON b.profile_id = p.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products pr ON oi.product_id = pr.id
      WHERE 1=1
    `;
    const params = [];

    if (buyer_id) {
      params.push(buyer_id);
      query += ` AND o.buyer_id = $${params.length}`;
    }

    if (status) {
      params.push(status);
      query += ` AND o.order_status = $${params.length}`;
    }

    query += ` GROUP BY o.id, b.business_name, p.full_name, p.phone ORDER BY o.created_at DESC`;

    const result = await db.query(query, params);
    return result.rows;
  }

  /**
   * Fetch single order by ID with line items
   */
  async getOrderById(id) {
    const query = `
      SELECT 
        o.id,
        o.buyer_id,
        b.business_name,
        p.full_name AS buyer_name,
        p.phone AS buyer_phone,
        o.order_status,
        o.delivery_address,
        o.delivery_preference,
        o.total_amount,
        o.payment_status,
        o.created_at,
        o.updated_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id', oi.id,
              'product_id', oi.product_id,
              'product_name', pr.name,
              'category', pr.category,
              'unit', pr.unit,
              'quantity', oi.quantity,
              'price_per_unit', oi.price_per_unit,
              'subtotal', oi.subtotal,
              'inventory_id', oi.inventory_id
            )
          ) FILTER (WHERE oi.id IS NOT NULL), '[]'
        ) AS items
      FROM orders o
      JOIN buyers b ON o.buyer_id = b.id
      JOIN profiles p ON b.profile_id = p.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products pr ON oi.product_id = pr.id
      WHERE o.id = $1
      GROUP BY o.id, b.business_name, p.full_name, p.phone
    `;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Update order status
   */
  async updateOrderStatus(id, { order_status, payment_status }) {
    const existing = await this.getOrderById(id);
    if (!existing) return null;

    const newStatus = order_status || existing.order_status;
    const newPayment = payment_status || existing.payment_status;

    const query = `
      UPDATE orders
      SET order_status = $1, payment_status = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `;
    const result = await db.query(query, [newStatus, newPayment, id]);
    return result.rows[0];
  }
}

module.exports = new OrderService();
