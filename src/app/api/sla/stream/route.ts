import { NextRequest, NextResponse } from 'next/server';

/**
 * SLA Streaming API - Server-Sent Events Endpoint
 *
 * Streams SLA metrics data in batches for large datasets.
 * Prevents memory exhaustion by processing incidents in chunks.
 *
 * GET /api/sla/stream?serviceId=xxx&windowDays=30
 */

export const dynamic = 'force-dynamic';

const BATCH_SIZE = 100;

export async function GET(req: NextRequest) {
    const { default: prisma } = await import('@/lib/prisma');
    const { getServerSession } = await import('next-auth');
    const { getAuthOptions } = await import('@/lib/auth');

    // Authenticate
    const authOptions = await getAuthOptions();
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const serviceId = searchParams.get('serviceId');
    const windowDays = parseInt(searchParams.get('windowDays') || '7', 10);

    // Calculate date range
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - windowDays);

    // Build where clause
    const where = {
        createdAt: { gte: startDate, lte: now },
        ...(serviceId ? { serviceId } : {}),
    };

    // Create SSE stream
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            try {
                // Send initial metadata
                const totalCount = await prisma.incident.count({ where });
                controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ type: 'meta', totalCount, batchSize: BATCH_SIZE })}\n\n`)
                );

                // Stream incidents in batches
                let skip = 0;
                let batchNumber = 0;

                while (true) {
                    const batch = await prisma.incident.findMany({
                        where,
                        select: {
                            id: true,
                            title: true,
                            status: true,
                            urgency: true,
                            createdAt: true,
                            acknowledgedAt: true,
                            resolvedAt: true,
                            serviceId: true,
                            service: {
                                select: {
                                    name: true,
                                    targetAckMinutes: true,
                                    targetResolveMinutes: true,
                                },
                            },
                        },
                        take: BATCH_SIZE,
                        skip,
                        orderBy: { createdAt: 'desc' },
                    });

                    if (batch.length === 0) break;

                    // Send batch
                    const data = JSON.stringify({
                        type: 'batch',
                        batchNumber,
                        incidents: batch,
                        remaining: Math.max(0, totalCount - skip - batch.length),
                    });
                    controller.enqueue(encoder.encode(`data: ${data}\n\n`));

                    skip += BATCH_SIZE;
                    batchNumber++;

                    // Small delay to prevent overwhelming the client
                    await new Promise(resolve => setTimeout(resolve, 10));
                }

                // Send completion message
                controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ type: 'complete', totalBatches: batchNumber })}\n\n`)
                );
                controller.close();
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ type: 'error', message: errorMessage })}\n\n`)
                );
                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no', // Disable nginx buffering
        },
    });
}
