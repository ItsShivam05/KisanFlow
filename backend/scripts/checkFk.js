const db = require("../config/db");

async function check() {
  const fks = await db.query(`
    SELECT
      tc.table_name, 
      kcu.column_name, 
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name 
    FROM 
      information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema='public';
  `);
  console.log("FKs:", JSON.stringify(fks.rows, null, 2));

  try {
    const postgis = await db.query("SELECT PostGIS_Version();");
    console.log("PostGIS:", postgis.rows[0]);
  } catch (e) {
    console.log("PostGIS not installed or different syntax:", e.message);
  }
  process.exit(0);
}

check().catch(e => { console.error(e); process.exit(1); });
