import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatDateFriendly,
  formatTime,
  formatDateShort,
  formatDateGroup,
} from '../../src/lib/date-format';

describe('Date Format Utilities', () => {
  const testDate = new Date('2024-01-15T14:30:45Z');
  const invalidDate = new Date('invalid');

  describe('formatDate', () => {
    it('should format as date', () => {
      // Adjusting for potential local timezone impact by using substring or regex if strict ISO check fails due to local run
      // But implementation uses getFullYear etc which are local time methods in the original file?
      // Wait, original file uses:
      // d.getFullYear(), d.getMonth()... these are local time.
      // So sticking to a fixed date string might have timezone issues if running in different envs.
      // Ideally we mock the timezone or just check the structure.

      // Let's check strict output for a known local date to be safe, or just check format structure.
      // For now, let's assume the test runner has a stable timezone or we verify structure.
      // Actually, we can just use a fixed timestamp and check expected output relative to that timestamp.

      expect(formatDate(testDate, 'date')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should format as time', () => {
      expect(formatDate(testDate, 'time')).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    });

    it('should format as datetime (default)', () => {
      expect(formatDate(testDate)).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    });

    it('should handle invalid date', () => {
      expect(formatDate(invalidDate)).toBe('Invalid Date');
    });

    it('should handle string input', () => {
      expect(formatDate('2024-01-15T14:30:45Z', 'date')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('formatDateFriendly', () => {
    it('should format as friendly date (UTC legacy)', () => {
      // formatDateFriendly uses getUTC* methods when no timezone provided
      expect(formatDateFriendly(testDate, 'date')).toBe('15/01/2024');
    });

    it('should format as friendly datetime (UTC legacy)', () => {
      expect(formatDateFriendly(testDate, 'datetime')).toBe('15/01/2024, 14:30:45');
    });

    it('should use timezone when provided', () => {
      // Intl.DateTimeFormat 'en-GB' -> DD/MM/YYYY
      const result = formatDateFriendly(testDate, 'date', 'America/New_York');
      // 2024-01-15 14:30 UTC is 09:30 EST
      expect(result).toBe('15/01/2024');
    });

    it('should handle invalid timezone gracefully (fallback)', () => {
      // Implementation catches error but returns verify implicit void?
      // Reading source: } catch { // Fallback to UTC }
      // Ah, it swallows error and proceeds to UTC fallback at bottom.
      expect(formatDateFriendly(testDate, 'date', 'Invalid/Zone')).toBe('15/01/2024');
    });

    it('should handle invalid date', () => {
      expect(formatDateFriendly(invalidDate)).toBe('Invalid Date');
    });
  });

  describe('formatTime', () => {
    it('should format time as HH:MM', () => {
      expect(formatTime(testDate)).toMatch(/^\d{2}:\d{2}$/);
    });

    it('should handle invalid date', () => {
      expect(formatTime(invalidDate)).toBe('Invalid Time');
    });
  });

  describe('formatDateShort', () => {
    it('should return short format like Jan 15', () => {
      expect(formatDateShort(testDate)).toMatch(/^[A-Z][a-z]{2} \d{1,2}$/);
    });

    it('should handle invalid date', () => {
      expect(formatDateShort(invalidDate)).toBe('Invalid Date');
    });
  });

  describe('formatDateGroup', () => {
    it('should return group format like January 15, 2024', () => {
      expect(formatDateGroup(testDate)).toMatch(/^[A-Z][a-z]+ \d{1,2}, \d{4}$/);
    });

    it('should handle invalid date', () => {
      expect(formatDateGroup(invalidDate)).toBe('Invalid Date');
    });
  });
});
