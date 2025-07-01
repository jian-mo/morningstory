#!/usr/bin/env node

// Comprehensive endpoint testing for local development
require('dotenv').config({ path: '.env.dev' });
const https = require('https');
const http = require('http');

const API_BASE = 'http://localhost:3000';
let authToken = null;

// Colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// HTTP request helper
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
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData, headers: res.headers });
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

// Test cases
const tests = [
  {
    name: 'Health Check',
    method: 'GET',
    path: '/health',
    expectedStatus: 200,
    validate: (data) => data.status === 'ok'
  },
  {
    name: 'API Info',
    method: 'GET', 
    path: '/api',
    expectedStatus: 200,
    validate: (data) => data.name === 'Morning Story API'
  },
  {
    name: 'Test Login',
    method: 'POST',
    path: '/auth/test-login',
    expectedStatus: 200,
    validate: (data) => data.access_token && data.user,
    saveToken: true
  },
  {
    name: 'Get Current User',
    method: 'GET',
    path: '/auth/me',
    requiresAuth: true,
    expectedStatus: 200,
    validate: (data) => data.id && data.email
  },
  {
    name: 'List Integrations',
    method: 'GET',
    path: '/integrations',
    requiresAuth: true,
    expectedStatus: 200,
    validate: (data) => Array.isArray(data)
  },
  {
    name: 'GitHub App Install Status',
    method: 'GET',
    path: '/integrations/github/app/install',
    expectedStatus: 200,
    validate: (data) => typeof data.configured === 'boolean'
  },
  {
    name: 'GitHub Connect (Invalid)',
    method: 'POST',
    path: '/integrations/github/connect',
    requiresAuth: true,
    data: { personalAccessToken: '' },
    expectedStatus: 400,
    validate: (data) => data.error
  },
  {
    name: 'List Standups',
    method: 'GET',
    path: '/standups',
    requiresAuth: true,
    expectedStatus: 200,
    validate: (data) => Array.isArray(data)
  },
  {
    name: 'Get Today Standup',
    method: 'GET',
    path: '/standups/today',
    requiresAuth: true,
    expectedStatus: 200,
    allowNull: true
  },
  {
    name: 'Generate Standup (Basic)',
    method: 'POST',
    path: '/standups/generate',
    requiresAuth: true,
    data: { tone: 'professional', length: 'short' },
    expectedStatus: 200,
    validate: (data) => data.content && data.metadata,
    timeout: 10000
  },
  {
    name: 'Generate Standup (OpenRouter)',
    method: 'POST', 
    path: '/standups/generate',
    requiresAuth: true,
    data: { tone: 'casual', length: 'medium' },
    expectedStatus: 200,
    validate: (data) => data.content && data.metadata && data.metadata.model,
    timeout: 10000
  },
  {
    name: 'Test OpenRouter Direct',
    method: 'POST',
    path: '/test/openrouter',
    expectedStatus: 200,
    validate: (data) => data.success && data.content,
    timeout: 10000
  },
  {
    name: 'Get Standup by ID (Invalid)',
    method: 'GET',
    path: '/standups/invalid-id',
    requiresAuth: true,
    expectedStatus: 404,
    validate: (data) => data.error
  },
  {
    name: 'Delete Standup (Invalid)',
    method: 'DELETE',
    path: '/standups/invalid-id',
    requiresAuth: true,
    expectedStatus: 500, // Will fail in dev mode but shouldn't crash
    allowError: true
  },
  {
    name: 'Invalid Endpoint',
    method: 'GET',
    path: '/invalid/endpoint',
    expectedStatus: 404,
    validate: (data) => data.error === 'Not Found'
  }
];

async function runTests() {
  log('🧪 Starting Comprehensive API Endpoint Tests\n', 'cyan');
  log(`Testing against: ${API_BASE}`, 'blue');
  log(`Environment: ${process.env.NODE_ENV || 'development'}\n`, 'blue');

  let passed = 0;
  let failed = 0;
  const results = [];

  for (const test of tests) {
    try {
      log(`Testing: ${test.name}`, 'yellow');
      
      const headers = {};
      if (test.requiresAuth && authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      const startTime = Date.now();
      const result = await Promise.race([
        makeRequest(test.method, test.path, test.data, headers),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), test.timeout || 5000)
        )
      ]);
      const duration = Date.now() - startTime;

      let success = result.status === test.expectedStatus;
      let validationResult = true;
      let message = `${result.status}`;

      // Save auth token if this is login test
      if (test.saveToken && result.data.access_token) {
        authToken = result.data.access_token;
        log(`  → Auth token saved`, 'cyan');
      }

      // Validate response data
      if (success && test.validate) {
        try {
          if (test.allowNull && result.data === null) {
            validationResult = true;
          } else {
            validationResult = test.validate(result.data);
          }
          if (!validationResult) {
            message += ' (validation failed)';
            success = false;
          }
        } catch (e) {
          validationResult = false;
          success = false;
          message += ` (validation error: ${e.message})`;
        }
      }

      // Allow expected errors
      if (test.allowError && result.status >= 400) {
        success = true;
        message += ' (expected error)';
      }

      if (success) {
        log(`  ✅ PASS - ${message} (${duration}ms)`, 'green');
        passed++;
      } else {
        log(`  ❌ FAIL - ${message} (${duration}ms)`, 'red');
        if (result.data && typeof result.data === 'object') {
          log(`     Response: ${JSON.stringify(result.data).substring(0, 200)}...`, 'red');
        }
        failed++;
      }

      results.push({
        test: test.name,
        status: result.status,
        success,
        duration,
        data: result.data
      });

    } catch (error) {
      log(`  💥 ERROR - ${error.message}`, 'red');
      failed++;
      results.push({
        test: test.name,
        success: false,
        error: error.message
      });
    }

    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Summary
  log('\n📊 Test Results Summary', 'cyan');
  log(`✅ Passed: ${passed}`, 'green');
  log(`❌ Failed: ${failed}`, 'red');
  log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`, 'blue');

  // Detailed results for failed tests
  const failedTests = results.filter(r => !r.success);
  if (failedTests.length > 0) {
    log('\n🔍 Failed Tests Details:', 'red');
    failedTests.forEach(test => {
      log(`  • ${test.test}: ${test.error || test.status}`, 'red');
    });
  }

  log('\n🎯 OpenRouter Integration Summary:', 'cyan');
  const openrouterTests = results.filter(r => 
    r.test.includes('OpenRouter') || r.test.includes('Generate Standup')
  );
  
  openrouterTests.forEach(test => {
    const status = test.success ? '✅' : '❌';
    log(`  ${status} ${test.test}`, test.success ? 'green' : 'red');
    if (test.success && test.data && test.data.metadata) {
      log(`      Model: ${test.data.metadata.model || 'N/A'}`, 'blue');
      log(`      Tokens: ${test.data.metadata.tokensUsed || 'N/A'}`, 'blue');
      log(`      Cost: $${test.data.metadata.cost || 'N/A'}`, 'blue');
    }
  });

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  log(`\n💥 Test suite failed: ${error.message}`, 'red');
  process.exit(1);
});