// Test script to verify API protection
// Run this with: node test-api-protection.js

const BASE_URL = 'http://localhost:3000';

async function testApiProtection() {
  console.log('🧪 Testing API Protection...\n');

  const endpoints = [
    '/api/v1/users',
    '/api/v1/product',
    '/api/v1/sale',
    '/api/v1/purchase',
    '/api/v1/notification'
  ];

  for (const endpoint of endpoints) {
    console.log(`Testing ${endpoint}...`);
    
    try {
      // Test without authentication
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        console.log(`✅ ${endpoint} - Properly protected (401 Unauthorized)`);
      } else {
        console.log(`❌ ${endpoint} - NOT protected (Status: ${response.status})`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint} - Error: ${error.message}`);
    }
  }

  console.log('\n🎯 Test completed!');
  console.log('✅ All endpoints should return 401 Unauthorized when accessed without authentication');
}

// Run the test
testApiProtection().catch(console.error); 