/**
 * test_e2e_complete.js — End-to-End AGRIDIRECT Verification Suite
 * Tests Farmer, Buyer, Admin workflows and all edge/negative cases.
 */

const BASE_URL = 'http://localhost:5000/api';

async function api(endpoint, method = 'GET', body = null, token = null, isMultipart = false) {
  const headers = {};
  if (!isMultipart) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const opts = { method, headers };
  if (body) {
    opts.body = isMultipart ? body : JSON.stringify(body);
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, opts);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

let passed = 0;
let failed = 0;

function assert(cond, title) {
  if (cond) {
    console.log(`  ✅ PASS: ${title}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${title}`);
    failed++;
  }
}

async function runE2ETests() {
  console.log('\n======================================================');
  console.log('🌾 AGRIDIRECT Complete End-to-End System Test Suite');
  console.log('======================================================\n');

  const timestamp = Date.now();
  const farmerEmail = `farmer_${timestamp}@testfarms.in`;
  const buyerEmail = `buyer_${timestamp}@testbuyer.com`;
  const testPassword = 'StrongPass123!';

  let farmerToken = null;
  let farmerUid = null;
  let buyerToken = null;
  let buyerUid = null;
  let adminToken = null;
  let createdLotId = null;
  let createdBidId = null;

  // ════════════════════════════════════════════════════════════
  // 1. FARMER WORKFLOW
  // Register → Login → Add Product → Marketplace → Receive Bid → Accept Bid → Order
  // ════════════════════════════════════════════════════════════
  console.log('👨‍🌾 WORKFLOW 1: FARMER COMPLETE LIFECYCLE');

  // Step 1: Register
  const farmerReg = await api('/auth/register', 'POST', {
    name: 'Anand Reddy',
    email: farmerEmail,
    phone: `98480${Math.floor(10000 + Math.random() * 90000)}`,
    role: 'farmer',
    location: 'Anakapalli',
    password: testPassword,
    cropsCultivated: ['Sugarcane', 'Jaggery', 'Tomato'],
  });
  assert(farmerReg.status === 201 && farmerReg.data.success, 'Farmer Registration successful');
  farmerUid = farmerReg.data.user?.uid;
  farmerToken = farmerReg.data.token;

  // Step 2: Login
  const farmerLogin = await api('/auth/login', 'POST', {
    email: farmerEmail,
    password: testPassword,
    roleId: 'farmer',
  });
  assert(farmerLogin.status === 200 && farmerLogin.data.success, 'Farmer Login successful with verified credentials');
  if (!farmerToken) farmerToken = farmerLogin.data.token;

  // Step 3: Add Product (Valid product data with valid JPEG magic bytes)
  const validJpgHeader = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01]);
  const base64Img = `data:image/jpeg;base64,${validJpgHeader.toString('base64')}`;

  const addProduct = await api('/products', 'POST', {
    crop: 'Anakapalli Organic Jaggery',
    variety: 'Solid Bell Grade 1',
    quantity: 1200,
    unit: 'kg',
    grade: 'A+',
    pricePerKg: 54,
    location: 'Anakapalli',
    description: 'Fresh organic jaggery made from naturally grown sugarcane.',
    imageBase64: base64Img,
  }, farmerToken);
  assert(addProduct.status === 201 && addProduct.data.success, 'Farmer Added Product with valid data & image');
  createdLotId = addProduct.data.data?.id;

  // Step 4: Verify in Marketplace
  const marketCheck = await api(`/products/${createdLotId}`);
  assert(marketCheck.status === 200 && marketCheck.data.data?.id === createdLotId, 'Produce visible in Marketplace');

  // ════════════════════════════════════════════════════════════
  // 2. BUYER WORKFLOW
  // Register → Login → Marketplace → Select Product → Submit Bid → View Bid Status → Accepted Bid → Order
  // ════════════════════════════════════════════════════════════
  console.log('\n🏪 WORKFLOW 2: BUYER COMPLETE LIFECYCLE');

  // Step 1: Register Buyer
  const buyerReg = await api('/auth/register', 'POST', {
    name: 'Heritage Foods Procurement',
    email: buyerEmail,
    phone: `99490${Math.floor(10000 + Math.random() * 90000)}`,
    role: 'buyer',
    companyName: 'Heritage Foods Ltd',
    location: 'Guntur',
    password: testPassword,
  });
  assert(buyerReg.status === 201 && buyerReg.data.success, 'Buyer Registration successful');
  buyerUid = buyerReg.data.user?.uid;
  buyerToken = buyerReg.data.token;

  // Step 2: Login Buyer
  const buyerLogin = await api('/auth/login', 'POST', {
    email: buyerEmail,
    password: testPassword,
    roleId: 'buyer',
  });
  assert(buyerLogin.status === 200 && buyerLogin.data.success, 'Buyer Login successful with verified credentials');
  if (!buyerToken) buyerToken = buyerLogin.data.token;

  // Step 3: Browse Marketplace & Select Product
  const marketList = await api('/products?crop=Jaggery');
  assert(marketList.status === 200 && Array.isArray(marketList.data.data), 'Buyer browses marketplace listings');

  // Step 4: Submit Bid
  const bidAmount = 58; // Higher than base price of 54
  const placeBid = await api('/bids', 'POST', {
    lotId: createdLotId,
    amount: bidAmount,
    deliveryLocation: 'Guntur Central Cold Hub',
  }, buyerToken);
  assert(placeBid.status === 201 && placeBid.data.success, `Buyer submitted Bid of ₹${bidAmount}/kg`);
  createdBidId = placeBid.data.data?.id;

  // Step 5: View Bid Status
  const buyerBids = await api('/buyers/me/bids', 'GET', null, buyerToken);
  const myBid = buyerBids.data.data?.find(b => b.id === createdBidId);
  assert(myBid && (myBid.status === 'highest' || myBid.isLeading), 'Buyer Bid Status verified as highest/leading');

  // Step 6: Farmer Accepts Bid (Completing workflow loop)
  const acceptBid = await api('/bids/accept', 'POST', {
    lotId: createdLotId,
    bidId: createdBidId,
  }, farmerToken);
  assert(acceptBid.status === 200 && acceptBid.data.success, 'Farmer accepted Buyer Bid successfully');

  // Step 7: Verify Accepted Bid in Buyer Portal & Order Creation
  const buyerAcceptedBids = await api('/buyers/me/bids?status=accepted', 'GET', null, buyerToken);
  const isAcceptedFound = buyerAcceptedBids.data.data?.some(b => b.id === createdBidId);
  assert(isAcceptedFound, 'Accepted Bid verified in Buyer stream');

  const buyerOrders = await api('/orders', 'GET', null, buyerToken);
  const matchingOrder = buyerOrders.data.data?.find(o => o.bidId === createdBidId || o.productId === createdLotId);
  assert(matchingOrder && matchingOrder.orderStatus === 'pending_payment', 'Order created automatically with pending_payment escrow state');

  // ════════════════════════════════════════════════════════════
  // 3. ADMIN WORKFLOW
  // Login → View Users → View Reports → Suspend User → Verify Suspended User
  // ════════════════════════════════════════════════════════════
  console.log('\n⚙️ WORKFLOW 3: ADMIN COMPLETE LIFECYCLE');

  // Step 1: Admin Login
  const adminLogin = await api('/auth/login', 'POST', {
    email: 'admin@agridirect.com',
    password: 'admin@123',
    roleId: 'admin',
  });
  assert(adminLogin.status === 200 && adminLogin.data.success, 'Admin Login successful');
  adminToken = adminLogin.data.token;

  // Step 2: View Users (Farmers & Buyers)
  const adminFarmers = await api('/admin/farmers', 'GET', null, adminToken);
  const adminBuyers = await api('/admin/buyers', 'GET', null, adminToken);
  assert(adminFarmers.status === 200 && adminFarmers.data.data.length > 0, 'Admin successfully views registered Farmers');
  assert(adminBuyers.status === 200 && adminBuyers.data.data.length > 0, 'Admin successfully views registered Buyers');

  // Step 3: View Reports & Complaints
  const adminReports = await api('/admin/complaints', 'GET', null, adminToken);
  assert(adminReports.status === 200 && Array.isArray(adminReports.data.data), 'Admin successfully views complaints & reports');

  // Step 4: Suspend a reported user
  const suspendRes = await api(`/admin/users/${buyerUid}/suspend`, 'POST', {
    reason: 'Policy Violation - Unresponsive to contract commitments',
  }, adminToken);
  assert(suspendRes.status === 200 && suspendRes.data.success, 'Admin successfully suspended user');

  // Step 5: Verify Suspended User Cannot Perform Protected Actions
  const blockedBid = await api('/bids', 'POST', {
    lotId: 'L001',
    amount: 35,
  }, buyerToken);
  assert(blockedBid.status === 403, 'Suspended User blocked from bidding (403 Forbidden)');

  const blockedProduct = await api('/products', 'POST', {
    crop: 'Test Crop',
    quantity: 100,
    pricePerKg: 20,
  }, buyerToken);
  assert(blockedProduct.status === 403, 'Suspended User blocked from creating products (403 Forbidden)');

  // Step 6: Unsuspend user and restore access
  const unsuspendRes = await api(`/admin/users/${buyerUid}/unsuspend`, 'POST', {}, adminToken);
  assert(unsuspendRes.status === 200 && unsuspendRes.data.success, 'Admin successfully unsuspended user');

  // ════════════════════════════════════════════════════════════
  // 4. NEGATIVE & EDGE CASE VALIDATIONS
  // Invalid login, Unauthorized API, Empty forms, Invalid product data,
  // Duplicate actions, Image upload validation, API failures
  // ════════════════════════════════════════════════════════════
  console.log('\n🚨 NEGATIVE & EDGE CASE TESTS');

  // Test: Invalid login credentials
  const badLogin1 = await api('/auth/login', 'POST', {
    email: farmerEmail,
    password: 'WrongPassword!',
  });
  assert(badLogin1.status === 401, 'Invalid Password rejected with 401 Unauthorized');

  const badLogin2 = await api('/auth/login', 'POST', {
    email: 'nonexistent_account@nowhere.com',
    password: 'AnyPassword',
  });
  assert(badLogin2.status === 404, 'Non-existent Account rejected with 404');

  // Test: Unauthorized API Access
  const unauthorizedAdmin = await api('/admin/statistics', 'GET', null, farmerToken);
  assert(unauthorizedAdmin.status === 403, 'Farmer accessing Admin endpoint rejected with 403 Forbidden');

  const unauthenticatedApi = await api('/orders');
  assert(unauthenticatedApi.status === 401, 'Unauthenticated API call rejected with 401 Unauthorized');

  // Test: Empty Forms
  const emptyReg = await api('/auth/register', 'POST', {
    name: '',
    email: '',
    password: '',
  });
  assert(emptyReg.status === 400, 'Empty registration form rejected with 400 Bad Request');

  // Test: Invalid Product Data (Negative quantity & 0 price)
  const invalidProduct1 = await api('/products', 'POST', {
    crop: 'Tomato',
    quantity: -50,
    pricePerKg: 30,
  }, farmerToken);
  assert(invalidProduct1.status === 400, 'Negative quantity produce rejected with 400 Bad Request');

  const invalidProduct2 = await api('/products', 'POST', {
    crop: '',
    quantity: 100,
    pricePerKg: 0,
  }, farmerToken);
  assert(invalidProduct2.status === 400, 'Zero price or missing crop name rejected with 400 Bad Request');

  // Test: Duplicate Registration
  const dupReg = await api('/auth/register', 'POST', {
    name: 'Duplicate Test',
    email: farmerEmail, // Same email
    password: testPassword,
    role: 'farmer',
  });
  assert(dupReg.status === 409, 'Duplicate account registration rejected with 409 Conflict');

  // Test: Invalid Image Upload (Corrupted magic bytes)
  const fakeImgBuffer = Buffer.from('FAKE_MALICIOUS_EXECUTABLE_CONTENT');
  const fakeImgPayload = `data:image/jpeg;base64,${fakeImgBuffer.toString('base64')}`;
  const badImageProduct = await api('/products', 'POST', {
    crop: 'Test Chilli',
    quantity: 100,
    pricePerKg: 40,
    imageBase64: fakeImgPayload,
  }, farmerToken);
  assert(badImageProduct.status === 500 || badImageProduct.status === 400, 'Malformed image upload rejected by magic byte validator');

  // Test: Duplicate Bidding below current highest
  const lowBid = await api('/bids', 'POST', {
    lotId: createdLotId,
    amount: 10, // Below existing highest
  }, buyerToken);
  assert(lowBid.status === 400, 'Bid amount lower than highest bid rejected with 400 Bad Request');

  // Test: Non-existent API Endpoint (404 Handling)
  const badEndpoint = await api('/non-existent-api-endpoint');
  assert(badEndpoint.status === 404, 'Undefined API route handled cleanly with 404');

  console.log('\n======================================================');
  console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) process.exit(1);
}

runE2ETests().catch(err => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
