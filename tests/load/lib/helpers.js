/**
 * Shared helper functions for k6 load tests.
 */

import http from 'k6/http';
import { check, fail } from 'k6';

/**
 * Base URL for API requests.
 */
export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

/**
 * Default request headers.
 */
export const defaultHeaders = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

/**
 * Create authenticated headers with API key.
 * @param {string} apiKey - The API key for authentication
 * @returns {Object} Headers object with authorization
 */
export function authHeaders(apiKey) {
  return {
    ...defaultHeaders,
    Authorization: `Bearer ${apiKey}`,
  };
}

/**
 * Make a GET request with standard error handling.
 * @param {string} path - API path
 * @param {Object} headers - Request headers
 * @param {string} checkName - Name for the check
 * @returns {Object} Response object
 */
export function get(path, headers = defaultHeaders, checkName = 'GET request') {
  const url = `${BASE_URL}${path}`;
  const response = http.get(url, { headers });

  check(response, {
    [`${checkName} - status 2xx`]: (r) => r.status >= 200 && r.status < 300,
    [`${checkName} - response time < 2s`]: (r) => r.timings.duration < 2000,
  });

  return response;
}

/**
 * Make a POST request with standard error handling.
 * @param {string} path - API path
 * @param {Object} body - Request body
 * @param {Object} headers - Request headers
 * @param {string} checkName - Name for the check
 * @returns {Object} Response object
 */
export function post(path, body, headers = defaultHeaders, checkName = 'POST request') {
  const url = `${BASE_URL}${path}`;
  const response = http.post(url, JSON.stringify(body), { headers });

  check(response, {
    [`${checkName} - status 2xx`]: (r) => r.status >= 200 && r.status < 300,
    [`${checkName} - response time < 2s`]: (r) => r.timings.duration < 2000,
  });

  return response;
}

/**
 * Make a PUT request with standard error handling.
 * @param {string} path - API path
 * @param {Object} body - Request body
 * @param {Object} headers - Request headers
 * @param {string} checkName - Name for the check
 * @returns {Object} Response object
 */
export function put(path, body, headers = defaultHeaders, checkName = 'PUT request') {
  const url = `${BASE_URL}${path}`;
  const response = http.put(url, JSON.stringify(body), { headers });

  check(response, {
    [`${checkName} - status 2xx`]: (r) => r.status >= 200 && r.status < 300,
    [`${checkName} - response time < 2s`]: (r) => r.timings.duration < 2000,
  });

  return response;
}

/**
 * Make a DELETE request with standard error handling.
 * @param {string} path - API path
 * @param {Object} headers - Request headers
 * @param {string} checkName - Name for the check
 * @returns {Object} Response object
 */
export function del(path, headers = defaultHeaders, checkName = 'DELETE request') {
  const url = `${BASE_URL}${path}`;
  const response = http.del(url, null, { headers });

  check(response, {
    [`${checkName} - status 2xx`]: (r) => r.status >= 200 && r.status < 300,
    [`${checkName} - response time < 2s`]: (r) => r.timings.duration < 2000,
  });

  return response;
}

/**
 * Generate a random incident title for testing.
 * @returns {string} Random incident title
 */
export function randomIncidentTitle() {
  const titles = [
    'Database connectivity issue',
    'API response latency spike',
    'Memory usage warning',
    'SSL certificate expiring',
    'Disk space low on server',
    'Authentication service degraded',
    'CDN origin errors',
    'Payment gateway timeout',
  ];
  return `[Load Test] ${titles[Math.floor(Math.random() * titles.length)]} - ${Date.now()}`;
}

/**
 * Sleep for a random duration within a range.
 * @param {number} min - Minimum sleep time in seconds
 * @param {number} max - Maximum sleep time in seconds
 */
export function randomSleep(min = 1, max = 3) {
  const duration = Math.random() * (max - min) + min;
  // k6 sleep is imported separately where needed
  return duration;
}

/**
 * Parse JSON response safely.
 * @param {Object} response - HTTP response object
 * @returns {Object|null} Parsed JSON or null
 */
export function parseJson(response) {
  try {
    return JSON.parse(response.body);
  } catch (e) {
    console.error('Failed to parse JSON response:', e.message);
    return null;
  }
}
