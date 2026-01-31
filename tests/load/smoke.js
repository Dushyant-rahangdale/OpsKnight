/**
 * Smoke test - Quick validation of system health.
 *
 * Duration: ~30 seconds
 * VUs: 1
 * Purpose: Verify the system is up and responding correctly
 *
 * Run: k6 run tests/load/smoke.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { smokeThresholds } from './config/thresholds.js';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  vus: 1,
  duration: '30s',
  thresholds: smokeThresholds,
  tags: {
    testType: 'smoke',
  },
};

export default function () {
  // Health check endpoint
  const healthResponse = http.get(`${BASE_URL}/api/health`);
  check(healthResponse, {
    'health check status 200': (r) => r.status === 200,
    'health check response time < 500ms': (r) => r.timings.duration < 500,
    'health check has status': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.status !== undefined;
      } catch {
        return false;
      }
    },
  });

  sleep(1);

  // Public status page
  const statusResponse = http.get(`${BASE_URL}/status`);
  check(statusResponse, {
    'status page loads': (r) => r.status === 200,
    'status page response time < 2s': (r) => r.timings.duration < 2000,
  });

  sleep(1);

  // Login page (public)
  const loginResponse = http.get(`${BASE_URL}/login`);
  check(loginResponse, {
    'login page loads': (r) => r.status === 200,
    'login page response time < 2s': (r) => r.timings.duration < 2000,
  });

  sleep(1);
}

export function handleSummary(data) {
  const passed = data.metrics.checks?.values?.passes || 0;
  const failed = data.metrics.checks?.values?.fails || 0;
  const total = passed + failed;

  console.log('\n=== Smoke Test Summary ===');
  console.log(`Checks: ${passed}/${total} passed`);
  console.log(`Request duration (p95): ${data.metrics.http_req_duration?.values['p(95)']?.toFixed(2)}ms`);
  console.log(`Error rate: ${(data.metrics.http_req_failed?.values?.rate * 100 || 0).toFixed(2)}%`);

  return {
    'reports/smoke-test-summary.json': JSON.stringify(data, null, 2),
  };
}
