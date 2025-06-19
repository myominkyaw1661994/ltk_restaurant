// Test script to verify login endpoint
// Run this with: node test-login.js

const BASE_URL = 'http://localhost:3000';

async function testLogin() {
  console.log('🧪 Testing Login Endpoint...\n');

  const testCases = [
    {
      name: 'Valid Login',
      data: {
        username: 'admin',
        password: 'password123'
      },
      expected: 'success'
    },
    {
      name: 'Invalid Username',
      data: {
        username: 'nonexistent',
        password: 'password123'
      },
      expected: 'error'
    },
    {
      name: 'Invalid Password',
      data: {
        username: 'admin',
        password: 'wrongpassword'
      },
      expected: 'error'
    },
    {
      name: 'Missing Username',
      data: {
        password: 'password123'
      },
      expected: 'error'
    },
    {
      name: 'Missing Password',
      data: {
        username: 'admin'
      },
      expected: 'error'
    }
  ];

  for (const testCase of testCases) {
    console.log(`Testing: ${testCase.name}...`);
    
    try {
      const response = await fetch(`${BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testCase.data)
      });

      const data = await response.json();

      if (testCase.expected === 'success' && data.success) {
        console.log(`✅ ${testCase.name} - Success (Token: ${data.data.token.substring(0, 20)}...)`);
      } else if (testCase.expected === 'error' && !data.success) {
        console.log(`✅ ${testCase.name} - Expected error: ${data.error}`);
      } else {
        console.log(`❌ ${testCase.name} - Unexpected result:`, data);
      }
    } catch (error) {
      console.log(`❌ ${testCase.name} - Error: ${error.message}`);
    }
  }

  console.log('\n🎯 Login test completed!');
}

// Run the test
testLogin().catch(console.error); 