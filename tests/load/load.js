/**
 * Load test - Standard load testing scenario.
 *
 * Duration: ~16 minutes
 * VUs: Ramps up to 100
 * Purpose: Test system under normal expected load
 *
 * Stages:
 * 1. Ramp up to 50 VUs over 2 minutes
 * 2. Stay at 50 VUs for 5 minutes
 * 3. Ramp up to 100 VUs over 2 minutes
 * 4. Stay at 100 VUs for 5 minutes
 * 5. Ramp down to 0 over 2 minutes
 *
 * Run: k6 run tests/load/load.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { standardThresholds } from './config/thresholds.js';
import { BASE_URL, defaultHeaders, randomIncidentTitle } from './lib/helpers.js';

export const options = {
  stages: [
    { duration: '2m', target: 50 },   // Ramp up
    { duration: '5m', target: 50 },   // Steady state
    { duration: '2m', target: 100 },  // Ramp up more
    { duration: '5m', target: 100 },  // Peak load
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: standardThresholds,
  tags: {
    testType: 'load',
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
  group('Health Check', () => {
    const response = http.get(`${BASE_URL}/api/health`);
    check(response, {
      'health status 200': (r) => r.status === 200,
      'health response < 500ms': (r) => r.timings.duration < 500,
    });
  });

  sleep(1);

  group('Public Status Page', () => {
    const response = http.get(`${BASE_URL}/status`);
    check(response, {
      'status page loads': (r) => r.status === 200 || r.status === 304,
      'status page < 2s': (r) => r.timings.duration < 2000,
    });
  });

  sleep(1);

  // Only run authenticated tests if API key is provided
  if (API_KEY) {
    group('Incidents API', () => {
      // List incidents
      const listResponse = http.get(`${BASE_URL}/api/incidents`, {
        headers: getAuthHeaders(),
      });
      check(listResponse, {
        'incidents list status 200': (r) => r.status === 200,
        'incidents list < 2s': (r) => r.timings.duration < 2000,
      });

      sleep(0.5);

      // Create incident (10% of iterations)
      if (Math.random() < 0.1) {
        const createResponse = http.post(
          `${BASE_URL}/api/incidents`,
          JSON.stringify({
            title: randomIncidentTitle(),
            description: 'Load test incident',
            severity: 'low',
          }),
          { headers: getAuthHeaders() }
        );
        check(createResponse, {
          'incident created': (r) => r.status === 201 || r.status === 200,
        });
      }
    });

    sleep(1);

    group('Schedules API', () => {
      const response = http.get(`${BASE_URL}/api/schedules`, {
        headers: getAuthHeaders(),
      });
      check(response, {
        'schedules list status 200': (r) => r.status === 200,
        'schedules list < 2s': (r) => r.timings.duration < 2000,
      });
    });
  }

  sleep(Math.random() * 2 + 1); // Random pause 1-3s
}

export function handleSummary(data) {
  const p95 = data.metrics.http_req_duration?.values['p(95)']?.toFixed(2) || 'N/A';
  const p99 = data.metrics.http_req_duration?.values['p(99)']?.toFixed(2) || 'N/A';
  const errorRate = ((data.metrics.http_req_failed?.values?.rate || 0) * 100).toFixed(2);
  const rps = data.metrics.http_reqs?.values?.rate?.toFixed(2) || 'N/A';

  console.log('\n=== Load Test Summary ===');
  console.log(`P95 Response Time: ${p95}ms`);
  console.log(`P99 Response Time: ${p99}ms`);
  console.log(`Error Rate: ${errorRate}%`);
  console.log(`Requests/sec: ${rps}`);

  return {
    'reports/load-test-summary.json': JSON.stringify(data, null, 2),
  };
}
