const db = require("../config/db");

/**
 * Service to handle Product database operations with parameterized queries
 */
class ProductService {
  /**
   * Fetch all products with optional search and category filters
   */
  async getAllProducts({ search, category } = {}) {
    let query = `
      SELECT id, name, category, description, unit, created_at, updated_at
      FROM products
      WHERE 1=1
    `;
    const params = [];

    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      query += ` AND (name ILIKE $${params.length} OR description ILIKE $${params.length})`;
    }

    if (category && category.trim()) {
      params.push(category.trim());
      query += ` AND category ILIKE $${params.length}`;
    }

    query += ` ORDER BY created_at DESC`;

    const result = await db.query(query, params);
    return result.rows;
  }

  /**
   * Fetch a single product by UUID
   */
  async getProductById(id) {
    const query = `
      SELECT id, name, category, description, unit, created_at, updated_at
      FROM products
      WHERE id = $1
    `;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Create a new product
   */
  async createProduct({ name, category = null, description = null, unit = "kg" }) {
    const query = `
      INSERT INTO products (name, category, description, unit)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, category, description, unit, created_at, updated_at
    `;
    const params = [name.trim(), category ? category.trim() : null, description ? description.trim() : null, unit ? unit.trim() : "kg"];
    const result = await db.query(query, params);
    return result.rows[0];
  }

  /**
   * Update an existing product
   */
  async updateProduct(id, updates) {
    // First verify existence
    const existing = await this.getProductById(id);
    if (!existing) {
      return null;
    }

    const name = updates.name !== undefined ? (updates.name ? updates.name.trim() : existing.name) : existing.name;
    const category = updates.category !== undefined ? (updates.category ? updates.category.trim() : null) : existing.category;
    const description = updates.description !== undefined ? (updates.description ? updates.description.trim() : null) : existing.description;
    const unit = updates.unit !== undefined ? (updates.unit ? updates.unit.trim() : "kg") : existing.unit;

    const query = `
      UPDATE products
      SET name = $1, category = $2, description = $3, unit = $4, updated_at = NOW()
      WHERE id = $5
      RETURNING id, name, category, description, unit, created_at, updated_at
    `;
    const result = await db.query(query, [name, category, description, unit, id]);
    return result.rows[0];
  }

  /**
   * Delete a product by UUID
   */
  async deleteProduct(id) {
    const query = `
      DELETE FROM products
      WHERE id = $1
      RETURNING id
    `;
    const result = await db.query(query, [id]);
    return result.rowCount > 0;
  }
}

module.exports = new ProductService();
