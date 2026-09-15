require("dotenv").config();

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required to seed the demo database.");

const bcrypt = require("bcryptjs");
const { pool } = require("../src/config/database");

const IDS = {
  tomato: "10000000-0000-4000-8000-000000000001",
  potato: "10000000-0000-4000-8000-000000000002",
  onion: "10000000-0000-4000-8000-000000000003",
  fpoOne: "20000000-0000-4000-8000-000000000001",
  fpoTwo: "20000000-0000-4000-8000-000000000002",
  fpoThree: "20000000-0000-4000-8000-000000000003",
  fpoFour: "20000000-0000-4000-8000-000000000004"
};

const farmers = [
  // Bihar Farmers
  ["00000000-0000-4000-8000-000000000001", "Asha Devi", "Asha Fresh Farms", "Phulwari Sharif", 25.5770, 85.0860, 0.94, "Patna", "Bihar"],
  ["00000000-0000-4000-8000-000000000002", "Ramesh Kumar", "Kumar Vegetable Farm", "Maner", 25.6460, 84.8720, 0.91, "Patna", "Bihar"],
  ["00000000-0000-4000-8000-000000000003", "Sunita Devi", "Sunita Organics", "Danapur", 25.6240, 85.0450, 0.89, "Patna", "Bihar"],
  ["00000000-0000-4000-8000-000000000004", "Manoj Singh", "Green Field Farm", "Bihta", 25.5600, 84.8730, 0.87, "Patna", "Bihar"],
  ["00000000-0000-4000-8000-000000000005", "Poonam Kumari", "Poonam Harvests", "Fatuha", 25.5090, 85.3060, 0.92, "Patna", "Bihar"],

  // Jharkhand Farmers
  ["00000000-0000-4000-8000-000000000011", "Birsa Munda", "Chota Nagpur Harvests", "Pandra", 23.3441, 85.3096, 0.95, "Ranchi", "Jharkhand"],
  ["00000000-0000-4000-8000-000000000012", "Sita Soren", "Ranchi Valley Farms", "Kanke", 23.4350, 85.3210, 0.92, "Ranchi", "Jharkhand"],
  ["00000000-0000-4000-8000-000000000013", "Rajesh Mahato", "Hazaribagh Green Produce", "Ichak", 23.9968, 85.3637, 0.90, "Hazaribagh", "Jharkhand"],
  ["00000000-0000-4000-8000-000000000014", "Anjali Hembram", "Dhanbad Agro Organics", "Govindpur", 23.7957, 86.4304, 0.88, "Dhanbad", "Jharkhand"],
  ["00000000-0000-4000-8000-000000000015", "Sanatan Tudu", "Plateau Fresh Produce", "Bistupur", 22.8046, 86.2029, 0.93, "Jamshedpur", "Jharkhand"],
  ["00000000-0000-4000-8000-000000000016", "Sunil Gope", "Bokaro Steel City Farms", "Chas", 23.6345, 86.1779, 0.89, "Bokaro", "Jharkhand"]
];

const fpoOwners = [
  // Bihar FPOs
  ["00000000-0000-4000-8000-000000000021", "Kisan Vikas FPO", "Kisan Vikas Samiti FPO", IDS.fpoOne, "Patna", 25.5890, 85.0700],
  ["00000000-0000-4000-8000-000000000022", "Ganga Fresh FPO", "Ganga Fresh Producers FPO", IDS.fpoTwo, "Hajipur", 25.7000, 85.2200],

  // Jharkhand FPOs
  ["00000000-0000-4000-8000-000000000023", "Vananchal Farmers FPO", "Vananchal Agro Producer Co", IDS.fpoThree, "Ranchi", 23.3441, 85.3096],
  ["00000000-0000-4000-8000-000000000024", "Hazaribagh Organic FPO", "Hazaribagh Farmer Collective", IDS.fpoFour, "Hazaribagh", 23.9968, 85.3637]
];

