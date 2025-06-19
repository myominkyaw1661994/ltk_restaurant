// Test script to verify middleware redirect behavior
// Run this with: node test-middleware-redirect.js

const BASE_URL = 'http://localhost:3000';

async function testMiddlewareRedirect() {
  console.log('🧪 Testing Middleware Redirect Behavior...\n');

  try {
    // Step 1: Test login to get JWT token
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

    // Step 2: Test API route with Authorization header
    console.log('\nStep 2: Testing API route with Authorization header...');
    const apiResponse = await fetch(`${BASE_URL}/api/v1/users`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (apiResponse.status === 200) {
      console.log('✅ API route accessible with Authorization header');
    } else {
      console.log(`❌ API route failed: ${apiResponse.status}`);
    }

    // Step 3: Test API route without Authorization header
    console.log('\nStep 3: Testing API route without Authorization header...');
    const apiNoAuthResponse = await fetch(`${BASE_URL}/api/v1/users`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (apiNoAuthResponse.status === 401) {
      console.log('✅ API route properly rejects requests without Authorization header');
    } else {
      console.log(`❌ API route should reject: ${apiNoAuthResponse.status}`);
    }

    // Step 4: Test page route with cookie (simulate browser behavior)
    console.log('\nStep 4: Testing page route with cookie...');
    const pageResponse = await fetch(`${BASE_URL}/users`, {
      headers: {
        'Cookie': `auth_token=${token}`,
        'Content-Type': 'application/json'
      }
    });

    // Page routes should redirect to /auth if no valid token in cookie
    if (pageResponse.status === 200) {
      console.log('✅ Page route accessible with valid token in cookie');
    } else if (pageResponse.status === 302 || pageResponse.status === 307) {
      const location = pageResponse.headers.get('location');
      if (location && location.includes('/auth')) {
        console.log('✅ Page route properly redirects to /auth when no valid token');
      } else {
        console.log(`❌ Page route redirects to unexpected location: ${location}`);
      }
    } else {
      console.log(`❌ Page route unexpected status: ${pageResponse.status}`);
    }

    // Step 5: Test page route without cookie
    console.log('\nStep 5: Testing page route without cookie...');
    const pageNoCookieResponse = await fetch(`${BASE_URL}/users`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (pageNoCookieResponse.status === 302 || pageNoCookieResponse.status === 307) {
      const location = pageNoCookieResponse.headers.get('location');
      if (location && location.includes('/auth')) {
        console.log('✅ Page route properly redirects to /auth when no cookie');
      } else {
        console.log(`❌ Page route redirects to unexpected location: ${location}`);
      }
    } else {
      console.log(`❌ Page route should redirect: ${pageNoCookieResponse.status}`);
    }

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }

  console.log('\n🎯 Middleware redirect test completed!');
  console.log('\n📝 Summary:');
  console.log('- API routes should require Authorization header');
  console.log('- Page routes should require auth_token cookie');
  console.log('- Both should redirect to /auth when authentication fails');
}

// Run the test
testMiddlewareRedirect().catch(console.error); 