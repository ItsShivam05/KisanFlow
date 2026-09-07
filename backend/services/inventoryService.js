const db = require("../config/db");

class InventoryService {
  /**
   * Fetch all inventory items joined with product and supplier details
   */
  async getAllInventory({ search, category, inStockOnly } = {}) {
    let query = `
      SELECT 
        i.id,
        i.product_id,
        p.name AS product_name,
        p.category,
        p.unit,
        p.description AS product_description,
        i.farmer_id,
        f.farm_name,
        f_prof.full_name AS farmer_name,
        i.fpo_id,
        fpo.fpo_name,
        i.quantity,
        i.available_quantity,
        i.price_per_unit,
        i.quality,
        i.harvest_date,
        i.available_from,
        i.available_until,
        i.created_at,
        i.updated_at
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      LEFT JOIN farmers f ON i.farmer_id = f.id
      LEFT JOIN profiles f_prof ON f.profile_id = f_prof.id
      LEFT JOIN fpos fpo ON i.fpo_id = fpo.id
      WHERE 1=1
    `;
    const params = [];

    if (inStockOnly) {
      query += ` AND i.available_quantity > 0`;
    }

    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      query += ` AND (p.name ILIKE $${params.length} OR i.quality ILIKE $${params.length} OR f.farm_name ILIKE $${params.length} OR fpo.fpo_name ILIKE $${params.length})`;
    }

    if (category && category.trim()) {
      params.push(category.trim());
      query += ` AND p.category ILIKE $${params.length}`;
    }

    query += ` ORDER BY i.created_at DESC`;

    const result = await db.query(query, params);
    return result.rows;
  }

  /**
   * Get single inventory batch details
   */
  async getInventoryById(id) {
    const query = `
      SELECT 
        i.id,
        i.product_id,
        p.name AS product_name,
        p.category,
        p.unit,
        p.description AS product_description,
        i.farmer_id,
        f.farm_name,
        f_prof.full_name AS farmer_name,
        f.address AS farm_address,
        i.fpo_id,
        fpo.fpo_name,
        i.quantity,
        i.available_quantity,
        i.price_per_unit,
        i.quality,
        i.harvest_date,
        i.available_from,
        i.available_until,
        i.created_at,
        i.updated_at
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      LEFT JOIN farmers f ON i.farmer_id = f.id
      LEFT JOIN profiles f_prof ON f.profile_id = f_prof.id
      LEFT JOIN fpos fpo ON i.fpo_id = fpo.id
      WHERE i.id = $1
    `;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Add new inventory lot
   */
  async createInventory({
    product_id,
    farmer_id = null,
    fpo_id = null,
    quantity,
    available_quantity,
    price_per_unit,
    quality = "Grade A",
    harvest_date = null,
    available_from = null,
    available_until = null,
  }) {
    // Constraint check: exactly one of farmer_id or fpo_id must be set
    if ((farmer_id && fpo_id) || (!farmer_id && !fpo_id)) {
      throw new Error("Inventory lot must belong to either a farmer OR an FPO (not both, not neither).");
    }

    const availQty = available_quantity !== undefined ? available_quantity : quantity;

    const query = `
      INSERT INTO inventory (
        product_id, farmer_id, fpo_id, quantity, available_quantity,
        price_per_unit, quality, harvest_date, available_from, available_until
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    const params = [
      product_id,
      farmer_id,
      fpo_id,
      quantity,
      availQty,
      price_per_unit,
      quality,
      harvest_date,
      available_from,
      available_until,
    ];

    const result = await db.query(query, params);
    return result.rows[0];
  }

  /**
   * Update inventory batch
   */
  async updateInventory(id, updates) {
    const existing = await this.getInventoryById(id);
    if (!existing) return null;

    const quantity = updates.quantity !== undefined ? updates.quantity : existing.quantity;
    const available_quantity = updates.available_quantity !== undefined ? updates.available_quantity : existing.available_quantity;
    const price_per_unit = updates.price_per_unit !== undefined ? updates.price_per_unit : existing.price_per_unit;
    const quality = updates.quality !== undefined ? updates.quality : existing.quality;

    const query = `
      UPDATE inventory
      SET quantity = $1, available_quantity = $2, price_per_unit = $3, quality = $4, updated_at = NOW()
      WHERE id = $5
      RETURNING *
    `;
    const result = await db.query(query, [quantity, available_quantity, price_per_unit, quality, id]);
    return result.rows[0];
  }

  /**
   * Delete inventory batch
   */
  async deleteInventory(id) {
    const query = `DELETE FROM inventory WHERE id = $1 RETURNING id`;
    const result = await db.query(query, [id]);
    return result.rowCount > 0;
  }
}

module.exports = new InventoryService();
