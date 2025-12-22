import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const searchParams = req.nextUrl.searchParams;
        const query = searchParams.get('q');

        if (!query || query.length < 2) {
            return NextResponse.json({ results: [] });
        }

        const searchTerm = query.trim().toLowerCase();

        // Run all searches in parallel for better performance
        const [incidents, services, teams, users, policies] = await Promise.all([
            // Search incidents
            prisma.incident.findMany({
                where: {
                    OR: [
                        { title: { contains: searchTerm, mode: 'insensitive' } },
                        { description: { contains: searchTerm, mode: 'insensitive' } }
                    ]
                },
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    title: true,
                    status: true,
                    urgency: true,
                    service: { select: { id: true, name: true } }
                }
            }),

            // Search services
            prisma.service.findMany({
                where: {
                    OR: [
                        { name: { contains: searchTerm, mode: 'insensitive' } },
                        { description: { contains: searchTerm, mode: 'insensitive' } }
                    ]
                },
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    status: true,
                    team: { select: { id: true, name: true } }
                }
            }),

            // Search teams
            prisma.team.findMany({
                where: {
                    OR: [
                        { name: { contains: searchTerm, mode: 'insensitive' } },
                        { description: { contains: searchTerm, mode: 'insensitive' } }
                    ]
                },
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    description: true
                }
            }),

            // Search users
            prisma.user.findMany({
                where: {
                    OR: [
                        { name: { contains: searchTerm, mode: 'insensitive' } },
                        { email: { contains: searchTerm, mode: 'insensitive' } }
                    ]
                },
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true
                }
            }),

            // Search escalation policies
            prisma.escalationPolicy.findMany({
                where: {
                    OR: [
                        { name: { contains: searchTerm, mode: 'insensitive' } },
                        { description: { contains: searchTerm, mode: 'insensitive' } }
                    ]
                },
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    description: true
                }
            })
        ]);

        // Format results with proper priorities (incidents first, then services, etc.)
        const results = [
            ...incidents.map(i => ({
                type: 'incident' as const,
                id: i.id,
                title: i.title,
                subtitle: `${i.service.name} • ${i.status}${i.urgency === 'HIGH' ? ' • High' : ''}`,
                href: `/incidents/${i.id}`,
                priority: i.urgency === 'HIGH' ? 1 : 2
            })),
            ...services.map(s => ({
                type: 'service' as const,
                id: s.id,
                title: s.name,
                subtitle: `${s.team?.name || 'No team'} • ${s.status || 'Active'}`,
                href: `/services/${s.id}`,
                priority: 3
            })),
            ...teams.map(t => ({
                type: 'team' as const,
                id: t.id,
                title: t.name,
                subtitle: t.description || 'Team',
                href: `/teams/${t.id}`,
                priority: 4
            })),
            ...users.map(u => ({
                type: 'user' as const,
                id: u.id,
                title: u.name || u.email,
                subtitle: u.email || `${u.role || 'User'}`,
                href: `/users?highlight=${u.id}`,
                priority: 5
            })),
            ...policies.map(p => ({
                type: 'policy' as const,
                id: p.id,
                title: p.name,
                subtitle: p.description || 'Escalation Policy',
                href: `/policies/${p.id}`,
                priority: 6
            }))
        ].sort((a, b) => a.priority - b.priority); // Sort by priority

        return NextResponse.json({ results });
    } catch (error) {
        console.error('Search error:', error);
        return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }
}