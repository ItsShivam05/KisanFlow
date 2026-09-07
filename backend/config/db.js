const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.on("connect", () => {
  console.log("Connected to Neon PostgreSQL Database 🐘");
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle PostgreSQL client:", err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
