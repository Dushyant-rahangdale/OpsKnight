import prisma from '@/lib/prisma';
import MobileHeader from '@/components/mobile/MobileHeader';

export default async function MobileHeaderLoader() {
  // Incident Counts Logic
  let criticalOpenCount = 0;
  let mediumOpenCount = 0;

  try {
    const openUrgencyCounts = await prisma.incident.groupBy({
      by: ['urgency'],
      where: {
        status: { notIn: ['RESOLVED', 'SNOOZED', 'SUPPRESSED'] as const },
      },
      _count: { _all: true },
    });

    for (const entry of openUrgencyCounts) {
      if (entry.urgency === 'HIGH') criticalOpenCount = entry._count._all;
      else if (entry.urgency === 'MEDIUM') mediumOpenCount = entry._count._all;
    }
  } catch (error) {
    console.error('Failed to load incident counts', error);
  }

  // Determine System Status
  let systemStatus: 'ok' | 'warning' | 'danger' = 'ok';
  if (criticalOpenCount > 0) systemStatus = 'danger';
  else if (mediumOpenCount > 0) systemStatus = 'warning';

  return <MobileHeader systemStatus={systemStatus} />;
}
