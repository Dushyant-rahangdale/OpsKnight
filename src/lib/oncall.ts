type LayerUser = {
  userId: string;
  user: { name: string; avatarUrl?: string | null; gender?: string | null };
  position: number;
};

type LayerRestrictions = {
  daysOfWeek?: number[];  // 0=Sun, 1=Mon, ..., 6=Sat
  startHour?: number;     // 0-23
  endHour?: number;       // 0-23
};

type LayerInput = {
  id: string;
  name: string;
  start: Date;
  end: Date | null;
  rotationLengthHours: number;
  shiftLengthHours?: number | null;
  restrictions?: LayerRestrictions | null;
  priority?: number;
  users: LayerUser[];
};

type OverrideInput = {
  id: string;
  userId: string;
  user: { name: string; avatarUrl?: string | null; gender?: string | null };
  start: Date;
  end: Date;
  replacesUserId: string | null;
};

export type OnCallBlock = {
  id: string;
  start: Date;
  end: Date;
  userId: string;
  userName: string;
  userAvatar?: string | null;
  userGender?: string | null;
  layerId: string;
  layerName: string;
  source: 'rotation' | 'override';
};

function generateLayerBlocks(layer: LayerInput, windowStart: Date, windowEnd: Date): OnCallBlock[] {
  if (layer.users.length === 0) {
    return [];
  }

  const rotationMs = layer.rotationLengthHours * 60 * 60 * 1000;
  const shiftMs = (layer.shiftLengthHours || layer.rotationLengthHours) * 60 * 60 * 1000;

  if (rotationMs <= 0 || shiftMs <= 0) {
    return [];
  }

  const layerStart = layer.start;
  const layerEnd = layer.end ?? null;
  const effectiveWindowStart = windowStart < layerStart ? layerStart : windowStart;

  if (layerEnd && effectiveWindowStart >= layerEnd) {
    return [];
  }

  // Calculate initial index
  const startOffsetMs = Math.max(0, effectiveWindowStart.getTime() - layerStart.getTime());
  let index = Math.floor(startOffsetMs / rotationMs);

  // If we land inside a gap, we might need to check if we missed the duty period for this index
  // But simpler to just start checking from this index.

  const blocks: OnCallBlock[] = [];
  let guard = 0;
  // Support up to 1 year of 1-hour rotations (~8760 blocks). 10000 is safe.
  const maxBlocks = 10000;

  while (guard < maxBlocks) {
    const rotationStartTime = layerStart.getTime() + index * rotationMs;
    const blockStart = new Date(rotationStartTime);

    if (blockStart >= windowEnd) {
      break;
    }

    if (layerEnd && blockStart >= layerEnd) {
      break;
    }

    const dutyEndTime = rotationStartTime + shiftMs;
    // The "end of the block" logic needs to consider rotation boundary? 
    // No, duty can be shorter than rotation (gap) or longer (overlap? not supported well).
    // Assuming shift <= rotation usually. If shift > rotation, it overlaps next user.
    // Existing logic handles overlaps by "next user starts at next index".
    // We just emit blocks. Overlapping blocks are rendered overlappingly (now fixed in Timeline to stack).

    const rawEnd = new Date(dutyEndTime);
    const blockEnd = layerEnd && rawEnd > layerEnd ? layerEnd : rawEnd;

    // Check visibility
    // If the entire duty block is before window start, skip
    if (blockEnd <= effectiveWindowStart) {
      index++;
      guard++;
      continue;
    }

    // Determine User
    const user = layer.users[index % layer.users.length];

    // Clamp to Window
    const clampedStart = blockStart < effectiveWindowStart ? effectiveWindowStart : blockStart;
    const clampedEnd = blockEnd > windowEnd ? windowEnd : blockEnd;

    if (clampedStart < clampedEnd) {
      // Apply restrictions if present
      if (layer.restrictions) {
        const { daysOfWeek, startHour, endHour } = layer.restrictions;
        const blockDay = clampedStart.getDay();
        const blockHour = clampedStart.getHours();

        // Skip if day not allowed
        if (daysOfWeek && daysOfWeek.length > 0 && !daysOfWeek.includes(blockDay)) {
          index++;
          guard++;
          continue;
        }

        // Skip if hour not in range (startHour <= hour < endHour)
        if (startHour != null && endHour != null) {
          // Handle overnight ranges (e.g., 18:00 - 06:00)
          if (startHour <= endHour) {
            // Normal range (e.g., 09:00 - 17:00)
            if (blockHour < startHour || blockHour >= endHour) {
              index++;
              guard++;
              continue;
            }
          } else {
            // Overnight range (e.g., 18:00 - 06:00)
            if (blockHour < startHour && blockHour >= endHour) {
              index++;
              guard++;
              continue;
            }
          }
        } else if (startHour != null && blockHour < startHour) {
          index++;
          guard++;
          continue;
        } else if (endHour != null && blockHour >= endHour) {
          index++;
          guard++;
          continue;
        }
      }

      blocks.push({
        id: `${layer.id}-${index}`,
        start: clampedStart,
        end: clampedEnd,
        userId: user.userId,
        userName: user.user.name,
        userAvatar: user.user.avatarUrl,
        userGender: user.user.gender,
        layerId: layer.id,
        layerName: layer.name,
        source: 'rotation',
      });
    }

    index++;
    guard++;
  }

  return blocks;
}

