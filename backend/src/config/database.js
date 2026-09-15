const path = require("path");
const { Pool } = require("pg");
const sqlite3 = require("sqlite3");

const isRemote =
  process.env.NODE_ENV === "production" ||
  process.env.DATABASE_URL?.includes("ssl") ||
  process.env.DATABASE_URL?.includes("neon.tech");

const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isRemote ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 5000,
});

let useLocalFallback = false;
let sqliteDb = null;

function getSqliteDb() {
  if (!sqliteDb) {
    const dbPath = path.join(__dirname, "../../kisanflow_local.sqlite");
    sqliteDb = new sqlite3.Database(dbPath);
    initSqliteSchema(sqliteDb);
  }
  return sqliteDb;
}

function initSqliteSchema(db) {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS farmers (
        user_id TEXT PRIMARY KEY,
        farm_name TEXT NOT NULL,
        phone TEXT,
        village TEXT,
        district TEXT,
        state TEXT,
        latitude REAL,
        longitude REAL,
        reliability_score REAL NOT NULL DEFAULT 0.8,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS fpos (
        id TEXT PRIMARY KEY,
        owner_user_id TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        registration_number TEXT,
        phone TEXT,
        region TEXT NOT NULL,
        latitude REAL,
        longitude REAL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS fpo_members (
        fpo_id TEXT NOT NULL,
        farmer_user_id TEXT NOT NULL,
        joined_at TEXT NOT NULL DEFAULT (datetime('now')),
        PRIMARY KEY (fpo_id, farmer_user_id)
      );
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS buyers (
        user_id TEXT PRIMARY KEY,
        organization_name TEXT NOT NULL,
        phone TEXT,
        buyer_type TEXT NOT NULL DEFAULT 'RETAILER',
        destination_name TEXT,
        region TEXT,
        latitude REAL,
        longitude REAL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        category TEXT NOT NULL DEFAULT 'VEGETABLE',
        unit TEXT NOT NULL DEFAULT 'kg',
        shelf_life_days INTEGER NOT NULL DEFAULT 7,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS inventory (
        id TEXT PRIMARY KEY,
        farmer_user_id TEXT,
        fpo_id TEXT,
        product_id TEXT NOT NULL,
        total_quantity_kg REAL NOT NULL,
        available_quantity_kg REAL NOT NULL,
        reserved_quantity_kg REAL NOT NULL DEFAULT 0,
        sold_quantity_kg REAL NOT NULL DEFAULT 0,
        unit TEXT NOT NULL DEFAULT 'kg',
        asking_price_per_kg REAL NOT NULL,
        quality_grade TEXT NOT NULL DEFAULT 'A',
        harvest_date TEXT NOT NULL,
        available_from TEXT NOT NULL DEFAULT (date('now')),
        latitude REAL,
        longitude REAL,
        region TEXT,
        status TEXT NOT NULL DEFAULT 'ACTIVE',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS procurement_requests (
        id TEXT PRIMARY KEY,
        buyer_user_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        requested_quantity_kg REAL NOT NULL,
        max_price_per_kg REAL,
        quality_requirement TEXT NOT NULL DEFAULT 'B',
        required_by TEXT NOT NULL,
        destination_name TEXT NOT NULL,
        destination_region TEXT NOT NULL,
        destination_latitude REAL NOT NULL,
        destination_longitude REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'PENDING',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS procurement_allocations (
        id TEXT PRIMARY KEY,
        procurement_request_id TEXT NOT NULL,
        inventory_id TEXT NOT NULL,
        supplier_user_id TEXT,
        fpo_id TEXT,
        allocated_quantity_kg REAL NOT NULL,
        price_per_kg REAL NOT NULL,
        matching_score REAL NOT NULL DEFAULT 0,
        distance_km REAL,
        matching_reasons TEXT NOT NULL DEFAULT '[]',
        status TEXT NOT NULL DEFAULT 'PROPOSED',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        procurement_request_id TEXT NOT NULL,
        buyer_user_id TEXT NOT NULL,
        supplier_user_id TEXT,
        fpo_id TEXT,
        status TEXT NOT NULL DEFAULT 'CONFIRMED',
        total_amount REAL NOT NULL DEFAULT 0,
        payment_status TEXT NOT NULL DEFAULT 'PENDING',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS order_items (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        inventory_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        quantity_kg REAL NOT NULL,
        price_per_kg REAL NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        registration_number TEXT NOT NULL UNIQUE,
        capacity_kg REAL NOT NULL,
        cost_per_km REAL NOT NULL DEFAULT 20,
        active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS routes (
        id TEXT PRIMARY KEY,
        procurement_request_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'PLANNED',
        total_distance_km REAL NOT NULL DEFAULT 0,
        estimated_time_hours REAL NOT NULL DEFAULT 0,
        estimated_cost REAL NOT NULL DEFAULT 0,
        baseline_cost REAL NOT NULL DEFAULT 0,
        savings REAL NOT NULL DEFAULT 0,
        optimizer_payload TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS route_stops (
        id TEXT PRIMARY KEY,
        route_id TEXT NOT NULL,
        vehicle_id TEXT,
        order_id TEXT,
        stop_sequence INTEGER NOT NULL,
        stop_type TEXT NOT NULL,
        name TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        quantity_kg REAL NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS deliveries (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL UNIQUE,
        route_id TEXT,
        status TEXT NOT NULL DEFAULT 'PICKUP_PENDING',
        pickup_time TEXT,
        expected_delivery TEXT,
        actual_delivery TEXT,
        exception_reason TEXT,
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
  });
}

function convertPgToSqlite(sql, params) {
  let sqliteSql = sql;
  let sqliteParams = [];

  if (params && params.length > 0) {
    if (/\$\d+/.test(sql)) {
      sqliteSql = sqliteSql.replace(/\$(\d+)/g, (match, numStr) => {
        const index = parseInt(numStr, 10) - 1;
        sqliteParams.push(params[index]);
        return "?";
      });
    } else {
      sqliteParams = [...params];
    }
  }

  // Remove Postgres casting like ::text, ::date, ::integer, ::numeric
  sqliteSql = sqliteSql.replace(/::[a-zA-Z]+/g, "");

  // Replace CURRENT_DATE - ?::integer with date('now', '-' || ? || ' days')
  sqliteSql = sqliteSql.replace(/CURRENT_DATE\s*-\s*\?/gi, "date('now', '-' || ? || ' days')");
  sqliteSql = sqliteSql.replace(/CURRENT_DATE/gi, "date('now')");
  sqliteSql = sqliteSql.replace(/NOW\(\)/gi, "datetime('now')");

  // Replace EXCLUDED.x with excluded.x
  sqliteSql = sqliteSql.replace(/EXCLUDED\./gi, "excluded.");

  // Handle RETURNING clause (e.g. RETURNING *, RETURNING id, name, email, password_hash...)
  const returningMatch = sqliteSql.match(/RETURNING\s+[\s\S]+/i);
  if (returningMatch) {
    sqliteSql = sqliteSql.replace(/RETURNING\s+[\s\S]+/i, "");
  }

  // Remove Postgres FOR UPDATE locking clauses
  sqliteSql = sqliteSql.replace(/\s+FOR\s+UPDATE.*/gi, "");

  // Replace PostgreSQL JSON operators ->> with json_extract if needed
  sqliteSql = sqliteSql.replace(/\(([a-zA-Z0-9_.-]+)->>'([a-zA-Z0-9_.-]+)'\)/g, "json_extract($1, '$.$2')");

  return { sql: sqliteSql.trim(), params: sqliteParams, returning: !!returningMatch };
}

function executeSqliteQuery(sql, params = []) {
  const db = getSqliteDb();

  // If running DDL migration queries on SQLite, schema is already initialized
  if (/^\s*CREATE\s+TABLE/i.test(sql) || /^\s*CREATE\s+INDEX/i.test(sql)) {
    return Promise.resolve({ rows: [] });
  }

  const { sql: convertedSql, params: convertedParams } = convertPgToSqlite(sql, params);

  return new Promise((resolve, reject) => {
    const isSelect = /^\s*SELECT/i.test(convertedSql);
    if (isSelect) {
      db.all(convertedSql, convertedParams, (err, rows) => {
        if (err) return reject(err);
        resolve({ rows: rows || [] });
      });
    } else {
      db.run(convertedSql, convertedParams, function (err) {
        if (err) return reject(err);
        if (/^\s*INSERT/i.test(convertedSql) && params.length > 0) {
          const firstParam = params[0];
          const match = convertedSql.match(/INSERT\s+INTO\s+([a-zA-Z0-9_]+)/i);
          const tableName = match ? match[1] : null;

          if (tableName) {
            const idCol = (tableName === "farmers" || tableName === "buyers") ? "user_id" : "id";
            db.get(`SELECT * FROM ${tableName} WHERE ${idCol} = ?`, [firstParam], (err, row) => {
              resolve({ rows: row ? [row] : [{ id: firstParam }] });
            });
          } else {
            resolve({ rows: [{ id: firstParam }] });
          }
        } else {
          resolve({ rows: [], rowCount: this.changes });
        }
      });
    }
  });
}

const pool = {
  async query(sql, params) {
    if (!useLocalFallback) {
      try {
        return await pgPool.query(sql, params);
      } catch (err) {
        console.warn("[KisanFlow DB] Cloud PostgreSQL connection error/timeout. Seamlessly switching to local SQLite database fallback.", err.message);
        useLocalFallback = true;
      }
    }
    return executeSqliteQuery(sql, params);
  },

  async connect() {
    if (!useLocalFallback) {
      try {
        const client = await pgPool.connect();
        return client;
      } catch (err) {
        console.warn("[KisanFlow DB] Cloud PostgreSQL connection failed. Seamlessly switching to local SQLite fallback.", err.message);
        useLocalFallback = true;
      }
    }

    return {
      async query(sql, params) {
        return executeSqliteQuery(sql, params);
      },
      release() {},
    };
  },

  end() {
    if (sqliteDb) sqliteDb.close();
    return pgPool.end();
  }
};

module.exports = { pool };
