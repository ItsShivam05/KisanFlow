const db = require("../config/db");

async function checkConstraints() {
  const res = await db.query(`
    SELECT 
      conrelid::regclass AS table_name,
      conname, 
      pg_get_constraintdef(oid) as def 
    FROM pg_constraint 
    WHERE contype = 'c' AND connamespace = 'public'::regnamespace;
  `);
  res.rows.forEach(r => console.log(r.table_name, "|", r.conname, "|", r.def));
  process.exit(0);
}

checkConstraints().catch(e => { console.error(e); process.exit(1); });