const buyers = [
  // Bihar Buyers
  ["00000000-0000-4000-8000-000000000031", "Patna Fresh Mart", "Patna Fresh Mart Pvt Ltd", "Patna", 25.5941, 85.1376],

  // Jharkhand Buyers
  ["00000000-0000-4000-8000-000000000032", "Ranchi Central Mandi Mart", "Ranchi Central Retail Co", "Ranchi", 23.3441, 85.3096],
  ["00000000-0000-4000-8000-000000000033", "Jamshedpur Bulk Foods", "Jamshedpur Bulk Foods Ltd", "Jamshedpur", 22.8046, 86.2029],
  ["00000000-0000-4000-8000-000000000034", "Dhanbad Wholesale Produce", "Dhanbad Supply Hub", "Dhanbad", 23.7957, 86.4304]
];

const inventory = [
  // Bihar inventory
  ["30000000-0000-4000-8000-000000000001", farmers[0][0], null, IDS.tomato, 1000, 30, "A", 1, 25.5770, 85.0860, "Patna"],
  ["30000000-0000-4000-8000-000000000002", farmers[1][0], null, IDS.tomato, 750, 29, "A", 2, 25.6460, 84.8720, "Patna"],
  ["30000000-0000-4000-8000-000000000003", farmers[2][0], null, IDS.potato, 1500, 22, "A", 1, 25.6240, 85.0450, "Patna"],

  // Jharkhand inventory
  ["30000000-0000-4000-8000-000000000011", farmers[5][0], null, IDS.tomato, 2500, 28, "A", 1, 23.3441, 85.3096, "Ranchi"],
  ["30000000-0000-4000-8000-000000000012", farmers[6][0], null, IDS.tomato, 1800, 27.5, "A", 2, 23.4350, 85.3210, "Ranchi"],
  ["30000000-0000-4000-8000-000000000013", farmers[7][0], null, IDS.potato, 3000, 20, "A", 2, 23.9968, 85.3637, "Hazaribagh"],
  ["30000000-0000-4000-8000-000000000014", farmers[8][0], null, IDS.onion, 2200, 25, "B", 3, 23.7957, 86.4304, "Dhanbad"],
  ["30000000-0000-4000-8000-000000000015", farmers[9][0], null, IDS.tomato, 1400, 29, "A", 1, 22.8046, 86.2029, "Jamshedpur"],
  ["30000000-0000-4000-8000-000000000016", null, IDS.fpoThree, IDS.tomato, 5000, 28.5, "A", 1, 23.3441, 85.3096, "Ranchi"],
  ["30000000-0000-4000-8000-000000000017", null, IDS.fpoFour, IDS.potato, 4000, 21.5, "A", 2, 23.9968, 85.3637, "Hazaribagh"]
];

