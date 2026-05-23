export function normalizeJiraBaseUrl(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, '');
  const url = new URL(trimmed);

  if (url.protocol !== 'https:') {
    throw new Error('Jira URL must use HTTPS.');
  }

  return url.toString().replace(/\/+$/, '');
}

export function isValidJiraKey(value: string): boolean {
  return /^[A-Z][A-Z0-9_]+-\d+$/.test(value.trim());
}

export function parseLabels(value: string): string[] {
  return value
    .split(/[\n,\s]+/)
    .map(label => label.trim())
    .filter(Boolean)
    .filter((label, index, labels) => labels.indexOf(label) === index);
}

export function assertJiraProjectKey(value: string): string {
  const normalized = value.trim().toUpperCase();
  if (!/^[A-Z][A-Z0-9_]+$/.test(normalized)) {
    throw new Error('Jira project key must contain uppercase letters, numbers, or underscores.');
  }
  return normalized;
}

export function assertJiraIssueType(value: string, fieldName: string): string {
  const normalized = value.trim();
  if (!normalized || normalized.length > 80) {
    throw new Error(`${fieldName} is required and must be 80 characters or fewer.`);
  }
  return normalized;
}
