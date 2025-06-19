// Test script to verify complete authentication flow
// Run this with: node test-complete-auth-flow.js

const BASE_URL = 'http://localhost:3000';

async function testCompleteAuthFlow() {
  console.log('🧪 Testing Complete Authentication Flow...\n');

  try {
    // Step 1: Test login
    console.log('Step 1: Testing login...');
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
    
    if (!loginData.success) {
      console.log('❌ Login failed:', loginData.error);
      return;
    }

    console.log('✅ Login successful');
    const token = loginData.data.token;
    const user = loginData.data.user;

    console.log(`User: ${user.name} (${user.role})`);
    console.log(`Token: ${token.substring(0, 50)}...`);

    // Step 2: Test API access with token
    console.log('\nStep 2: Testing API access with token...');
    const apiResponse = await fetch(`${BASE_URL}/api/v1/users`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (apiResponse.status === 200) {
      const apiData = await apiResponse.json();
      console.log('✅ API access successful');
      console.log(`Found ${apiData.data?.length || 0} users`);
    } else {
      console.log(`❌ API access failed: ${apiResponse.status}`);
    }

    // Step 3: Test page access simulation (with cookie)
    console.log('\nStep 3: Testing page access simulation...');
    const pageResponse = await fetch(`${BASE_URL}/users`, {
      headers: {
        'Cookie': `auth_token=${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (pageResponse.status === 200) {
      console.log('✅ Page access successful (with valid token in cookie)');
    } else if (pageResponse.status === 302 || pageResponse.status === 307) {
      const location = pageResponse.headers.get('location');
      console.log(`⚠️ Page redirects to: ${location}`);
      if (location && location.includes('/auth')) {
        console.log('✅ Proper redirect to auth page when token invalid/missing');
      }
    } else {
      console.log(`❌ Page access unexpected status: ${pageResponse.status}`);
    }

    // Step 4: Test without token
    console.log('\nStep 4: Testing access without token...');
    const noTokenResponse = await fetch(`${BASE_URL}/api/v1/users`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (noTokenResponse.status === 401) {
      console.log('✅ API properly rejects requests without token');
    } else {
      console.log(`❌ API should reject without token: ${noTokenResponse.status}`);
    }

    // Step 5: Test page without cookie
    console.log('\nStep 5: Testing page access without cookie...');
    const noCookieResponse = await fetch(`${BASE_URL}/users`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (noCookieResponse.status === 302 || noCookieResponse.status === 307) {
      const location = noCookieResponse.headers.get('location');
      if (location && location.includes('/auth')) {
        console.log('✅ Page properly redirects to auth when no cookie');
      } else {
        console.log(`❌ Page redirects to unexpected location: ${location}`);
      }
    } else {
      console.log(`❌ Page should redirect without cookie: ${noCookieResponse.status}`);
    }

    // Step 6: Test playground page (should work with token)
    console.log('\nStep 6: Testing playground page...');
    const playgroundResponse = await fetch(`${BASE_URL}/playground`, {
      headers: {
        'Cookie': `auth_token=${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (playgroundResponse.status === 200) {
      console.log('✅ Playground page accessible with token');
    } else {
      console.log(`⚠️ Playground page status: ${playgroundResponse.status}`);
    }

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }

  console.log('\n🎯 Complete authentication flow test finished!');
  console.log('\n📋 Expected Behavior:');
  console.log('- Login should return JWT token');
  console.log('- API routes should require Authorization header');
  console.log('- Page routes should require auth_token cookie');
  console.log('- Invalid/missing tokens should redirect to /auth');
  console.log('- Valid tokens should allow access to protected routes');
}

// Run the test
testCompleteAuthFlow().catch(console.error); 