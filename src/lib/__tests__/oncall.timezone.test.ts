import { describe, expect, it } from 'vitest';
import { buildScheduleBlocks } from '../oncall';

// Regression: restrictions should be evaluated in the schedule timezone, not server/local time.
describe('buildScheduleBlocks timezone-aware restrictions', () => {
  it('skips a block when local day is allowed but schedule timezone day is not', () => {
    // Layer starts at Monday 00:00 in America/Los_Angeles (which is 08:00 UTC on Sunday).
    const layerStart = new Date('2025-12-01T08:00:00Z'); // Monday 00:00 PST
    const layer = {
      id: 'layer-1',
      name: 'Primary',
      start: layerStart,
      end: null as Date | null,
      rotationLengthHours: 24,
      users: [{ userId: 'u1', user: { name: 'User One' }, position: 0 }],
      restrictions: {
        daysOfWeek: [0], // Sunday only
      },
    };

    // Window covers the Monday in PST; server time is irrelevant
    const windowStart = new Date('2025-12-01T00:00:00-08:00'); // Monday 00:00 PST
    const windowEnd = new Date('2025-12-02T00:00:00-08:00');   // Tuesday 00:00 PST

    const blocks = buildScheduleBlocks([layer], [], windowStart, windowEnd, 'America/Los_Angeles');

    // Because restriction allows only Sunday, Monday block should be skipped.
    expect(blocks.length).toBe(0);
  });
});
