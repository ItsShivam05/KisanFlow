const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "kisanflow_secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

class AuthService {
  /**
   * Register a new user (farmer, buyer, or consumer)
   * Creates a profile + role-specific record in one transaction
   */
  async register({ full_name, phone, email, password, role, extra }) {
    // 1. Check if email already registered (we store it in auth_user_id as "email:xxx")
    const existing = await db.query(
      "SELECT id FROM profiles WHERE auth_user_id = $1",
      [`email:${email}`]
    );
    if (existing.rowCount > 0) {
      throw new Error("An account with this email already exists.");
    }

    // 2. Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // 3. Insert profile
    const profileRes = await db.query(
      `INSERT INTO profiles (auth_user_id, full_name, phone, role, password_hash)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, full_name, phone, role`,
      [`email:${email}`, full_name, phone || null, role, password_hash]
    );
    const profile = profileRes.rows[0];

    // 4. Insert role-specific record
    if (role === "farmer") {
      await db.query(
        `INSERT INTO farmers (profile_id, farm_name, farm_size_acres, address, verification_status)
         VALUES ($1, $2, $3, $4, 'pending')`,
        [
          profile.id,
          extra?.farm_name || `${full_name}'s Farm`,
          extra?.farm_size_acres || 0,
          extra?.address || "",
        ]
      );
    } else if (role === "buyer") {
      await db.query(
        `INSERT INTO buyers (profile_id, business_name, buyer_type, address)
         VALUES ($1, $2, $3, $4)`,
        [
          profile.id,
          extra?.business_name || full_name,
          extra?.buyer_type || "retailer",
          extra?.address || "",
        ]
      );
    }
    // consumer role — profile is enough

    // 5. Generate JWT
    const token = jwt.sign(
      { profileId: profile.id, role: profile.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return {
      token,
      user: {
        id: profile.id,
        full_name: profile.full_name,
        phone: profile.phone,
        role: profile.role,
        email,
      },
    };
  }

  /**
   * Login with email + password
   */
  async login({ email, password }) {
    const res = await db.query(
      `SELECT id, full_name, phone, role, password_hash
       FROM profiles
       WHERE auth_user_id = $1`,
      [`email:${email}`]
    );

    if (res.rowCount === 0) {
      throw new Error("No account found with this email.");
    }

    const profile = res.rows[0];

    if (!profile.password_hash) {
      throw new Error("This account was created without a password. Please contact support.");
    }

    const match = await bcrypt.compare(password, profile.password_hash);
    if (!match) {
      throw new Error("Incorrect password.");
    }

    // Fetch role-specific ID
    let roleEntityId = null;
    if (profile.role === "farmer") {
      const r = await db.query("SELECT id FROM farmers WHERE profile_id = $1", [profile.id]);
      roleEntityId = r.rows[0]?.id || null;
    } else if (profile.role === "buyer" || profile.role === "fpo") {
      const r = await db.query("SELECT id FROM buyers WHERE profile_id = $1", [profile.id]);
      roleEntityId = r.rows[0]?.id || null;
    }

    const token = jwt.sign(
      { profileId: profile.id, role: profile.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return {
      token,
      user: {
        id: profile.id,
        full_name: profile.full_name,
        phone: profile.phone,
        role: profile.role,
        email,
        roleEntityId,
      },
    };
  }

  /**
   * Get profile from token
   */
  async getMe(profileId) {
    const res = await db.query(
      "SELECT id, full_name, phone, role FROM profiles WHERE id = $1",
      [profileId]
    );
    if (res.rowCount === 0) return null;
    const profile = res.rows[0];

    let roleEntityId = null;
    if (profile.role === "farmer") {
      const r = await db.query("SELECT id, farm_name, farm_size_acres, address, verification_status FROM farmers WHERE profile_id = $1", [profileId]);
      roleEntityId = r.rows[0] || null;
    } else if (profile.role === "buyer") {
      const r = await db.query("SELECT id, business_name, buyer_type, address FROM buyers WHERE profile_id = $1", [profileId]);
      roleEntityId = r.rows[0] || null;
    }

    return { ...profile, roleData: roleEntityId };
  }
}

module.exports = new AuthService();
