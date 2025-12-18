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
const BASE_URL = __ENV.API_URL || 'http://localhost:5001';
const USERS = [
  { email: 'admin@ree.ma', password: 'Admin@123' },
  { email: 'mbennani@ree.ma', password: 'User@123' },
  { email: 'felamrani@ree.ma', password: 'User@123' },
];

// Helper function to get random user
function getRandomUser() {
  return USERS[Math.floor(Math.random() * USERS.length)];
}

// Setup: Create test users if needed
export function setup() {
  console.log('🚀 Starting load test setup...');

  // Check API health
  const healthCheck = http.get(`${BASE_URL}/api/health`);
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

      // Test 2: Get Dashboard Stats
      group('Backoffice API - Dashboard', () => {
        const authParams = {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        };

        const apiStart = new Date();
        const dashboardRes = http.get(
          `${BASE_URL}/api/dashboard/stats`,
          authParams
        );
        const apiEnd = new Date();

        const dashboardSuccess = check(dashboardRes, {
          'dashboard status is 200': (r) => r.status === 200,
          'dashboard has stats': (r) => {
            try {
              const body = JSON.parse(r.body);
              return body !== undefined;
            } catch {
              return false;
            }
          },
        });

        if (dashboardSuccess) {
          apiDuration.add(apiEnd - apiStart);
        } else {
          errorRate.add(1);
        }
      });

      // Test 3: Get Agents List
      group('Backoffice API - Agents', () => {
        const authParams = {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        };

        const agentsRes = http.get(
          `${BASE_URL}/api/agents`,
          authParams
        );

        check(agentsRes, {
          'agents status is 200': (r) => r.status === 200,
          'agents response has data': (r) => {
            try {
              const body = JSON.parse(r.body);
              return body !== undefined;
            } catch {
              return false;
            }
          },
        });
      });

      // Test 4: Get Readings List
      group('Backoffice API - Readings', () => {
        const authParams = {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        };

        const readingsRes = http.get(
          `${BASE_URL}/api/readings`,
          authParams
        );

        check(readingsRes, {
          'readings list accessible': (r) => r.status === 200,
        });
      });

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
