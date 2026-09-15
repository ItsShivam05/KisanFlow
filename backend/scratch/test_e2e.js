require('dotenv').config();
const { pool } = require('../src/config/database');
const service = require('../src/services/marketplace.service');

async function test() {
  try {
    console.log('--- TEST 1: BUYER MARK DELIVERED ---');
    const bUser = { id: '041e768a-35af-4882-b956-a5200156fc8f', role: 'BUYER' };
    const markRes = await service.updateDelivery(bUser, '69cb754c-dd6b-427d-b47b-ea12aeda1f49', 'DELIVERED', null);
    console.log('UPDATE DELIVERY RESULT:', markRes);

    const dbOrder = await pool.query('SELECT o.id, o.status, d.status AS delivery_status FROM orders o JOIN deliveries d ON d.order_id = o.id WHERE o.id = $1', ['69cb754c-dd6b-427d-b47b-ea12aeda1f49']);
    console.log('DB ORDER VERIFIED:', dbOrder.rows[0]);

    console.log('\n--- TEST 2: FARMER ORDERS LISTING ---');
    const fUser = { id: '00000000-0000-4000-8000-000000000002', role: 'FARMER' };
    const farmerOrders = await service.listOrders(fUser);
    console.log('FARMER ORDERS COUNT:', farmerOrders.length);
    console.log('FARMER ORDERS LIST:', farmerOrders.map(o => ({ id: o.id, status: o.status, delivery_status: o.delivery_status })));

    process.exit(0);
  } catch (e) {
    console.error('E2E TEST ERROR:', e);
    process.exit(1);
  }
}

test();