function applyOverrides(blocks: OnCallBlock[], overrides: OverrideInput[]): OnCallBlock[] {
  const sortedOverrides = [...overrides].sort((a, b) => a.start.getTime() - b.start.getTime());
  let result = [...blocks];

  for (const override of sortedOverrides) {
    const next: OnCallBlock[] = [];
    for (const block of result) {
      if (override.end <= block.start || override.start >= block.end) {
        next.push(block);
        continue;
      }

      if (override.replacesUserId && override.replacesUserId !== block.userId) {
        next.push(block);
        continue;
      }

      const overrideStart = override.start > block.start ? override.start : block.start;
      const overrideEnd = override.end < block.end ? override.end : block.end;

      if (block.start < overrideStart) {
        next.push({ ...block, end: overrideStart });
      }

      next.push({
        ...block,
        id: `${block.id}-override-${override.id}`,
        start: overrideStart,
        end: overrideEnd,
        userId: override.userId,
        userName: override.user.name,
        userAvatar: override.user.avatarUrl,
        userGender: override.user.gender,
        source: 'override',
      });

      if (overrideEnd < block.end) {
        next.push({ ...block, start: overrideEnd });
      }
    }
    result = next;
  }

  return result.sort((a, b) => a.start.getTime() - b.start.getTime());
}

export function buildScheduleBlocks(
  layers: LayerInput[],
  overrides: OverrideInput[],
  windowStart: Date,
  windowEnd: Date
) {
  const blocks = layers.flatMap(layer => generateLayerBlocks(layer, windowStart, windowEnd));
  return applyOverrides(blocks, overrides);
}

/**
 * Generates the final effective schedule by merging all layers.
 * Higher priority layers override lower priority layers during overlaps.
 * Returns a flattened list of non-overlapping blocks.
 */
export function getFinalScheduleBlocks(
  blocks: OnCallBlock[],
  layerPriority: Map<string, number>
): OnCallBlock[] {
  if (blocks.length === 0) return [];

  // Sort blocks by start time
  const sorted = [...blocks].sort((a, b) => a.start.getTime() - b.start.getTime());

  // Create timeline events
  type TimelineEvent = {
    time: Date;
    type: 'start' | 'end';
    block: OnCallBlock;
    priority: number;
  };

  const events: TimelineEvent[] = [];
  for (const block of sorted) {
    const priority = layerPriority.get(block.layerId) ?? 0;
    events.push({ time: block.start, type: 'start', block, priority });
    events.push({ time: block.end, type: 'end', block, priority });
  }

  // Sort events by time, then by type (ends before starts at same time)
  events.sort((a, b) => {
    const timeDiff = a.time.getTime() - b.time.getTime();
    if (timeDiff !== 0) return timeDiff;
    // Process 'end' before 'start' at same time
    if (a.type === 'end' && b.type === 'start') return -1;
    if (a.type === 'start' && b.type === 'end') return 1;
    return 0;
  });

  const result: OnCallBlock[] = [];
  const activeBlocks = new Map<string, { block: OnCallBlock; priority: number }>();
  let lastTime: Date | null = null;
  let lastWinner: OnCallBlock | null = null;

  for (const event of events) {
    // If time has changed and we have an active winner, emit a block
    if (lastTime && lastWinner && event.time.getTime() > lastTime.getTime()) {
      result.push({
        ...lastWinner,
        id: `final-${lastWinner.id}-${lastTime.getTime()}`,
        start: lastTime,
        end: event.time,
        layerName: 'Final Schedule',
      });
    }

    // Update active blocks
    if (event.type === 'start') {
      activeBlocks.set(event.block.id, { block: event.block, priority: event.priority });
    } else {
      activeBlocks.delete(event.block.id);
    }

    // Find the winner (highest priority active block)
    let winner: OnCallBlock | null = null;
    let maxPriority = -Infinity;
    for (const { block, priority } of activeBlocks.values()) {
      if (priority > maxPriority) {
        maxPriority = priority;
        winner = block;
      }
    }

    lastTime = event.time;
    lastWinner = winner;
  }

  // Merge consecutive blocks with the same user
  const merged: OnCallBlock[] = [];
  for (const block of result) {
    const last = merged[merged.length - 1];
    if (last && last.userId === block.userId && last.end.getTime() === block.start.getTime()) {
      last.end = block.end;
    } else {
      merged.push({ ...block });
    }
  }

  return merged;
}
