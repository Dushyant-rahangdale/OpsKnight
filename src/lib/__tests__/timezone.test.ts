import { describe, expect, it } from 'vitest';
import {
  addDaysToDateKey,
  formatDateKeyInTimeZone,
  startOfDayFromDateKey,
  startOfNextDayFromDateKey,
} from '../timezone';

describe('timezone helpers', () => {
  it('formats date keys using the provided timezone', () => {
    const date = new Date('2024-01-15T02:00:00Z');
    const key = formatDateKeyInTimeZone(date, 'America/New_York');
    expect(key).toBe('2024-01-14');
  });

  it('adds days across month and year boundaries', () => {
    expect(addDaysToDateKey('2024-12-31', 1)).toBe('2025-01-01');
    expect(addDaysToDateKey('2024-01-01', -1)).toBe('2023-12-31');
  });

  it('round-trips start of day keys in timezone boundaries', () => {
    const timeZone = 'America/New_York';
    const dateKey = '2024-03-10';
    const start = startOfDayFromDateKey(dateKey, timeZone);
    const nextStart = startOfNextDayFromDateKey(dateKey, timeZone);

    expect(formatDateKeyInTimeZone(start, timeZone)).toBe(dateKey);
    expect(formatDateKeyInTimeZone(nextStart, timeZone)).toBe('2024-03-11');
  });
});
