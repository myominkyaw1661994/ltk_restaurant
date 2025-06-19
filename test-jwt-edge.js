// Test script to verify JWT works with Edge Runtime
// Run this with: node test-jwt-edge.js

const BASE_URL = 'http://localhost:3000';

async function testJWTEdge() {
  console.log('🧪 Testing JWT with Edge Runtime...\n');

  try {
    // Test login endpoint
    console.log('Testing login endpoint...');
    const loginResponse = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'password123'
      })
    });

    const loginData = await loginResponse.json();
    
    if (loginData.success && loginData.data.token) {
      console.log('✅ Login successful - JWT token generated');
      console.log(`Token: ${loginData.data.token.substring(0, 50)}...`);
      
      // Test protected endpoint with token
      console.log('\nTesting protected endpoint with JWT token...');
      const protectedResponse = await fetch(`${BASE_URL}/api/v1/users`, {
        headers: {
          'Authorization': `Bearer ${loginData.data.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (protectedResponse.status === 200) {
        console.log('✅ Protected endpoint accessible with JWT token');
      } else {
        console.log(`❌ Protected endpoint failed: ${protectedResponse.status}`);
      }

      // Test without token
      console.log('\nTesting protected endpoint without token...');
      const noTokenResponse = await fetch(`${BASE_URL}/api/v1/users`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (noTokenResponse.status === 401) {
        console.log('✅ Protected endpoint properly rejects requests without token');
      } else {
        console.log(`❌ Protected endpoint should reject: ${noTokenResponse.status}`);
      }

    } else {
      console.log('❌ Login failed:', loginData.error);
    }

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }

  console.log('\n🎯 JWT Edge Runtime test completed!');
}

// Run the test
testJWTEdge().catch(console.error); 