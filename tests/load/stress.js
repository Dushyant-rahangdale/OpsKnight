/**
 * Stress test - Find system breaking points.
 *
 * Duration: ~30 minutes
 * VUs: Ramps up to 400
 * Purpose: Identify system limits and breaking points
 *
 * Stages:
 * 1. Ramp up to 100 VUs over 5 minutes
 * 2. Stay at 100 VUs for 5 minutes
 * 3. Ramp up to 200 VUs over 5 minutes
 * 4. Stay at 200 VUs for 5 minutes
 * 5. Ramp up to 400 VUs over 5 minutes
 * 6. Stay at 400 VUs for 3 minutes
 * 7. Ramp down to 0 over 2 minutes
 *
 * Run: k6 run tests/load/stress.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { stressThresholds } from './config/thresholds.js';
import { BASE_URL, defaultHeaders } from './lib/helpers.js';

export const options = {
  stages: [
    { duration: '5m', target: 100 },   // Warm up
    { duration: '5m', target: 100 },   // Steady at 100
    { duration: '5m', target: 200 },   // Ramp to 200
    { duration: '5m', target: 200 },   // Steady at 200
    { duration: '5m', target: 400 },   // Push to 400
    { duration: '3m', target: 400 },   // Peak stress
    { duration: '2m', target: 0 },     // Recovery
  ],
  thresholds: stressThresholds,
  tags: {
    testType: 'stress',
  },
};

const API_KEY = __ENV.API_KEY || '';

function getAuthHeaders() {
  if (API_KEY) {
    return {
      ...defaultHeaders,
      Authorization: `Bearer ${API_KEY}`,
    };
  }
  return defaultHeaders;
}

export default function () {
  group('Health Check Under Stress', () => {
    const response = http.get(`${BASE_URL}/api/health`);
    check(response, {
      'health responds': (r) => r.status === 200 || r.status === 503,
      'health timeout < 5s': (r) => r.timings.duration < 5000,
    });
  });

  sleep(0.5);

  group('Public Endpoints Under Stress', () => {
    const statusResponse = http.get(`${BASE_URL}/status`);
    check(statusResponse, {
      'status page responds': (r) => r.status < 500,
    });

    const loginResponse = http.get(`${BASE_URL}/login`);
    check(loginResponse, {
      'login page responds': (r) => r.status < 500,
    });
  });

  sleep(0.5);

  if (API_KEY) {
    group('API Under Stress', () => {
      // Rapid incident list requests
      const incidentsResponse = http.get(`${BASE_URL}/api/incidents`, {
        headers: getAuthHeaders(),
      });
      check(incidentsResponse, {
        'incidents API responds': (r) => r.status < 500,
      });

      // Rapid schedules requests
      const schedulesResponse = http.get(`${BASE_URL}/api/schedules`, {
        headers: getAuthHeaders(),
      });
      check(schedulesResponse, {
        'schedules API responds': (r) => r.status < 500,
      });
    });
  }

  // Shorter sleep during stress to maintain pressure
  sleep(Math.random() * 0.5 + 0.2);
}

export function handleSummary(data) {
  const p95 = data.metrics.http_req_duration?.values['p(95)']?.toFixed(2) || 'N/A';
  const p99 = data.metrics.http_req_duration?.values['p(99)']?.toFixed(2) || 'N/A';
  const maxDuration = data.metrics.http_req_duration?.values?.max?.toFixed(2) || 'N/A';
  const errorRate = ((data.metrics.http_req_failed?.values?.rate || 0) * 100).toFixed(2);
  const totalRequests = data.metrics.http_reqs?.values?.count || 0;
  const rps = data.metrics.http_reqs?.values?.rate?.toFixed(2) || 'N/A';

  console.log('\n=== Stress Test Summary ===');
  console.log(`Total Requests: ${totalRequests}`);
  console.log(`Requests/sec (avg): ${rps}`);
  console.log(`P95 Response Time: ${p95}ms`);
  console.log(`P99 Response Time: ${p99}ms`);
  console.log(`Max Response Time: ${maxDuration}ms`);
  console.log(`Error Rate: ${errorRate}%`);

  // Highlight breaking points
  if (parseFloat(errorRate) > 5) {
    console.log('\n⚠️  High error rate detected - system may be at capacity');
  }
  if (parseFloat(p99) > 10000) {
    console.log('\n⚠️  High latency detected - system under significant stress');
  }

  return {
    'reports/stress-test-summary.json': JSON.stringify(data, null, 2),
  };
}
