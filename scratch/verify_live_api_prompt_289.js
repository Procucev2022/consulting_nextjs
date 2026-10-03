const http = require('http');

// Set encryption key for token generation
process.env.APP_ENCRYPTION_KEY = process.env.APP_ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

const { generateAuthToken } = require('../backend/dist/utils/auth.js');

async function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function run() {
  console.log('=== STARTING LIVE API & FRONTEND VERIFICATION (PROMPT 289) ===\n');

  // Seeded tenants in backend:
  // Bronze: TNT-BRONZE-CLIENT
  // Silver: TNT-SILVER-CLIENT
  // Gold:   TNT-GLOBAL-8902
  const bronzeToken = generateAuthToken('usr-bronze-buyer', 'bronze@enterprise.com', 'USER', 'BRONZE', 'TNT-BRONZE-CLIENT');
  const silverToken = generateAuthToken('usr-silver-buyer', 'silver@enterprise.com', 'USER', 'SILVER', 'TNT-SILVER-CLIENT');
  const goldToken = generateAuthToken('usr-gold-buyer', 'gold@enterprise.com', 'USER', 'GOLD', 'TNT-GLOBAL-8902');
  const adminToken = generateAuthToken('usr-admin', 'admin@procucev.com', 'ADMIN', 'GOLD', 'TNT-GLOBAL-8902', '+919876543210');
  const crossTenantToken = generateAuthToken('usr-cross', 'cross@tenant-a.com', 'USER', 'BRONZE', 'TNT-CLIENT-A');

  const actionTrackerBody = JSON.stringify({
    actionId: 'act-OPP-PCBI-001',
    status: 'In Progress',
    owner: 'Procurement',
    priority: 'HIGH',
    comments: 'Live verification test'
  });

  const results = [];

  async function testEndpoint(testName, options, postData, expectedStatus) {
    try {
      const res = await makeRequest(options, postData);
      const pass = res.statusCode === expectedStatus;
      results.push({ testName, expected: expectedStatus, actual: res.statusCode, pass, body: res.body.slice(0, 150) });
      console.log(`[${pass ? 'PASS' : 'FAIL'}] ${testName} -> Expected: ${expectedStatus}, Got: ${res.statusCode}`);
    } catch (err) {
      results.push({ testName, expected: expectedStatus, actual: 'ERR: ' + err.message, pass: false });
      console.log(`[FAIL] ${testName} -> Error: ${err.message}`);
    }
  }

  // 1. Frontend routes
  console.log('\n--- 1. Frontend Route Verification ---');
  await testEndpoint('Frontend Customer Home App', {
    hostname: 'localhost',
    port: 3001,
    path: '/?tab=module1',
    method: 'GET'
  }, null, 200);

  await testEndpoint('Frontend Admin Subscriptions Route', {
    hostname: 'localhost',
    port: 3001,
    path: '/admin/subscriptions',
    method: 'GET'
  }, null, 200);

  // 2. Unauthenticated requests
  console.log('\n--- 2. Unauthenticated Requests ---');
  await testEndpoint('Unauthenticated calling /api/subscription/admin/list', {
    hostname: 'localhost',
    port: 5000,
    path: '/api/subscription/admin/list',
    method: 'GET'
  }, null, 403);

  await testEndpoint('Unauthenticated calling /api/savings/action-plan/update', {
    hostname: 'localhost',
    port: 5000,
    path: '/api/savings/action-plan/update',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, actionTrackerBody, 403);

  // 3. Bronze user requests
  console.log('\n--- 3. Bronze User Requests ---');
  await testEndpoint('Bronze user accessing /api/subscription/plan', {
    hostname: 'localhost',
    port: 5000,
    path: '/api/subscription/plan',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${bronzeToken}` }
  }, null, 200);

  await testEndpoint('Bronze user calling Gold API /api/reports/executive-brief/download/pdf', {
    hostname: 'localhost',
    port: 5000,
    path: '/api/reports/executive-brief/download/pdf',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${bronzeToken}` }
  }, null, 403);

  await testEndpoint('Bronze user calling Action Tracker /api/savings/action-plan/update', {
    hostname: 'localhost',
    port: 5000,
    path: '/api/savings/action-plan/update',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${bronzeToken}`,
      'Content-Type': 'application/json'
    }
  }, actionTrackerBody, 403);

  await testEndpoint('Bronze user calling Admin list /api/subscription/admin/list', {
    hostname: 'localhost',
    port: 5000,
    path: '/api/subscription/admin/list',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${bronzeToken}` }
  }, null, 403);

  // 4. Silver user requests
  console.log('\n--- 4. Silver User Requests ---');
  await testEndpoint('Silver user accessing /api/subscription/plan', {
    hostname: 'localhost',
    port: 5000,
    path: '/api/subscription/plan',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${silverToken}` }
  }, null, 200);

  await testEndpoint('Silver user calling permitted Management Quick Summary PDF', {
    hostname: 'localhost',
    port: 5000,
    path: '/api/reports/executive-brief/download/opportunity-brief/pdf',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${silverToken}` }
  }, null, 200);

  await testEndpoint('Silver user calling Gold-only full Boardroom PDF', {
    hostname: 'localhost',
    port: 5000,
    path: '/api/reports/executive-brief/download/pdf',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${silverToken}` }
  }, null, 403);

  await testEndpoint('Silver user calling Action Tracker /api/savings/action-plan/update', {
    hostname: 'localhost',
    port: 5000,
    path: '/api/savings/action-plan/update',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${silverToken}`,
      'Content-Type': 'application/json'
    }
  }, actionTrackerBody, 403);

  // 5. Gold user requests
  console.log('\n--- 5. Gold User Requests ---');
  await testEndpoint('Gold user accessing /api/subscription/plan', {
    hostname: 'localhost',
    port: 5000,
    path: '/api/subscription/plan',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${goldToken}` }
  }, null, 200);

  await testEndpoint('Gold user calling full Boardroom PDF /api/reports/executive-brief/download/pdf', {
    hostname: 'localhost',
    port: 5000,
    path: '/api/reports/executive-brief/download/pdf',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${goldToken}` }
  }, null, 200);

  await testEndpoint('Gold user calling Action Tracker /api/savings/action-plan/update', {
    hostname: 'localhost',
    port: 5000,
    path: '/api/savings/action-plan/update',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${goldToken}`,
      'Content-Type': 'application/json'
    }
  }, actionTrackerBody, 200);

  // 6. Admin user requests
  console.log('\n--- 6. Admin User Requests ---');
  await testEndpoint('Admin accessing /api/subscription/admin/list', {
    hostname: 'localhost',
    port: 5000,
    path: '/api/subscription/admin/list',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  }, null, 200);

  await testEndpoint('Admin simulating Silver tier', {
    hostname: 'localhost',
    port: 5000,
    path: '/api/subscription/admin/simulate-tier',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    }
  }, JSON.stringify({ tier: 'SILVER' }), 200);

  // 7. Cross-tenant user requests
  console.log('\n--- 7. Cross-tenant Spoofing Tests ---');
  await testEndpoint('Customer A querying Customer B via query parameter (?tenantId=TNT-CLIENT-B)', {
    hostname: 'localhost',
    port: 5000,
    path: '/api/subscription/plan?tenantId=TNT-CLIENT-B',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${crossTenantToken}` }
  }, null, 403);

  await testEndpoint('Customer A requesting Customer B via header (x-tenant-id=TNT-CLIENT-B)', {
    hostname: 'localhost',
    port: 5000,
    path: '/api/subscription/plan',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${crossTenantToken}`,
      'x-tenant-id': 'TNT-CLIENT-B'
    }
  }, null, 403);

  await testEndpoint('Customer A activating with Customer B tenant in body', {
    hostname: 'localhost',
    port: 5000,
    path: '/api/subscription/activate',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${crossTenantToken}`,
      'Content-Type': 'application/json'
    }
  }, JSON.stringify({
    customer_email: 'cross@tenant-a.com',
    activation_code: 'PCV-1234-5678-9012',
    tenant_id: 'TNT-CLIENT-B'
  }), 403);

  console.log('\n=== VERIFICATION SUMMARY ===');
  const allPassed = results.every(r => r.pass);
  console.log(`Total Live Endpoints Checked: ${results.length}`);
  console.log(`Passed: ${results.filter(r => r.pass).length}`);
  console.log(`Failed: ${results.filter(r => !r.pass).length}`);
  console.log(`Live Verification Status: ${allPassed ? 'ALL PASSED (SUCCESS)' : 'FAILURES DETECTED'}`);
}

run().catch(console.error);
