import { NextRequest, NextResponse } from 'next/server';

/**
 * SLA Performance Admin API
 *
 * Returns SLA query performance metrics for admin monitoring.
 *
 * GET /api/admin/sla-performance
 */

export const dynamic = 'force-dynamic';

interface PerformanceMetrics {
    period: string;
    queryCount: number;
    avgDuration: number | null;
    p50Duration: number | null;
    p95Duration: number | null;
    slowQueryCount: number;
    avgIncidentCount: number | null;
    recommendations: string[];
}

export async function GET(req: NextRequest) {
    const { getServerSession } = await import('next-auth');
    const { getAuthOptions } = await import('@/lib/auth');

    // Authenticate and check admin role
    const authOptions = await getAuthOptions();
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check for admin role
    const { default: prisma } = await import('@/lib/prisma');
    const user = await prisma.user.findUnique({
        where: { email: session.user.email as string },
        select: { role: true }
    });

    if (user?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const period = searchParams.get('period') || '24h';

    // Note: In production, you would query a metrics store or log aggregator
    // For now, return a structured response format that can be populated later

    const metrics: PerformanceMetrics = {
        period,
        queryCount: 0, // Would come from metrics store
        avgDuration: null,
        p50Duration: null,
        p95Duration: null,
        slowQueryCount: 0,
        avgIncidentCount: null,
        recommendations: getPerformanceRecommendations()
    };

    return NextResponse.json({
        success: true,
        metrics,
        meta: {
            generatedAt: new Date().toISOString(),
            dataSource: 'placeholder', // Would be 'logs' or 'metrics-store' in production
        }
    });
}

function getPerformanceRecommendations(): string[] {
    return [
        'Use service or team filters to reduce query scope',
        'Consider using rollup data for queries >90 days',
        'Use the /api/sla/stream endpoint for datasets >50k incidents',
        'Ensure database indexes are applied via Prisma migration',
    ];
}
