/**
 * Performance threshold configurations for k6 load tests.
 */

/**
 * Standard thresholds for production load tests.
 */
export const standardThresholds = {
  // Response time thresholds
  http_req_duration: [
    'p(95)<2000', // 95% of requests should complete within 2 seconds
    'p(99)<5000', // 99% of requests should complete within 5 seconds
  ],

  // Error rate threshold
  http_req_failed: ['rate<0.01'], // Error rate should be less than 1%

  // Throughput threshold
  http_reqs: ['rate>10'], // At least 10 requests per second

  // Checks should pass
  checks: ['rate>0.95'], // 95% of checks should pass
};

/**
 * Strict thresholds for critical endpoints.
 */
export const strictThresholds = {
  http_req_duration: [
    'p(95)<500', // 95% within 500ms
    'p(99)<1000', // 99% within 1 second
  ],
  http_req_failed: ['rate<0.001'], // Error rate < 0.1%
  http_reqs: ['rate>50'], // At least 50 RPS
  checks: ['rate>0.99'], // 99% of checks should pass
};

/**
 * Relaxed thresholds for stress testing.
 */
export const stressThresholds = {
  http_req_duration: [
    'p(95)<5000', // 95% within 5 seconds under stress
    'p(99)<10000', // 99% within 10 seconds under stress
  ],
  http_req_failed: ['rate<0.05'], // Error rate < 5% under stress
  checks: ['rate>0.90'], // 90% of checks should pass
};

/**
 * Thresholds for smoke tests (quick validation).
 */
export const smokeThresholds = {
  http_req_duration: ['p(95)<3000'],
  http_req_failed: ['rate<0.05'],
  checks: ['rate>0.90'],
};

/**
 * Custom thresholds per endpoint.
 */
export const endpointThresholds = {
  health: {
    http_req_duration: ['p(95)<100', 'p(99)<200'],
    http_req_failed: ['rate<0.001'],
  },
  incidents: {
    http_req_duration: ['p(95)<1000', 'p(99)<2000'],
    http_req_failed: ['rate<0.01'],
  },
  schedules: {
    http_req_duration: ['p(95)<1500', 'p(99)<3000'],
    http_req_failed: ['rate<0.01'],
  },
  statusPage: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.001'],
  },
};

export default standardThresholds;
