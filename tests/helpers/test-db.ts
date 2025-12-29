import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function resetDatabase() {
    try {
        const tablenames = await prisma.$queryRaw<
            Array<{ tablename: string }>
        >`SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename NOT LIKE '_prisma_migrations';`;

        if (tablenames.length === 0) {
            console.log('No tables found to reset.');
            return;
        }

        const tables = tablenames
            .map(({ tablename }) => `"${tablename}"`)
            .join(', ');

        await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
    } catch (error: any) {
        console.error('Error resetting database:', error.message);
        if (error.message.includes('Canbt reach database')) {
            console.error('Check if your database at DATABASE_URL is running.');
        }
    }
}

export async function createTestUser(overrides = {}) {
    // Ensure unique email
    const email = (overrides as any).email || `test-${Math.random().toString(36).substr(2, 7)}@example.com`;

    return await prisma.user.create({
        data: {
            email,
            name: 'Test User',
            passwordHash: 'hashed-pw',
            role: 'USER',
            status: 'ACTIVE',
            ...overrides,
        },
    });
}

export async function createTestTeam(name: string, overrides = {}) {
    return await prisma.team.create({
        data: {
            name,
            ...overrides,
        },
    });
}

export async function createTestService(name: string, teamId: string | null = null, overrides = {}) {
    return await prisma.service.create({
        data: {
            name,
            teamId,
            ...overrides,
        },
    });
}

export async function createTestIncident(title: string, serviceId: string, overrides = {}) {
    return await prisma.incident.create({
        data: {
            title,
            serviceId,
            status: 'OPEN',
            urgency: 'HIGH',
            ...overrides,
        },
    });
}

export async function createTestNotificationProvider(provider: string, config: any = {}, overrides = {}) {
    return await prisma.notificationProvider.upsert({
        where: {
            provider: provider
        },
        update: {
            enabled: true,
            config,
            ...overrides
        },
        create: {
            provider,
            enabled: true,
            config,
            ...overrides
        }
    });
}

export async function createTestEscalationPolicy(name: string, steps: any[], overrides = {}) {
    return await prisma.escalationPolicy.create({
        data: {
            name,
            steps: {
                create: steps
            },
            ...overrides
        }
    });
}

export { prisma as testPrisma };
