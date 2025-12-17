import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const loginDuration = new Trend('login_duration');
const apiDuration = new Trend('api_duration');
const failedLogins = new Counter('failed_logins');

// Test configuration with AI-optimized stages
export const options = {
  stages: [
    { duration: '2m', target: 10 },   // Warm-up
    { duration: '5m', target: 50 },   // Ramp-up to normal load
    { duration: '10m', target: 100 }, // Steady state
    { duration: '3m', target: 200 },  // Spike test
    { duration: '5m', target: 100 },  // Recovery
    { duration: '2m', target: 0 },    // Ramp-down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500', 'p(99)<1000'], // 95% < 500ms, 99% < 1s
    'http_req_failed': ['rate<0.05'],                  // Error rate < 5%
    'errors': ['rate<0.1'],                            // Custom error rate < 10%
    'login_duration': ['p(95)<1000'],                  // Login < 1s
  },
  ext: {
    loadimpact: {
      projectID: 3596111,
      name: 'REE Load Test'
    }
  }
};

// Test data
const BASE_URL = __ENV.API_URL || 'http://localhost:5000';
const USERS = [
  { email: 'agent1@ree.ma', password: 'Agent2024!' },
  { email: 'agent2@ree.ma', password: 'Agent2024!' },
  { email: 'supervisor@ree.ma', password: 'Supervisor2024!' },
];

// Helper function to get random user
function getRandomUser() {
  return USERS[Math.floor(Math.random() * USERS.length)];
}

// Setup: Create test users if needed
export function setup() {
  console.log('🚀 Starting load test setup...');

  // Check API health
  const healthCheck = http.get(`${BASE_URL}/health`);
  check(healthCheck, {
    'API is healthy': (r) => r.status === 200,
  });

  return { startTime: new Date().toISOString() };
}

// Main test scenario
export default function(data) {
  // Test 1: Authentication Flow
  group('Authentication', () => {
    const user = getRandomUser();
    const loginPayload = JSON.stringify({
      email: user.email,
      password: user.password,
    });

    const params = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const loginStart = new Date();
    const loginRes = http.post(
      `${BASE_URL}/api/auth/login`,
      loginPayload,
      params
    );
    const loginEnd = new Date();

    const loginSuccess = check(loginRes, {
      'login status is 200': (r) => r.status === 200,
      'login has access token': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.accessToken !== undefined;
        } catch {
          return false;
        }
      },
    });

    if (loginSuccess) {
      loginDuration.add(loginEnd - loginStart);
      const authData = JSON.parse(loginRes.body);
      const token = authData.accessToken;

      // Test 2: Mobile API - Get Addresses
      group('Mobile API - Addresses', () => {
        const authParams = {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        };

        const apiStart = new Date();
        const addressRes = http.get(
          `${BASE_URL}/api/mobile/addresses`,
          authParams
        );
        const apiEnd = new Date();

        const addressSuccess = check(addressRes, {
          'addresses status is 200': (r) => r.status === 200,
          'addresses response is array': (r) => {
            try {
              const body = JSON.parse(r.body);
              return Array.isArray(body);
            } catch {
              return false;
            }
          },
        });

        if (addressSuccess) {
          apiDuration.add(apiEnd - apiStart);
        } else {
          errorRate.add(1);
        }
      });

      // Test 3: Mobile API - Get Statistics
      group('Mobile API - Statistics', () => {
        const authParams = {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        };

        const statsRes = http.get(
          `${BASE_URL}/api/mobile/stats`,
          authParams
        );

        check(statsRes, {
          'stats status is 200': (r) => r.status === 200,
          'stats has totalReadings': (r) => {
            try {
              const body = JSON.parse(r.body);
              return body.totalReadings !== undefined;
            } catch {
              return false;
            }
          },
        });
      });

      // Test 4: Create Reading (if agent role)
      if (user.email.includes('agent')) {
        group('Mobile API - Create Reading', () => {
          const authParams = {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          };

          const readingPayload = JSON.stringify({
            meterId: Math.floor(Math.random() * 100) + 1,
            previousIndex: 1000 + Math.floor(Math.random() * 1000),
            currentIndex: 2000 + Math.floor(Math.random() * 1000),
            readingDate: new Date().toISOString(),
          });

          const readingRes = http.post(
            `${BASE_URL}/api/mobile/readings`,
            readingPayload,
            authParams
          );

          check(readingRes, {
            'reading created or validated': (r) => r.status === 201 || r.status === 400,
          });
        });
      }

    } else {
      errorRate.add(1);
      failedLogins.add(1);
    }
  });

  // Realistic user think time
  sleep(Math.random() * 3 + 1); // 1-4 seconds
}

// Teardown
export function teardown(data) {
  console.log('🏁 Load test completed');
  console.log(`Started at: ${data.startTime}`);
  console.log(`Ended at: ${new Date().toISOString()}`);
}

// Handle summary for AI analysis
export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'load-test-results.json': JSON.stringify(data, null, 2),
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';
  const colors = options.enableColors;

  let summary = `\n${indent}Load Test Summary:\n`;
  summary += `${indent}===================\n\n`;

  // Overall metrics
  const metrics = data.metrics;
  if (metrics.http_reqs) {
    summary += `${indent}Total Requests: ${metrics.http_reqs.values.count}\n`;
  }
  if (metrics.http_req_duration) {
    summary += `${indent}Avg Response Time: ${metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
    summary += `${indent}P95 Response Time: ${metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
    summary += `${indent}P99 Response Time: ${metrics.http_req_duration.values['p(99)'].toFixed(2)}ms\n`;
  }
  if (metrics.http_req_failed) {
    const failRate = (metrics.http_req_failed.values.rate * 100).toFixed(2);
    summary += `${indent}Error Rate: ${failRate}%\n`;
  }

  return summary;
}
