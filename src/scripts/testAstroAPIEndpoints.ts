/**
 * Test script to discover correct astrology-api.io endpoints
 */

// Import axios - use require for better ts-node compatibility
// Fallback to fetch if axios is not available
let axios: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  axios = require('axios');
} catch (e) {
  // Fallback to fetch API (Node 18+)
  console.warn('axios not found, using fetch API');
  axios = {
    post: async (url: string, data: any, config?: any) => {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config?.headers || {}),
        },
        body: JSON.stringify(data),
      });
      return {
        data: await response.json(),
        status: response.status,
        statusText: response.statusText,
      };
    },
  };
}

const RAPIDAPI_KEY = 'd192d39508msh198e746e2483293p1b0994jsn9c796afb4368';
const API_BASE = 'https://api.astrology-api.io';
const RAPIDAPI_HOST = 'api.astrology-api.io';

// Test data
const testData = {
  year: 1979,
  month: 11,
  day: 10,
  hour: 12,
  minute: 1,
  lat: 61.2181,
  lon: -149.9003,
  tzone: -9
};

// Alternative data format
const testData2 = {
  date: '1979-11-10',
  time: '12:01:00',
  latitude: 61.2181,
  longitude: -149.9003,
  timezone: 'America/Anchorage'
};

// Possible endpoints based on common astrology API patterns
const endpoints = [
  // Western astrology
  '/western/planets',
  '/western/natal',
  '/western/chart',
  '/western/natal-chart',
  '/western/birth-chart',
  '/planets',
  '/natal',
  '/chart',
  
  // With v1/v2/v3 prefix
  '/v1/western/planets',
  '/v2/western/planets',
  '/v3/western/planets',
  '/v1/planets',
  
  // Raw data endpoints (from rapidoc mention)
  '/raw/planets',
  '/raw/positions',
  '/positions',
  
  // Calculate endpoints
  '/calculate/planets',
  '/calculate/chart',
];

interface EndpointResult {
  endpoint: string;
  success: boolean;
  data?: any;
  status?: number;
  error?: string;
}

async function testEndpoint(endpoint: string, data: any, dataFormat: string): Promise<EndpointResult> {
  try {
    console.log(`\n📡 Testing: ${endpoint} (${dataFormat})`);
    const response = await axios.post(
      `${API_BASE}${endpoint}`,
      data,
      {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': RAPIDAPI_HOST,
          'Content-Type': 'application/json'
        },
        timeout: 5000,
        validateStatus: () => true // Don't throw on any status code
      }
    );
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.status === 200) {
      console.log(`   ✅ SUCCESS!`);
      console.log(`   Response type:`, typeof response.data);
      console.log(`   Response keys:`, response.data ? Object.keys(response.data) : 'null');
      console.log(`   Response preview:`, JSON.stringify(response.data).substring(0, 200));
      return { endpoint, success: true, data: response.data };
    } else if (response.status === 404) {
      console.log(`   ❌ Not found`);
    } else if (response.status === 401 || response.status === 403) {
      console.log(`   🔒 Auth error`);
      console.log(`   Message:`, response.data?.message || response.data?.detail);
    } else if (response.status === 422) {
      console.log(`   ⚠️  Validation error (wrong data format)`);
      console.log(`   Details:`, JSON.stringify(response.data, null, 2).substring(0, 300));
    } else {
      console.log(`   ⚠️  Other error`);
      console.log(`   Data:`, JSON.stringify(response.data).substring(0, 200));
    }
    
    return { endpoint, success: false, status: response.status };
  } catch (error: any) {
    console.log(`   💥 Request failed:`, error.message);
    return { endpoint, success: false, error: error.message };
  }
}

async function discoverEndpoints() {
  console.log('🔍 Discovering astrology-api.io endpoints...\n');
  console.log('API Base:', API_BASE);
  console.log('RapidAPI Key:', RAPIDAPI_KEY.substring(0, 20) + '...');
  console.log('RapidAPI Host:', RAPIDAPI_HOST);
  
  const results: EndpointResult[] = [];
  
  // Test with format 1 (year/month/day/hour/minute/lat/lon/tzone)
  console.log('\n=== Testing with format 1 (year/month/day/lat/lon/tzone) ===');
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint, testData, 'format1');
    results.push(result);
    
    if (result.success) {
      console.log('\n🎉 FOUND WORKING ENDPOINT!');
      console.log('Endpoint:', endpoint);
      console.log('Data format:', testData);
      break; // Stop on first success
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // If no success, try format 2
  const hasSuccess = results.some(r => r.success);
  if (!hasSuccess) {
    console.log('\n=== Testing with format 2 (date/time/latitude/longitude/timezone) ===');
    for (const endpoint of endpoints.slice(0, 5)) { // Just try a few with alt format
      const result = await testEndpoint(endpoint, testData2, 'format2');
      results.push(result);
      
      if (result.success) {
        console.log('\n🎉 FOUND WORKING ENDPOINT!');
        console.log('Endpoint:', endpoint);
        console.log('Data format:', testData2);
        break;
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  
  const successes = results.filter(r => r.success);
  const notFounds = results.filter(r => r.status === 404);
  const authErrors = results.filter(r => r.status === 401 || r.status === 403);
  const validationErrors = results.filter(r => r.status === 422);
  
  console.log(`✅ Successes: ${successes.length}`);
  console.log(`❌ 404 Not Found: ${notFounds.length}`);
  console.log(`🔒 Auth Errors: ${authErrors.length}`);
  console.log(`⚠️  Validation Errors: ${validationErrors.length}`);
  
  if (successes.length > 0) {
    console.log('\n✨ WORKING ENDPOINT:');
    console.log(successes[0]);
  } else if (authErrors.length > 0) {
    console.log('\n⚠️  AUTH ISSUE: Check your RapidAPI subscription and key');
  } else if (validationErrors.length > 0) {
    console.log('\n⚠️  DATA FORMAT ISSUE: Found endpoint but wrong data format');
    console.log('Try adjusting the request data structure');
  } else {
    console.log('\n❌ NO WORKING ENDPOINTS FOUND');
    console.log('Possible issues:');
    console.log('1. Wrong RapidAPI key or not subscribed');
    console.log('2. API requires different authentication');
    console.log('3. Endpoints have changed - check docs at https://api.astrology-api.io/rapidoc');
  }
}

discoverEndpoints().catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});

