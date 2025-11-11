const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testAPI() {
  console.log('🧪 Testing Quizzy API Endpoints\n');

  try {
    // Test server health
    console.log('1. Testing server health...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Server is healthy');
  } catch (error) {
    console.log('⚠️  Health check endpoint not available (expected without DB)');
  }

  // Test authentication endpoints (will fail without DB, but should return proper error)
  console.log('\n2. Testing authentication endpoints...');
  try {
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@secureexam.com',
      password: 'admin123'
    });
    console.log('✅ Login endpoint working');
  } catch (error) {
    if (error.response?.status === 500) {
      console.log('⚠️  Login endpoint returns 500 (expected without DB connection)');
    } else {
      console.log('❌ Login endpoint error:', error.response?.data?.message || error.message);
    }
  }

  // Test exam endpoints
  console.log('\n3. Testing exam endpoints...');
  try {
    const examsResponse = await axios.get(`${BASE_URL}/exams`);
    console.log('✅ Exams endpoint working');
  } catch (error) {
    if (error.response?.status === 500) {
      console.log('⚠️  Exams endpoint returns 500 (expected without DB connection)');
    } else {
      console.log('❌ Exams endpoint error:', error.response?.data?.message || error.message);
    }
  }

  // Test analytics endpoints
  console.log('\n4. Testing analytics endpoints...');
  try {
    const analyticsResponse = await axios.get(`${BASE_URL}/analytics/overview`);
    console.log('✅ Analytics endpoint working');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Analytics endpoint requires authentication (as expected)');
    } else if (error.response?.status === 500) {
      console.log('⚠️  Analytics endpoint returns 500 (expected without DB connection)');
    } else {
      console.log('❌ Analytics endpoint error:', error.response?.data?.message || error.message);
    }
  }

  console.log('\n🎉 API testing completed!');
  console.log('\n📋 Next Steps:');
  console.log('1. Set up MongoDB (local or Atlas)');
  console.log('2. Update MONGODB_URI in .env file');
  console.log('3. Run: npm run seed');
  console.log('4. Test with real database connection');
  console.log('5. Start frontend: cd ../frontend && npm start');
}

// Run tests
testAPI().catch(console.error);