'use client';

interface HeatmapCalendarProps {
  data: { date: string; count: number }[];
  days?: number; // Changed from weeks to days to match usage
  cellSize?: number;
  gap?: number;
}

const getIntensityColor = (count: number, maxCount: number): string => {
  if (count === 0) return 'rgba(34, 197, 94, 0.15)'; // Light green for zero

  // Logarithmic scale for better distribution since incident counts can vary wildly
  const intensity = maxCount > 0 ? Math.min(1, count / maxCount) : 0;

  if (intensity < 0.25) return 'rgba(34, 197, 94, 0.5)'; // Green - low
  if (intensity < 0.5) return 'rgba(234, 179, 8, 0.6)'; // Yellow - medium
  if (intensity < 0.75) return 'rgba(249, 115, 22, 0.7)'; // Orange - high
  return 'rgba(239, 68, 68, 0.85)'; // Red - critical
};

const getDayLabel = (dayIndex: number): string => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[dayIndex];
};

export default function HeatmapCalendar({
  data,
  days = 90, // Default to ~3 months if not specified
  cellSize = 12,
  gap = 4,
}: HeatmapCalendarProps) {
  // Calculate weeks based on days requested
  const weeks = Math.ceil(days / 7);

  const dataMap = new Map(data.map(d => [d.date, d.count]));
  const maxCount = Math.max(1, ...data.map(d => d.count));

  // Generate week columns (newest on right)
  const today = new Date();
  const cells: { date: Date; count: number; x: number; y: number }[] = [];

  // We render columns from left to right, but time moves left to right.
  // The last column (right-most) should include "today".
  // 0 = current week (right most), weeks-1 = oldest week (left most)
  for (let weekIndex = 0; weekIndex < weeks; weekIndex++) {
    // weekIndex 0 is the oldest week (left), weekIndex = weeks-1 is newest (right)
    // Actually, the loop logic in original was: weeks-1 downto 0.
    // Let's stick to: col 0 is oldest, col N is newest.

    // Calculate date shift.
    // If we want the RIGHTMOST column to be "this week":
    // Offset = (weeks - 1 - weekIndex)
    const weekOffset = weeks - 1 - weekIndex;

    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
      const date = new Date(today);
      // Subtract days to get to the specific cell
      // (weeks offset * 7) + (days difference from today's dayOfWeek)
      // This logic is tricky. Let's simplify:
      // Find the start date of the heatmap (Weeks ago).

      // Reusing original logic which worked for positioning:
      // weekOffset=0 => This week.
      const dayDiff = weekOffset * 7 + (today.getDay() - dayOfWeek);
      date.setDate(today.getDate() - dayDiff);

      const dateKey = date.toISOString().split('T')[0];
      const count = dataMap.get(dateKey) || 0;

      const x = weekIndex * (cellSize + gap);
      const y = dayOfWeek * (cellSize + gap);

      // Only add if date is within range (mostly implicit by loop but good to control)
      cells.push({ date, count, x, y });
    }
  }

  const width = weeks * (cellSize + gap) + 25; // Extra for labels
  const height = 7 * (cellSize + gap) - gap;

  return (
    <div className="heatmap-calendar-container" style={{ width: '100%', overflowX: 'auto' }}>
      <svg width={width} height={height} style={{ overflow: 'visible', marginLeft: 20 }}>
        {/* Day labels */}
        {[1, 3, 5].map(dayIndex => (
          <text
            key={dayIndex}
            x={-6}
            y={dayIndex * (cellSize + gap) + cellSize / 1.5}
            fill="#94a3b8"
            fontSize={10}
            textAnchor="end"
            style={{ userSelect: 'none' }}
          >
            {getDayLabel(dayIndex).substring(0, 1)}
          </text>
        ))}

        {/* Cells */}
        {cells.map((cell, i) => (
          <rect
            key={i}
            x={cell.x}
            y={cell.y}
            width={cellSize}
            height={cellSize}
            rx={3}
            fill={getIntensityColor(cell.count, maxCount)}
            className="heatmap-cell"
            style={{ transition: 'all 0.2s ease', cursor: 'default' }}
          >
            <title>{`${cell.date.toLocaleDateString()}: ${cell.count} incident${cell.count !== 1 ? 's' : ''}`}</title>
          </rect>
        ))}
      </svg>
    </div>
  );
}
