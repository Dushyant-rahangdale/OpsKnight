/**
 * Health endpoint specific load test.
 *
 * Purpose: Validate health check endpoint performance
 * This endpoint should be extremely fast and reliable.
 *
 * Run: k6 run tests/load/scenarios/health.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { endpointThresholds } from '../config/thresholds.js';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 20 },
    { duration: '30s', target: 50 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 0 },
  ],
  thresholds: endpointThresholds.health,
  tags: {
    testType: 'health-endpoint',
  },
};

export default function () {
  const response = http.get(`${BASE_URL}/api/health`);

  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 100ms': (r) => r.timings.duration < 100,
    'response time < 50ms': (r) => r.timings.duration < 50,
    'has status field': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.status !== undefined;
      } catch {
        return false;
      }
    },
    'status is ok': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.status === 'ok' || body.status === 'healthy';
      } catch {
        return false;
      }
    },
  });

  sleep(0.1); // Short pause for health checks
}

export function handleSummary(data) {
  console.log('\n=== Health Endpoint Test Summary ===');
  console.log(`P50: ${data.metrics.http_req_duration?.values?.med?.toFixed(2)}ms`);
  console.log(`P95: ${data.metrics.http_req_duration?.values['p(95)']?.toFixed(2)}ms`);
  console.log(`P99: ${data.metrics.http_req_duration?.values['p(99)']?.toFixed(2)}ms`);
  console.log(`Error Rate: ${((data.metrics.http_req_failed?.values?.rate || 0) * 100).toFixed(4)}%`);

  return {
    'reports/health-test-summary.json': JSON.stringify(data, null, 2),
  };
}
