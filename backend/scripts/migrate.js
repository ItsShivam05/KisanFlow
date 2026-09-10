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
  console.log("Database migration completed.");
}

migrate()
  .catch((error) => { console.error("Migration failed:", error.message); process.exitCode = 1; })
  .finally(() => pool.end());
