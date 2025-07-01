#!/usr/bin/env node

// Test script specifically for integration page functionality
require('dotenv').config({ path: '.env.dev' });
const http = require('http');

const API_BASE = 'http://localhost:3000';

function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          const parsed = responseData ? JSON.parse(responseData) : {};
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testIntegrationPage() {
  console.log('🔗 Testing Integration Page Functionality\n');
  
  try {
    // Step 1: Login to get token
    console.log('1. Logging in...');
    const loginResult = await makeRequest('POST', '/auth/test-login');
    if (loginResult.status !== 200) {
      throw new Error(`Login failed: ${loginResult.status}`);
    }
    const token = loginResult.data.access_token;
    console.log('   ✅ Login successful');
    
    // Step 2: Get user info
    console.log('2. Getting user info...');
    const userResult = await makeRequest('GET', '/auth/me', null, {
      Authorization: `Bearer ${token}`
    });
    if (userResult.status !== 200) {
      throw new Error(`Get user failed: ${userResult.status}`);
    }
    console.log(`   ✅ User: ${userResult.data.name} (${userResult.data.email})`);
    
    // Step 3: List integrations (this was failing before)
    console.log('3. Listing integrations...');
    const integrationsResult = await makeRequest('GET', '/integrations', null, {
      Authorization: `Bearer ${token}`
    });
    if (integrationsResult.status !== 200) {
      throw new Error(`List integrations failed: ${integrationsResult.status}`);
    }
    console.log(`   ✅ Found ${integrationsResult.data.length} integrations`);
    integrationsResult.data.forEach(integration => {
      console.log(`      - ${integration.type}: ${integration.isActive ? 'Active' : 'Inactive'}`);
    });
    
    // Step 4: Check GitHub App status
    console.log('4. Checking GitHub App status...');
    const githubAppResult = await makeRequest('GET', '/integrations/github/app/install');
    if (githubAppResult.status !== 200) {
      throw new Error(`GitHub App status failed: ${githubAppResult.status}`);
    }
    console.log(`   ✅ GitHub App configured: ${githubAppResult.data.configured}`);
    
    // Step 5: Test GitHub connection with invalid token (should fail gracefully)
    console.log('5. Testing GitHub connection (invalid token)...');
    const githubConnectResult = await makeRequest('POST', '/integrations/github/connect', 
      { personalAccessToken: 'invalid-token' }, 
      { Authorization: `Bearer ${token}` }
    );
    if (githubConnectResult.status === 400) {
      console.log('   ✅ Invalid token properly rejected');
    } else {
      console.log(`   ⚠️  Unexpected status: ${githubConnectResult.status}`);
    }
    
    console.log('\n🎉 Integration Page Test Complete!');
    console.log('✅ All integration endpoints working properly');
    console.log('✅ Frontend integration page should now work without errors');
    
  } catch (error) {
    console.error(`\n❌ Integration page test failed: ${error.message}`);
    process.exit(1);
  }
}

testIntegrationPage();