async function seed() {
  const client = await pool.connect();
  const passwordHash = await bcrypt.hash("demo12345", 12);
  try {
    await client.query("BEGIN");

    // Insert Users for Farmers
    for (const [id, name] of farmers) {
      await client.query(
        `INSERT INTO users (id, name, email, password_hash, role) VALUES ($1, $2, $3, $4, 'FARMER')
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email`,
        [id, name, `${name.toLowerCase().replaceAll(" ", ".")}@demo.kisanflow.local`, passwordHash]
      );
    }

    // Insert Users for FPOs
    for (const [id, name] of fpoOwners) {
      await client.query(
        `INSERT INTO users (id, name, email, password_hash, role) VALUES ($1, $2, $3, $4, 'FPO')
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email`,
        [id, name, `${name.toLowerCase().replaceAll(" ", ".")}@demo.kisanflow.local`, passwordHash]
      );
    }

    // Insert Users for Buyers
    for (const [id, name] of buyers) {
      await client.query(
        `INSERT INTO users (id, name, email, password_hash, role) VALUES ($1, $2, $3, $4, 'BUYER')
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email`,
        [id, name, `${name.toLowerCase().replaceAll(" ", ".")}@demo.kisanflow.local`, passwordHash]
      );
    }

    // Insert Farmer Profiles with District & State
    for (const [id, name, farmName, village, lat, lng, reliability, district, state] of farmers) {
      await client.query(
        `INSERT INTO farmers (user_id, farm_name, village, district, state, latitude, longitude, reliability_score)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (user_id) DO UPDATE SET farm_name = EXCLUDED.farm_name, village = EXCLUDED.village, district = EXCLUDED.district, state = EXCLUDED.state, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude, reliability_score = EXCLUDED.reliability_score, updated_at = NOW()`,
        [id, farmName, village, district, state, lat, lng, reliability]
      );
    }

    // Insert FPOs
    for (const [ownerId, _ownerName, fpoName, fpoId, region, lat, lng] of fpoOwners) {
      await client.query(
        `INSERT INTO fpos (id, owner_user_id, name, region, latitude, longitude)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, region = EXCLUDED.region, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude, updated_at = NOW()`,
        [fpoId, ownerId, fpoName, region, lat, lng]
      );
    }

    // FPO Memberships
    for (const farmerId of farmers.slice(0, 5).map((farmer) => farmer[0])) {
      await client.query("INSERT INTO fpo_members (fpo_id, farmer_user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [IDS.fpoOne, farmerId]);
    }
    for (const farmerId of farmers.slice(5).map((farmer) => farmer[0])) {
      await client.query("INSERT INTO fpo_members (fpo_id, farmer_user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [IDS.fpoThree, farmerId]);
    }

    // Insert Buyers
    for (const [id, _name, organizationName, region, lat, lng] of buyers) {
      await client.query(
        `INSERT INTO buyers (user_id, organization_name, buyer_type, destination_name, region, latitude, longitude)
         VALUES ($1, $2, 'RETAILER', $2, $3, $4, $5)
         ON CONFLICT (user_id) DO UPDATE SET organization_name = EXCLUDED.organization_name, region = EXCLUDED.region, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude, updated_at = NOW()`,
        [id, organizationName, region, lat, lng]
      );
    }

    // Products
    const products = [[IDS.tomato, "Tomato", 7], [IDS.potato, "Potato", 30], [IDS.onion, "Onion", 45]];
    for (const [id, name, shelfLife] of products) {
      await client.query(
        "INSERT INTO products (id, name, shelf_life_days) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, shelf_life_days = EXCLUDED.shelf_life_days",
        [id, name, shelfLife]
      );
    }

    // Inventory Lots
    for (const [id, farmerId, fpoId, productId, quantity, price, quality, harvestAge, lat, lng, region] of inventory) {
      await client.query(
        `INSERT INTO inventory (id, farmer_user_id, fpo_id, product_id, total_quantity_kg, available_quantity_kg, asking_price_per_kg, quality_grade, harvest_date, available_from, latitude, longitude, region)
         VALUES ($1, $2, $3, $4, $5, $5, $6, $7, CURRENT_DATE - $8::integer, CURRENT_DATE, $9, $10, $11)
         ON CONFLICT (id) DO UPDATE SET total_quantity_kg = EXCLUDED.total_quantity_kg, asking_price_per_kg = EXCLUDED.asking_price_per_kg, quality_grade = EXCLUDED.quality_grade, harvest_date = EXCLUDED.harvest_date, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude, region = EXCLUDED.region, updated_at = NOW()`,
        [id, farmerId, fpoId, productId, quantity, price, quality, harvestAge, lat, lng, region]
      );
    }

    // Logistics Vehicles
    const vehicles = [
      ["40000000-0000-4000-8000-000000000001", "KisanFlow Mini Truck (Patna)", "BR-01-KF-1001", 5000],
      ["40000000-0000-4000-8000-000000000002", "KisanFlow Express Van (Ranchi)", "JH-01-KF-2001", 5000],
      ["40000000-0000-4000-8000-000000000003", "KisanFlow Heavy Truck (Hazaribagh)", "JH-02-KF-2002", 10000],
      ["40000000-0000-4000-8000-000000000004", "KisanFlow Pickup (Dhanbad)", "JH-10-KF-2003", 2500]
    ];
    for (const vehicle of vehicles) {
      await client.query(
        "INSERT INTO vehicles (id, name, registration_number, capacity_kg) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, registration_number = EXCLUDED.registration_number, capacity_kg = EXCLUDED.capacity_kg",
        vehicle
      );
    }

    await client.query("COMMIT");
    console.log("KisanFlow multi-state demo data (Jharkhand & Bihar) seeded successfully. Demo password: demo12345");
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
