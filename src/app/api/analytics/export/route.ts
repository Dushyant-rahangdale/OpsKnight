import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const formatMinutes = (ms: number | null) => (ms === null ? '--' : `${(ms / 1000 / 60).toFixed(1)}m`);
const formatPercent = (value: number) => `${value.toFixed(0)}%`;
const formatHours = (ms: number) => `${(ms / 1000 / 60 / 60).toFixed(1)}h`;

function escapeCSV(value: string | number | null | undefined): string {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

function generateCSV(data: any[][]): string {
    return data.map(row => row.map(escapeCSV).join(',')).join('\n');
}

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const format = searchParams.get('format') || 'csv';
        
        const teamId = searchParams.get('team') && searchParams.get('team') !== 'ALL' 
            ? searchParams.get('team') 
            : null;
        const serviceId = searchParams.get('service') && searchParams.get('service') !== 'ALL'
            ? searchParams.get('service')
            : null;
        const assigneeId = searchParams.get('assignee') && searchParams.get('assignee') !== 'ALL'
            ? searchParams.get('assignee')
            : null;
        const statusFilter = searchParams.get('status') || 'ALL';
        const urgencyFilter = searchParams.get('urgency') || 'ALL';
        const windowDays = parseInt(searchParams.get('window') || '7', 10);

        const now = new Date();
        const recentStart = new Date(now);
        recentStart.setDate(now.getDate() - windowDays);

        // Build where clauses
        const serviceWhere = serviceId
            ? { serviceId }
            : teamId
                ? { service: { teamId } }
                : null;

        const statusWhere = statusFilter !== 'ALL' ? { status: statusFilter } : null;
        const urgencyWhere = urgencyFilter !== 'ALL' ? { urgency: urgencyFilter } : null;
        const assigneeWhere = assigneeId ? { assigneeId } : null;

        const recentIncidentWhere = {
            createdAt: { gte: recentStart },
            ...(serviceWhere ?? {}),
            ...(urgencyWhere ?? {}),
            ...(statusWhere ?? {}),
            ...(assigneeWhere ?? {})
        };

        // Fetch data
        const [recentIncidents, services, teams, users, statusTrends, topServices] = await Promise.all([
            prisma.incident.findMany({
                where: recentIncidentWhere,
                include: {
                    service: true,
                    assignee: true
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.service.findMany({
                where: teamId ? { teamId } : undefined,
                include: { team: true }
            }),
            prisma.team.findMany(),
            prisma.user.findMany(),
            prisma.incident.groupBy({
                by: ['status'],
                where: recentIncidentWhere,
                _count: { _all: true }
            }),
            prisma.incident.groupBy({
                by: ['serviceId'],
                where: recentIncidentWhere,
                _count: { _all: true },
                orderBy: { _count: { id: 'desc' } },
                take: 10
            })
        ]);

        // Calculate metrics
        const totalIncidents = recentIncidents.length;
        const resolvedIncidents = recentIncidents.filter(i => i.status === 'RESOLVED');
        const openIncidents = recentIncidents.filter(i => i.status === 'OPEN');
        const highUrgencyCount = recentIncidents.filter(i => i.urgency === 'HIGH').length;

        // Calculate MTTA and MTTR (simplified)
        const ackEvents = await prisma.incidentEvent.findMany({
            where: {
                incidentId: { in: recentIncidents.map(i => i.id) },
                message: { contains: 'acknowledged', mode: 'insensitive' }
            },
            select: { incidentId: true, createdAt: true }
        });

        const ackByIncident = new Map<string, Date>();
        for (const ack of ackEvents) {
            if (!ackByIncident.has(ack.incidentId)) {
                ackByIncident.set(ack.incidentId, ack.createdAt);
            }
        }

        const ackDiffs: number[] = [];
        for (const incident of recentIncidents) {
            const ackedAt = ackByIncident.get(incident.id);
            if (ackedAt && incident.createdAt) {
                ackDiffs.push(ackedAt.getTime() - incident.createdAt.getTime());
            }
        }
        const mttaMs = ackDiffs.length ? ackDiffs.reduce((sum, diff) => sum + diff, 0) / ackDiffs.length : null;

        const resolvedDiffs = resolvedIncidents
            .map(i => i.updatedAt && i.createdAt ? i.updatedAt.getTime() - i.createdAt.getTime() : null)
            .filter((diff): diff is number => diff !== null);
        const mttrMs = resolvedDiffs.length ? resolvedDiffs.reduce((sum, diff) => sum + diff, 0) / resolvedDiffs.length : null;

        const resolutionRate = totalIncidents ? (resolvedIncidents.length / totalIncidents) * 100 : 0;
        const ackRate = totalIncidents ? (ackByIncident.size / totalIncidents) * 100 : 0;

        // Build CSV content with well-designed structure
        const csvRows: string[][] = [];

        // Header section with branding
        csvRows.push(['═══════════════════════════════════════════════════════════════']);
        csvRows.push(['                    ANALYTICS REPORT']);
        csvRows.push(['              Operational Readiness Dashboard']);
        csvRows.push(['═══════════════════════════════════════════════════════════════']);
        csvRows.push(['']);
        csvRows.push(['Report Generated:', new Date().toLocaleString('en-US', { 
            dateStyle: 'full', 
            timeStyle: 'long' 
        })]);
        csvRows.push(['Time Window:', `Last ${windowDays} day${windowDays !== 1 ? 's' : ''}`]);
        csvRows.push(['Report Period:', `${recentStart.toLocaleDateString()} to ${now.toLocaleDateString()}`]);
        csvRows.push(['']);
        
        // Filter information
        csvRows.push(['───────────────────────────────────────────────────────────────']);
        csvRows.push(['FILTERS APPLIED']);
        csvRows.push(['───────────────────────────────────────────────────────────────']);
        const hasFilters = teamId || serviceId || assigneeId || statusFilter !== 'ALL' || urgencyFilter !== 'ALL';
        if (hasFilters) {
            if (teamId) {
                const team = teams.find(t => t.id === teamId);
                csvRows.push(['Team:', team?.name || teamId]);
            } else {
                csvRows.push(['Team:', 'All Teams']);
            }
            if (serviceId) {
                const service = services.find(s => s.id === serviceId);
                csvRows.push(['Service:', service?.name || serviceId]);
            } else {
                csvRows.push(['Service:', 'All Services']);
            }
            if (assigneeId) {
                const user = users.find(u => u.id === assigneeId);
                csvRows.push(['Assignee:', user?.name || user?.email || assigneeId]);
            } else {
                csvRows.push(['Assignee:', 'All Assignees']);
            }
            csvRows.push(['Status:', statusFilter === 'ALL' ? 'All Statuses' : statusFilter]);
            csvRows.push(['Urgency:', urgencyFilter === 'ALL' ? 'All Urgencies' : urgencyFilter]);
        } else {
            csvRows.push(['No filters applied - showing all data']);
        }
        csvRows.push(['']);

        // Summary metrics with visual separators
        csvRows.push(['───────────────────────────────────────────────────────────────']);
        csvRows.push(['KEY PERFORMANCE INDICATORS (KPIs)']);
        csvRows.push(['───────────────────────────────────────────────────────────────']);
        csvRows.push(['Metric', 'Value', 'Status']);
        
        // Add status indicators
        const getStatusIndicator = (value: number, thresholds: { good: number; warning: number }) => {
            if (value >= thresholds.good) return '✓ Good';
            if (value >= thresholds.warning) return '⚠ Warning';
            return '✗ Needs Attention';
        };
        
        csvRows.push(['Total Incidents', totalIncidents.toString(), '']);
        csvRows.push(['Open Incidents', openIncidents.length.toString(), openIncidents.length > 10 ? '⚠ High' : '✓ Normal']);
        csvRows.push(['Resolved Incidents', resolvedIncidents.length.toString(), '']);
        csvRows.push(['High Urgency Incidents', highUrgencyCount.toString(), highUrgencyCount > 5 ? '⚠ High' : '✓ Normal']);
        csvRows.push(['MTTA (Mean Time to Acknowledge)', formatMinutes(mttaMs), mttaMs && mttaMs < 15 * 60 * 1000 ? '✓ Good' : '⚠ Review']);
        csvRows.push(['MTTR (Mean Time to Resolve)', formatMinutes(mttrMs), mttrMs && mttrMs < 120 * 60 * 1000 ? '✓ Good' : '⚠ Review']);
        csvRows.push(['Acknowledgment Rate', formatPercent(ackRate), getStatusIndicator(ackRate, { good: 90, warning: 70 })]);
        csvRows.push(['Resolution Rate', formatPercent(resolutionRate), getStatusIndicator(resolutionRate, { good: 80, warning: 60 })]);
        csvRows.push(['']);

        // Status breakdown with visual bars
        csvRows.push(['───────────────────────────────────────────────────────────────']);
        csvRows.push(['INCIDENT STATUS BREAKDOWN']);
        csvRows.push(['───────────────────────────────────────────────────────────────']);
        csvRows.push(['Status', 'Count', 'Percentage', 'Visual']);
        const statusMap = new Map(statusTrends.map(s => [s.status, s._count._all]));
        const statusOrder = ['OPEN', 'ACKNOWLEDGED', 'SNOOZED', 'SUPPRESSED', 'RESOLVED'];
        statusOrder.forEach(status => {
            const count = statusMap.get(status) || 0;
            const percentage = totalIncidents ? parseFloat(((count / totalIncidents) * 100).toFixed(1)) : 0;
            const barLength = Math.round(percentage / 2); // Scale bar to 50 chars max
            const bar = '█'.repeat(barLength);
            csvRows.push([status, count.toString(), `${percentage.toFixed(1)}%`, bar]);
        });
        csvRows.push(['']);

        // Top services with ranking
        csvRows.push(['───────────────────────────────────────────────────────────────']);
        csvRows.push(['TOP SERVICES BY INCIDENT COUNT']);
        csvRows.push(['───────────────────────────────────────────────────────────────']);
        csvRows.push(['Rank', 'Service', 'Incident Count', 'Percentage']);
        const serviceNameMap = new Map(services.map(s => [s.id, s.name]));
        topServices.forEach((entry, index) => {
            const serviceName = serviceNameMap.get(entry.serviceId) || 'Unknown Service';
            const percentage = totalIncidents ? ((entry._count._all / totalIncidents) * 100).toFixed(1) : '0.0';
            csvRows.push([
                `#${index + 1}`,
                serviceName,
                entry._count._all.toString(),
                `${percentage}%`
            ]);
        });
        csvRows.push(['']);

        // Detailed incident list
        csvRows.push(['DETAILED INCIDENT LIST']);
        csvRows.push([
            'ID',
            'Title',
            'Service',
            'Status',
            'Urgency',
            'Assignee',
            'Created At',
            'Updated At',
            'Duration (hours)'
        ]);

        recentIncidents.forEach(incident => {
            const duration = incident.updatedAt && incident.createdAt
                ? ((incident.updatedAt.getTime() - incident.createdAt.getTime()) / 1000 / 60 / 60).toFixed(2)
                : '--';
            
            csvRows.push([
                incident.id,
                incident.title || '',
                incident.service?.name || 'Unknown',
                incident.status,
                incident.urgency,
                incident.assignee?.name || incident.assignee?.email || 'Unassigned',
                incident.createdAt.toISOString(),
                incident.updatedAt.toISOString(),
                duration
            ]);
        });

        // Generate CSV
        const csvContent = generateCSV(csvRows);

        // Return response
        return new NextResponse(csvContent, {
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="analytics-report-${new Date().toISOString().split('T')[0]}.csv"`,
            },
        });
    } catch (error) {
        console.error('Export error:', error);
        return NextResponse.json(
            { error: 'Failed to generate export' },
            { status: 500 }
        );
    }
}

