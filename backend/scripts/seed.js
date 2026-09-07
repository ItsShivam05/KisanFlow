const db = require("../config/db");
const fs = require("fs");
const path = require("path");

async function seedDatabase() {
  console.log("🌱 Starting Neon PostgreSQL database seeding for KisanFlow...\n");

  try {
    // 1. Clean existing data in reverse foreign key order
    console.log("Cleaning existing sample data...");
    await db.query("DELETE FROM order_items;");
    await db.query("DELETE FROM orders;");
    await db.query("DELETE FROM inventory;");
    await db.query("DELETE FROM buyers;");
    await db.query("DELETE FROM farmers;");
    await db.query("DELETE FROM fpos;");
    await db.query("DELETE FROM profiles;");
    await db.query("DELETE FROM products;");

    // 2. Insert Profiles
    console.log("1. Inserting Profiles...");
    const profiles = await db.query(`
      INSERT INTO profiles (id, auth_user_id, full_name, phone, role) VALUES
      ('11111111-1111-1111-1111-111111111101', 'auth_farmer_01', 'Ramesh Patel', '+91 98260 12345', 'farmer'),
      ('11111111-1111-1111-1111-111111111102', 'auth_farmer_02', 'Gurpreet Singh', '+91 98140 23456', 'farmer'),
      ('11111111-1111-1111-1111-111111111103', 'auth_farmer_03', 'Baldev Patil', '+91 98220 34567', 'farmer'),
      ('11111111-1111-1111-1111-111111111104', 'auth_fpo_01', 'Malwa Kisan Producer Co Ltd', '+91 73120 45678', 'fpo'),
      ('11111111-1111-1111-1111-111111111105', 'auth_fpo_02', 'Sahyadri Agro Farmers Co', '+91 25320 56789', 'fpo'),
      ('11111111-1111-1111-1111-111111111106', 'auth_buyer_01', 'Reliance Fresh Sourcing', '+91 22610 67890', 'buyer'),
      ('11111111-1111-1111-1111-111111111107', 'auth_buyer_02', 'ITC Agri-Business Division', '+91 40230 78901', 'buyer'),
      ('11111111-1111-1111-1111-111111111108', 'auth_buyer_03', 'BigBasket B2B Procurement', '+91 80450 89012', 'buyer')
      RETURNING id, full_name, role;
    `);
    console.log(`   ✓ Inserted ${profiles.rowCount} profiles.`);

    // 3. Insert Farmers
    console.log("2. Inserting Farmers...");
    const farmers = await db.query(`
      INSERT INTO farmers (id, profile_id, farm_name, farm_size_acres, address, location, verification_status) VALUES
      ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111101', 'Patel Organic Farms', 14.5, 'Village Sanwer, Dist. Indore, Madhya Pradesh', ST_SetSRID(ST_MakePoint(75.82, 22.97), 4326)::geography, 'verified'),
      ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111102', 'Kisan Heritage Farm', 22.0, 'Village Samrala, Dist. Ludhiana, Punjab', ST_SetSRID(ST_MakePoint(76.19, 30.83), 4326)::geography, 'verified'),
      ('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111103', 'Ratnagiri Green Orchards', 18.0, 'Pawas Road, Dist. Ratnagiri, Maharashtra', ST_SetSRID(ST_MakePoint(73.31, 16.99), 4326)::geography, 'verified')
      RETURNING id, farm_name;
    `);
    console.log(`   ✓ Inserted ${farmers.rowCount} farmers.`);

    // 4. Insert FPOs
    console.log("3. Inserting FPOs...");
    const fpos = await db.query(`
      INSERT INTO fpos (id, profile_id, fpo_name, registration_number, address, location, verification_status) VALUES
      ('33333333-3333-3333-3333-333333333301', '11111111-1111-1111-1111-111111111104', 'Malwa Krishi Farmer Producer Co', 'FPO-MP-IND-2021-8842', 'Warehouse Complex, Sanwer Road, Indore, MP', ST_SetSRID(ST_MakePoint(75.85, 22.75), 4326)::geography, 'verified'),
      ('33333333-3333-3333-3333-333333333302', '11111111-1111-1111-1111-111111111105', 'Sahyadri Horti-Produce Co-op', 'FPO-MH-NSK-2019-4112', 'Pimpalgaon APMC Yard, Nashik, Maharashtra', ST_SetSRID(ST_MakePoint(73.98, 20.17), 4326)::geography, 'verified')
      RETURNING id, fpo_name;
    `);
    console.log(`   ✓ Inserted ${fpos.rowCount} FPOs.`);

    // 5. Insert Buyers (allowed buyer_type: 'consumer', 'retailer', 'restaurant', 'institution', 'bulk_buyer')
    console.log("4. Inserting Buyers...");
    const buyers = await db.query(`
      INSERT INTO buyers (id, profile_id, business_name, buyer_type, address, location) VALUES
      ('44444444-4444-4444-4444-444444444401', '11111111-1111-1111-1111-111111111106', 'Reliance Retail Agri Logistics', 'retailer', 'Ghansoli Central Distribution Hub, Navi Mumbai, Maharashtra', ST_SetSRID(ST_MakePoint(73.00, 19.12), 4326)::geography),
      ('44444444-4444-4444-4444-444444444402', '11111111-1111-1111-1111-111111111107', 'ITC Agri-Business Division', 'institution', 'ITC Park, Cyberabad, Hyderabad, Telangana', ST_SetSRID(ST_MakePoint(78.38, 17.44), 4326)::geography),
      ('44444444-4444-4444-4444-444444444403', '11111111-1111-1111-1111-111111111108', 'BigBasket Wholesale Hub', 'bulk_buyer', 'Whitefield Cold-Chain Center, Bengaluru, Karnataka', ST_SetSRID(ST_MakePoint(77.74, 12.96), 4326)::geography)
      RETURNING id, business_name;
    `);
    console.log(`   ✓ Inserted ${buyers.rowCount} buyers.`);

    // 6. Insert Products
    console.log("5. Inserting Agricultural Products...");
    const products = await db.query(`
      INSERT INTO products (id, name, category, description, unit) VALUES
      ('55555555-5555-5555-5555-555555555501', 'Premium Sharbati Wheat', 'Grains', 'Golden heavy-kernel Sharbati wheat grown in the black soil of Sehore & Malwa, naturally high in gluten and protein.', 'quintal'),
      ('55555555-5555-5555-5555-555555555502', 'Organic 1121 Basmati Rice', 'Grains', 'Extra-long grain aromatic basmati rice aged for 24 months, harvested from chemical-free fertile Punjab plains.', 'quintal'),
      ('55555555-5555-5555-5555-555555555503', 'GI-Tagged Alphonso Mangoes', 'Fruits', 'Naturally tree-ripened export-grade Hapus mangoes with rich saffron pulp from Konkan coastal orchards.', 'crate'),
      ('55555555-5555-5555-5555-555555555504', 'Nashik Red Onions (Grade A)', 'Vegetables', 'Properly cured, thin-neck pungent red onions with low moisture content and 90-day storage longevity.', 'kg'),
      ('55555555-5555-5555-5555-555555555505', 'Yellow Mustard Seeds (Pili Sarson)', 'Oilseeds', 'Clean, stone-free cold-press ready high-oil mustard seeds with 42% natural oil yield.', 'kg'),
      ('55555555-5555-5555-5555-555555555506', 'Guntur Sannam Red Chilli', 'Spices', 'Sun-dried vibrant red chillies with high capsaicin content and authentic pungency for spice processing.', 'kg'),
      ('55555555-5555-5555-5555-555555555507', 'Desi Chana (Bengal Gram)', 'Pulses', 'Machine cleaned uniform chickpeas rich in dietary fibre and protein, ideal for besan millers.', 'quintal'),
      ('55555555-5555-5555-5555-555555555508', 'Shimla Royal Delicious Apples', 'Fruits', 'Crisp, hand-sorted high-altitude apples packed in protective trays with uniform 75-80mm sizing.', 'crate')
      RETURNING id, name, category;
    `);
    console.log(`   ✓ Inserted ${products.rowCount} products.`);

    // 7. Insert Inventory Batches
    // Constraint: (farmer_id IS NOT NULL AND fpo_id IS NULL) OR (farmer_id IS NULL AND fpo_id IS NOT NULL)
    console.log("6. Inserting Inventory Batches...");
    const inventory = await db.query(`
      INSERT INTO inventory (id, product_id, farmer_id, fpo_id, quantity, available_quantity, price_per_unit, quality, harvest_date, available_from, available_until) VALUES
      ('66666666-6666-6666-6666-666666666601', '55555555-5555-5555-5555-555555555501', '22222222-2222-2222-2222-222222222201', NULL, 350.00, 300.00, 3850.00, 'Grade A', '2026-03-25', '2026-04-01', '2026-10-30'),
      ('66666666-6666-6666-6666-666666666602', '55555555-5555-5555-5555-555555555502', '22222222-2222-2222-2222-222222222202', NULL, 500.00, 450.00, 6200.00, 'Organic Certified', '2026-02-15', '2026-03-01', '2026-12-31'),
      ('66666666-6666-6666-6666-666666666603', '55555555-5555-5555-5555-555555555503', '22222222-2222-2222-2222-222222222203', NULL, 1200.00, 1100.00, 950.00, 'GI Grade-1', '2026-04-10', '2026-04-15', '2026-06-30'),
      ('66666666-6666-6666-6666-666666666604', '55555555-5555-5555-5555-555555555504', NULL, '33333333-3333-3333-3333-333333333302', 8500.00, 7500.00, 26.50, 'Grade A (55mm+)', '2026-03-20', '2026-03-25', '2026-08-30'),
      ('66666666-6666-6666-6666-666666666605', '55555555-5555-5555-5555-555555555505', NULL, '33333333-3333-3333-3333-333333333301', 4500.00, 4500.00, 68.00, 'Premium 42% Oil', '2026-02-28', '2026-03-10', '2026-11-30'),
      ('66666666-6666-6666-6666-666666666606', '55555555-5555-5555-5555-555555555506', NULL, '33333333-3333-3333-3333-333333333301', 2000.00, 2000.00, 195.00, 'Export Dry Grade', '2026-01-20', '2026-02-01', '2026-12-31'),
      ('66666666-6666-6666-6666-666666666607', '55555555-5555-5555-5555-555555555507', '22222222-2222-2222-2222-222222222201', NULL, 280.00, 280.00, 5800.00, 'Bold Grade A', '2026-03-15', '2026-03-25', '2026-12-31'),
      ('66666666-6666-6666-6666-666666666608', '55555555-5555-5555-5555-555555555508', NULL, '33333333-3333-3333-3333-333333333302', 800.00, 800.00, 1450.00, 'Fancy Royal', '2026-08-10', '2026-08-20', '2026-11-30')
      RETURNING id, product_id, available_quantity, price_per_unit;
    `);
    console.log(`   ✓ Inserted ${inventory.rowCount} inventory batch lots.`);

    // 8. Insert Orders
    // Allowed order_status: 'pending', 'confirmed', 'processing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'
    // Allowed payment_status: 'pending', 'paid', 'failed', 'refunded'
    console.log("7. Inserting Procurement Orders...");
    const orders = await db.query(`
      INSERT INTO orders (id, buyer_id, order_status, delivery_address, delivery_location, delivery_preference, total_amount, payment_status) VALUES
      ('77777777-7777-7777-7777-777777777701', '44444444-4444-4444-4444-444444444401', 'confirmed', 'Reliance DC, Plot C-12, MIDC Turbhe, Navi Mumbai', ST_SetSRID(ST_MakePoint(73.02, 19.08), 4326)::geography, 'Reefer Scheduled 48hr', 119000.00, 'paid'),
      ('77777777-7777-7777-7777-777777777702', '44444444-4444-4444-4444-444444444402', 'out_for_delivery', 'ITC Processing Plant, Sector 5, Pithampur Industrial Area, MP', ST_SetSRID(ST_MakePoint(75.68, 22.61), 4326)::geography, 'Dedicated Flatbed Truck', 192500.00, 'paid'),
      ('77777777-7777-7777-7777-777777777703', '44444444-4444-4444-4444-444444444403', 'delivered', 'BigBasket Fulfillment Depot, Hoodi Circle, Bengaluru', ST_SetSRID(ST_MakePoint(77.71, 12.99), 4326)::geography, 'Standard Transit', 310000.00, 'paid')
      RETURNING id, buyer_id, order_status, total_amount;
    `);
    console.log(`   ✓ Inserted ${orders.rowCount} orders.`);

    // 9. Insert Order Items
    console.log("8. Inserting Order Items...");
    const orderItems = await db.query(`
      INSERT INTO order_items (id, order_id, inventory_id, product_id, quantity, price_per_unit, subtotal) VALUES
      ('88888888-8888-8888-8888-888888888801', '77777777-7777-7777-7777-777777777701', '66666666-6666-6666-6666-666666666603', '55555555-5555-5555-5555-555555555503', 100.00, 950.00, 95000.00),
      ('88888888-8888-8888-8888-888888888802', '77777777-7777-7777-7777-777777777701', '66666666-6666-6666-6666-666666666604', '55555555-5555-5555-5555-555555555504', 905.66, 26.50, 24000.00),
      ('88888888-8888-8888-8888-888888888803', '77777777-7777-7777-7777-777777777702', '66666666-6666-6666-6666-666666666601', '55555555-5555-5555-5555-555555555501', 50.00, 3850.00, 192500.00),
      ('88888888-8888-8888-8888-888888888804', '77777777-7777-7777-7777-777777777703', '66666666-6666-6666-6666-666666666602', '55555555-5555-5555-5555-555555555502', 50.00, 6200.00, 310000.00)
      RETURNING id, order_id, subtotal;
    `);
    console.log(`   ✓ Inserted ${orderItems.rowCount} order items.`);

    console.log("\n=======================================================");
    console.log("✨ ALL TABLES IN NEON POSTGRESQL SEEDED SUCCESSFULLY! ✨");
    console.log("=======================================================");
    console.log(`  📁 profiles:    ${profiles.rowCount} records`);
    console.log(`  🌾 farmers:     ${farmers.rowCount} records`);
    console.log(`  🏢 fpos:        ${fpos.rowCount} records`);
    console.log(`  🛒 buyers:      ${buyers.rowCount} records`);
    console.log(`  📦 products:    ${products.rowCount} records`);
    console.log(`  📊 inventory:   ${inventory.rowCount} records`);
    console.log(`  🚚 orders:      ${orders.rowCount} records`);
    console.log(`  📋 order_items: ${orderItems.rowCount} records`);
    console.log("=======================================================\n");

    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding database:", err);
    process.exit(1);
  }
}

seedDatabase();
