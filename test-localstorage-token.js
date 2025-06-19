const fetch = require('node-fetch');

// Test script to verify middleware handles localStorage tokens via custom headers
async function testLocalStorageTokenHandling() {
  console.log('🧪 Testing localStorage token handling in middleware...\n');

  // First, login to get a token
  console.log('1. Logging in to get JWT token...');
  const loginResponse = await fetch('http://localhost:3000/api/v1/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: 'admin',
      password: 'admin123'
    })
  });

  if (!loginResponse.ok) {
    console.error('❌ Login failed:', loginResponse.status, loginResponse.statusText);
    return;
  }

  const loginData = await loginResponse.json();
  const token = loginData.token;
  
  if (!token) {
    console.error('❌ No token received from login');
    return;
  }

  console.log('✅ Login successful, token received\n');

  // Test 1: API call with Authorization header (standard)
  console.log('2. Testing API call with Authorization header...');
  const authResponse = await fetch('http://localhost:3000/api/v1/users', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });

  if (authResponse.ok) {
    console.log('✅ Authorization header works correctly');
  } else {
    console.log('❌ Authorization header failed:', authResponse.status);
  }

  // Test 2: API call with x-auth-token header (localStorage fallback)
  console.log('\n3. Testing API call with x-auth-token header (localStorage fallback)...');
  const customHeaderResponse = await fetch('http://localhost:3000/api/v1/users', {
    headers: {
      'x-auth-token': token,
      'Content-Type': 'application/json',
    }
  });

  if (customHeaderResponse.ok) {
    console.log('✅ x-auth-token header works correctly (localStorage fallback)');
  } else {
    console.log('❌ x-auth-token header failed:', customHeaderResponse.status);
  }

  // Test 3: API call with cookie (another fallback)
  console.log('\n4. Testing API call with cookie...');
  const cookieResponse = await fetch('http://localhost:3000/api/v1/users', {
    headers: {
      'Cookie': `auth_token=${token}`,
      'Content-Type': 'application/json',
    }
  });

  if (cookieResponse.ok) {
    console.log('✅ Cookie fallback works correctly');
  } else {
    console.log('❌ Cookie fallback failed:', cookieResponse.status);
  }

  // Test 4: API call without any token (should fail)
  console.log('\n5. Testing API call without any token (should fail)...');
  const noTokenResponse = await fetch('http://localhost:3000/api/v1/users', {
    headers: {
      'Content-Type': 'application/json',
    }
  });

  if (noTokenResponse.status === 401) {
    console.log('✅ Correctly rejected request without token');
  } else {
    console.log('❌ Unexpected response for request without token:', noTokenResponse.status);
  }

  // Test 5: Test with invalid token
  console.log('\n6. Testing API call with invalid token...');
  const invalidTokenResponse = await fetch('http://localhost:3000/api/v1/users', {
    headers: {
      'Authorization': 'Bearer invalid_token_here',
      'Content-Type': 'application/json',
    }
  });

  if (invalidTokenResponse.status === 401) {
    console.log('✅ Correctly rejected request with invalid token');
  } else {
    console.log('❌ Unexpected response for invalid token:', invalidTokenResponse.status);
  }

  console.log('\n🎉 localStorage token handling test completed!');
  console.log('\n📋 Summary:');
  console.log('- The middleware now checks for tokens in multiple places:');
  console.log('  1. Authorization header (primary)');
  console.log('  2. Cookie (fallback)');
  console.log('  3. x-auth-token header (localStorage fallback)');
  console.log('- Components can use fetchWithAuth() utilities to automatically include tokens');
  console.log('- This ensures maximum compatibility and fallback options');
}

// Run the test
testLocalStorageTokenHandling().catch(console.error); 