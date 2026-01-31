/**
 * Incidents API load test.
 *
 * Purpose: Test incident CRUD operations under load
 *
 * Run: k6 run tests/load/scenarios/incidents.js --env API_KEY=your-key
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { endpointThresholds } from '../config/thresholds.js';
import { BASE_URL, defaultHeaders, randomIncidentTitle, parseJson } from '../lib/helpers.js';

export const options = {
  stages: [
    { duration: '1m', target: 10 },
    { duration: '3m', target: 30 },
    { duration: '1m', target: 50 },
    { duration: '3m', target: 50 },
    { duration: '1m', target: 0 },
  ],
  thresholds: endpointThresholds.incidents,
  tags: {
    testType: 'incidents',
  },
};

const API_KEY = __ENV.API_KEY;

if (!API_KEY) {
  console.warn('Warning: API_KEY not provided. Some tests will be skipped.');
}

function getAuthHeaders() {
  return {
    ...defaultHeaders,
    Authorization: `Bearer ${API_KEY}`,
  };
}

export default function () {
  if (!API_KEY) {
    // Without API key, only test public endpoints
    const response = http.get(`${BASE_URL}/api/health`);
    check(response, { 'health ok': (r) => r.status === 200 });
    sleep(1);
    return;
  }

  group('List Incidents', () => {
    const response = http.get(`${BASE_URL}/api/incidents`, {
      headers: getAuthHeaders(),
    });

    check(response, {
      'list status 200': (r) => r.status === 200,
      'list response < 2s': (r) => r.timings.duration < 2000,
      'list returns array': (r) => {
        const data = parseJson(r);
        return Array.isArray(data) || (data && Array.isArray(data.incidents));
      },
    });
  });

  sleep(1);

  group('Create Incident', () => {
    // Only create incidents 20% of the time
    if (Math.random() > 0.2) {
      return;
    }

    const payload = {
      title: randomIncidentTitle(),
      description: 'Automated load test incident',
      severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
    };

    const response = http.post(
      `${BASE_URL}/api/incidents`,
      JSON.stringify(payload),
      { headers: getAuthHeaders() }
    );

    check(response, {
      'create status 2xx': (r) => r.status >= 200 && r.status < 300,
      'create response < 2s': (r) => r.timings.duration < 2000,
      'create returns incident': (r) => {
        const data = parseJson(r);
        return data && (data.id || data.incident?.id);
      },
    });

    // If created, try to update it
    const data = parseJson(response);
    const incidentId = data?.id || data?.incident?.id;

    if (incidentId) {
      sleep(0.5);

      group('Update Incident', () => {
        const updateResponse = http.patch(
          `${BASE_URL}/api/incidents/${incidentId}`,
          JSON.stringify({
            description: 'Updated by load test',
          }),
          { headers: getAuthHeaders() }
        );

        check(updateResponse, {
          'update status 2xx': (r) => r.status >= 200 && r.status < 300,
        });
      });
    }
  });

  sleep(1);

  group('Get Single Incident', () => {
    // First list incidents to get an ID
    const listResponse = http.get(`${BASE_URL}/api/incidents?limit=1`, {
      headers: getAuthHeaders(),
    });

    const data = parseJson(listResponse);
    const incidents = Array.isArray(data) ? data : data?.incidents || [];

    if (incidents.length > 0) {
      const incidentId = incidents[0].id;

      const response = http.get(`${BASE_URL}/api/incidents/${incidentId}`, {
        headers: getAuthHeaders(),
      });

      check(response, {
        'get status 200': (r) => r.status === 200,
        'get response < 1s': (r) => r.timings.duration < 1000,
      });
    }
  });

  sleep(Math.random() + 0.5);
}

export function handleSummary(data) {
  console.log('\n=== Incidents API Test Summary ===');
  console.log(`Total Requests: ${data.metrics.http_reqs?.values?.count || 0}`);
  console.log(`P95: ${data.metrics.http_req_duration?.values['p(95)']?.toFixed(2)}ms`);
  console.log(`Error Rate: ${((data.metrics.http_req_failed?.values?.rate || 0) * 100).toFixed(2)}%`);

  return {
    'reports/incidents-test-summary.json': JSON.stringify(data, null, 2),
  };
}
