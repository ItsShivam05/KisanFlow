require("dotenv").config();

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required to seed the demo database.");

const bcrypt = require("bcryptjs");
const { pool } = require("../src/config/database");

const IDS = {
  tomato: "10000000-0000-4000-8000-000000000001",
  potato: "10000000-0000-4000-8000-000000000002",
  onion: "10000000-0000-4000-8000-000000000003",
  fpoOne: "20000000-0000-4000-8000-000000000001",
  fpoTwo: "20000000-0000-4000-8000-000000000002"
};

const farmers = [
  ["00000000-0000-4000-8000-000000000001", "Asha Devi", "Asha Fresh Farms", "Phulwari Sharif", 25.5770, 85.0860, 0.94],
  ["00000000-0000-4000-8000-000000000002", "Ramesh Kumar", "Kumar Vegetable Farm", "Maner", 25.6460, 84.8720, 0.91],
  ["00000000-0000-4000-8000-000000000003", "Sunita Devi", "Sunita Organics", "Danapur", 25.6240, 85.0450, 0.89],
  ["00000000-0000-4000-8000-000000000004", "Manoj Singh", "Green Field Farm", "Bihta", 25.5600, 84.8730, 0.87],
  ["00000000-0000-4000-8000-000000000005", "Poonam Kumari", "Poonam Harvests", "Fatuha", 25.5090, 85.3060, 0.92],
  ["00000000-0000-4000-8000-000000000006", "Vijay Yadav", "Yadav Agro Farm", "Hajipur", 25.6920, 85.2110, 0.90],
  ["00000000-0000-4000-8000-000000000007", "Rekha Devi", "Rekha Kitchen Garden", "Sonepur", 25.6960, 85.1770, 0.86],
  ["00000000-0000-4000-8000-000000000008", "Arun Kumar", "Arun Fresh Produce", "Naubatpur", 25.4900, 84.9900, 0.88],
  ["00000000-0000-4000-8000-000000000009", "Nisha Kumari", "Nisha Vegetables", "Bakhtiyarpur", 25.4590, 85.5360, 0.93],
  ["00000000-0000-4000-8000-000000000010", "Dilip Paswan", "Dilip Farm Collective", "Masaurhi", 25.3500, 85.0300, 0.85]
];

const fpoOwners = [
  ["00000000-0000-4000-8000-000000000021", "Kisan Vikas FPO", "Kisan Vikas Samiti FPO", IDS.fpoOne, "Phulwari Sharif", 25.5890, 85.0700],
  ["00000000-0000-4000-8000-000000000022", "Ganga Fresh FPO", "Ganga Fresh Producers FPO", IDS.fpoTwo, "Hajipur", 25.7000, 85.2200]
];

const buyers = [
  ["00000000-0000-4000-8000-000000000031", "Patna Fresh Mart", "Patna Fresh Mart Pvt Ltd", "Patna", 25.5941, 85.1376],
  ["00000000-0000-4000-8000-000000000032", "Campus Kitchens", "Campus Kitchens Cooperative", "Patna", 25.6090, 85.1310],
  ["00000000-0000-4000-8000-000000000033", "Bihar Bulk Foods", "Bihar Bulk Foods", "Patna", 25.5860, 85.1540]
];

const inventory = [
  ["30000000-0000-4000-8000-000000000001", farmers[0][0], null, IDS.tomato, 1000, 30, "A", 1, 25.5770, 85.0860, "Patna"],
  ["30000000-0000-4000-8000-000000000002", farmers[1][0], null, IDS.tomato, 750, 29, "A", 2, 25.6460, 84.8720, "Patna"],
  ["30000000-0000-4000-8000-000000000003", farmers[2][0], null, IDS.tomato, 650, 31, "A", 1, 25.6240, 85.0450, "Patna"],
  ["30000000-0000-4000-8000-000000000004", farmers[3][0], null, IDS.tomato, 600, 28, "B", 3, 25.5600, 84.8730, "Patna"],
  ["30000000-0000-4000-8000-000000000005", farmers[4][0], null, IDS.tomato, 500, 30, "A", 1, 25.5090, 85.3060, "Patna"],
  ["30000000-0000-4000-8000-000000000006", farmers[5][0], null, IDS.potato, 1800, 22, "A", 3, 25.6920, 85.2110, "Patna"],
  ["30000000-0000-4000-8000-000000000007", farmers[6][0], null, IDS.onion, 1400, 26, "A", 2, 25.6960, 85.1770, "Patna"],
  ["30000000-0000-4000-8000-000000000008", farmers[7][0], null, IDS.potato, 1200, 21, "B", 2, 25.4900, 84.9900, "Patna"],
  ["30000000-0000-4000-8000-000000000009", farmers[8][0], null, IDS.onion, 1100, 27, "A", 4, 25.4590, 85.5360, "Patna"],
  ["30000000-0000-4000-8000-000000000010", farmers[9][0], null, IDS.tomato, 500, 29, "B", 2, 25.3500, 85.0300, "Patna"],
  ["30000000-0000-4000-8000-000000000011", null, IDS.fpoOne, IDS.tomato, 3500, 29.5, "A", 1, 25.5890, 85.0700, "Patna"],
  ["30000000-0000-4000-8000-000000000012", null, IDS.fpoTwo, IDS.tomato, 2000, 30.5, "A", 2, 25.7000, 85.2200, "Patna"]
];

