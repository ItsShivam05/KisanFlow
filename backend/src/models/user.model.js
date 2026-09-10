const crypto = require("crypto");
const { pool } = require("../config/database");

const UserRole = Object.freeze({
  FARMER: "FARMER",
  FPO: "FPO",
  BUYER: "BUYER",
  CONSUMER: "CONSUMER",
  ADMIN: "ADMIN"
});

class User {
  constructor({ id, name, email, passwordHash, role, createdAt }) {
    this.id = id;
    this.name = name;
    this.email = email.toLowerCase();
    this.passwordHash = passwordHash;
    this.role = role;
    this.createdAt = createdAt;
  }

  toSafeObject() {
    const { passwordHash, ...safeUser } = this;
    return safeUser;
  }

  static fromRow(row) {
    return new User({
      id: row.id,
      name: row.name,
      email: row.email,
      passwordHash: row.password_hash,
      role: row.role,
      createdAt: row.created_at
    });
  }

  static async create({ name, email, passwordHash, role }) {
    const id = crypto.randomUUID();
    const result = await pool.query(
      `INSERT INTO users (id, name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, password_hash, role, created_at`,
      [id, name, email.toLowerCase(), passwordHash, role]
    );
    return User.fromRow(result.rows[0]);
  }

  static async findByEmail(email) {
    const result = await pool.query(
      "SELECT id, name, email, password_hash, role, created_at FROM users WHERE email = $1",
      [email.toLowerCase()]
    );
    return result.rows[0] ? User.fromRow(result.rows[0]) : null;
  }

  static async findById(id) {
    const result = await pool.query(
      "SELECT id, name, email, password_hash, role, created_at FROM users WHERE id = $1",
      [id]
    );
    return result.rows[0] ? User.fromRow(result.rows[0]) : null;
  }
}

module.exports = { User, UserRole };
