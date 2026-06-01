const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BASE_URL = 'http://localhost:3000';

async function testAPI() {
  console.log('🧪 Testing RZN Risen APIs...\n');
  
  // Test 1: Database Test
  console.log('1. Testing /api/db-test');
  try {
    const dbRes = await fetch(`${BASE_URL}/api/db-test`);
    const dbData = await dbRes.json();
    console.log('   ✅ Database:', dbData.success ? 'Connected' : 'Failed');
    console.log('   📊 Users:', dbData.userCount);
  } catch (e) {
    console.log('   ❌ Error:', e.message);
  }
  
  // Test 2: Login
  console.log('\n2. Testing /api/login');
  let adminToken = '';
  try {
    const loginRes = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'RZN.admin', password: 'admin123' })
    });
    const loginData = await loginRes.json();
    console.log('   ✅ Login:', loginData.success ? 'Success' : 'Failed');
    if (loginData.token) {
      console.log('   🔑 Token received:', loginData.token.substring(0, 20) + '...');
      adminToken = loginData.token;
    }
  } catch (e) {
    console.log('   ❌ Error:', e.message);
  }
  
  // Test 3: Get Pending Members (needs auth)
  console.log('\n3. Testing /api/getPending');
  try {
    const pendingRes = await fetch(`${BASE_URL}/api/getPending`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const pendingData = await pendingRes.json();
    console.log('   ✅ Get Pending:', pendingData.success ? 'Success' : 'Failed');
    if (pendingData.members) {
      console.log('   📋 Pending members:', pendingData.members.length);
      if (pendingData.members.length > 0) {
        console.log('   🖼️  Avatar field:', pendingData.members[0].avatar !== undefined ? 'Included' : 'Missing');
      }
    }
  } catch (e) {
    console.log('   ❌ Error:', e.message);
  }
  
  // Test 4: Get All Members (needs auth)
  console.log('\n4. Testing /api/getAllMembers');
  try {
    const membersRes = await fetch(`${BASE_URL}/api/getAllMembers`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const membersData = await membersRes.json();
    console.log('   ✅ Get All Members:', membersData.success ? 'Success' : 'Failed');
    if (membersData.members) {
      console.log('   📋 Total members:', membersData.members.length);
      if (membersData.members.length > 0) {
        console.log('   🖼️  Avatar field:', membersData.members[0].avatar !== undefined ? 'Included' : 'Missing');
      }
    }
  } catch (e) {
    console.log('   ❌ Error:', e.message);
  }
  
  // Test 5: Get Members
  console.log('\n5. Testing /api/getMembers');
  try {
    const getMembersRes = await fetch(`${BASE_URL}/api/getMembers`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const getMembersData = await getMembersRes.json();
    console.log('   ✅ Get Members:', getMembersData.success ? 'Success' : 'Failed');
    if (getMembersData.members) {
      console.log('   📋 Members:', getMembersData.members.length);
    }
  } catch (e) {
    console.log('   ❌ Error:', e.message);
  }
  
  // Test 6: Get Leaders
  console.log('\n6. Testing /api/getLeaders');
  try {
    const leadersRes = await fetch(`${BASE_URL}/api/getLeaders`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const leadersData = await leadersRes.json();
    console.log('   ✅ Get Leaders:', leadersData.success ? 'Success' : 'Failed');
    if (leadersData.members) {
      console.log('   📋 Leaders:', leadersData.members.length);
    }
  } catch (e) {
    console.log('   ❌ Error:', e.message);
  }
  
  console.log('\n✅ All tests completed!');
}

testAPI();