async function seed() {
  const client = await pool.connect();
  const passwordHash = await bcrypt.hash("demo12345", 12);
  try {
    await client.query("BEGIN");
    for (const [id, name] of farmers) {
      await client.query(
        `INSERT INTO users (id, name, email, password_hash, role) VALUES ($1, $2, $3, $4, 'FARMER')
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email`,
        [id, name, `${name.toLowerCase().replaceAll(" ", ".")}@demo.kisanflow.local`, passwordHash]
      );
    }
    for (const [id, name] of fpoOwners) {
      await client.query(
        `INSERT INTO users (id, name, email, password_hash, role) VALUES ($1, $2, $3, $4, 'FPO')
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email`,
        [id, name, `${name.toLowerCase().replaceAll(" ", ".")}@demo.kisanflow.local`, passwordHash]
      );
    }
    for (const [id, name] of buyers) {
      await client.query(
        `INSERT INTO users (id, name, email, password_hash, role) VALUES ($1, $2, $3, $4, 'BUYER')
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email`,
        [id, name, `${name.toLowerCase().replaceAll(" ", ".")}@demo.kisanflow.local`, passwordHash]
      );
    }
    for (const [id, name, farmName, village, lat, lng, reliability] of farmers) {
      await client.query(
        `INSERT INTO farmers (user_id, farm_name, village, district, state, latitude, longitude, reliability_score)
         VALUES ($1, $2, $3, 'Patna', 'Bihar', $4, $5, $6)
         ON CONFLICT (user_id) DO UPDATE SET farm_name = EXCLUDED.farm_name, village = EXCLUDED.village, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude, reliability_score = EXCLUDED.reliability_score, updated_at = NOW()`,
        [id, farmName, village, lat, lng, reliability]
      );
    }
    for (const [ownerId, _ownerName, fpoName, fpoId, region, lat, lng] of fpoOwners) {
      await client.query(
        `INSERT INTO fpos (id, owner_user_id, name, region, latitude, longitude)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, region = EXCLUDED.region, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude, updated_at = NOW()`,
        [fpoId, ownerId, fpoName, region, lat, lng]
      );
    }
    for (const farmerId of farmers.slice(0, 5).map((farmer) => farmer[0])) {
      await client.query("INSERT INTO fpo_members (fpo_id, farmer_user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [IDS.fpoOne, farmerId]);
    }
    for (const farmerId of farmers.slice(5).map((farmer) => farmer[0])) {
      await client.query("INSERT INTO fpo_members (fpo_id, farmer_user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [IDS.fpoTwo, farmerId]);
    }
    for (const [id, _name, organizationName, region, lat, lng] of buyers) {
      await client.query(
        `INSERT INTO buyers (user_id, organization_name, buyer_type, destination_name, region, latitude, longitude)
         VALUES ($1, $2, 'RETAILER', $2, $3, $4, $5)
         ON CONFLICT (user_id) DO UPDATE SET organization_name = EXCLUDED.organization_name, region = EXCLUDED.region, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude, updated_at = NOW()`,
        [id, organizationName, region, lat, lng]
      );
    }
    const products = [[IDS.tomato, "Tomato", 7], [IDS.potato, "Potato", 30], [IDS.onion, "Onion", 45]];
    for (const [id, name, shelfLife] of products) {
      await client.query(
        "INSERT INTO products (id, name, shelf_life_days) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, shelf_life_days = EXCLUDED.shelf_life_days",
        [id, name, shelfLife]
      );
    }
    for (const [id, farmerId, fpoId, productId, quantity, price, quality, harvestAge, lat, lng, region] of inventory) {
      await client.query(
        `INSERT INTO inventory (id, farmer_user_id, fpo_id, product_id, total_quantity_kg, available_quantity_kg, asking_price_per_kg, quality_grade, harvest_date, available_from, latitude, longitude, region)
         VALUES ($1, $2, $3, $4, $5, $5, $6, $7, CURRENT_DATE - $8::integer, CURRENT_DATE, $9, $10, $11)
         ON CONFLICT (id) DO UPDATE SET total_quantity_kg = EXCLUDED.total_quantity_kg, asking_price_per_kg = EXCLUDED.asking_price_per_kg, quality_grade = EXCLUDED.quality_grade, harvest_date = EXCLUDED.harvest_date, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude, region = EXCLUDED.region, updated_at = NOW()`,
        [id, farmerId, fpoId, productId, quantity, price, quality, harvestAge, lat, lng, region]
      );
    }
    const vehicles = [
      ["40000000-0000-4000-8000-000000000001", "KisanFlow Mini Truck 1", "BR-01-KF-1001", 5000],
      ["40000000-0000-4000-8000-000000000002", "KisanFlow Mini Truck 2", "BR-01-KF-1002", 5000],
      ["40000000-0000-4000-8000-000000000003", "KisanFlow Pickup", "BR-01-KF-1003", 2500]
    ];
    for (const vehicle of vehicles) {
      await client.query(
        "INSERT INTO vehicles (id, name, registration_number, capacity_kg) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, registration_number = EXCLUDED.registration_number, capacity_kg = EXCLUDED.capacity_kg",
        vehicle
      );
    }
    await client.query("COMMIT");
    console.log("KisanFlow deterministic demo data seeded. Demo password: demo12345");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

seed()
  .catch((error) => { console.error("Seed failed:", error.message); process.exitCode = 1; })
  .finally(() => pool.end());
