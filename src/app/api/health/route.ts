import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * Health check endpoint
 * Returns the health status of the application and its dependencies
 * 
 * GET /api/health
 * 
 * Response:
 * {
 *   status: "healthy" | "degraded" | "unhealthy",
 *   timestamp: string,
 *   checks: {
 *     database: { status: "healthy" | "unhealthy", latency?: number },
 *     // Add more checks as needed
 *   }
 * }
 */
export async function GET() {
    const startTime = Date.now();
    const checks: Record<string, { status: 'healthy' | 'unhealthy'; latency?: number; error?: string }> = {};

    // Check database connection
    try {
        const dbStartTime = Date.now();
        await prisma.$queryRaw`SELECT 1`;
        const dbLatency = Date.now() - dbStartTime;
        
        checks.database = {
            status: 'healthy',
            latency: dbLatency,
        };
    } catch (error: any) {
        checks.database = {
            status: 'unhealthy',
            error: error.message,
        };
    }

    // Determine overall status
    const allHealthy = Object.values(checks).every(check => check.status === 'healthy');
    const anyUnhealthy = Object.values(checks).some(check => check.status === 'unhealthy');
    
    const overallStatus = allHealthy 
        ? 'healthy' 
        : anyUnhealthy 
        ? 'unhealthy' 
        : 'degraded';

    const response = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        checks,
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
    };

    const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;

    return NextResponse.json(response, { status: statusCode });
}
