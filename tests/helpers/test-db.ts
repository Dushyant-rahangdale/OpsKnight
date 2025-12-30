import { Prisma, PrismaClient } from '@prisma/client';

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

    const tables = tablenames.map(({ tablename }) => `"${tablename}"`).join(', ');

    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
    } catch (error: unknown) {
      if ((error as { code?: string }).code === '40P01') { // Deadlock
        console.log('Deadlock detected during reset, retrying...');
        await new Promise(resolve => setTimeout(resolve, 100));
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
        return;
      }
      throw error;
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error resetting database:', message);
    if (message.includes("Can't reach database") || message.includes('Canbt reach database')) {
      console.error('Check if your database at DATABASE_URL is running.');
    }
    throw error; // Fail the test if reset fails
  }
}

export async function createTestUser(overrides: Partial<Prisma.UserCreateInput> = {}) {
  // Ensure unique email
  const email =
    typeof overrides.email === 'string'
      ? overrides.email
      : `test-${Math.random().toString(36).slice(2, 9)}@example.com`;

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

export async function createTestTeam(
  name: string,
  overrides: Partial<Prisma.TeamUncheckedCreateInput> = {}
) {
  return await prisma.team.create({
    data: {
      name,
      ...overrides,
    },
  });
}

export async function createTestService(
  name: string,
  teamId?: string | null,
  overrides: Partial<Prisma.ServiceUncheckedCreateInput> = {}
) {
  return await prisma.service.create({
    data: {
      name,
      ...overrides,
      ...(teamId ? { teamId } : {}),
    },
  });
}

export async function createTestIncident(
  title: string,
  serviceId: string,
  overrides: Partial<Prisma.IncidentUncheckedCreateInput> = {}
) {
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

export async function createTestNotificationProvider(
  provider: string,
  config: Prisma.InputJsonObject = {},
  overrides: Partial<Prisma.NotificationProviderCreateInput> = {}
) {
  return await prisma.notificationProvider.upsert({
    where: {
      provider: provider,
    },
    update: {
      enabled: true,
      config,
      ...overrides,
    },
    create: {
      provider,
      enabled: true,
      config,
      ...overrides,
    },
  });
}

export async function createTestEscalationPolicy(
  name: string,
  steps: Array<Prisma.EscalationRuleCreateWithoutPolicyInput>,
  overrides: Partial<Prisma.EscalationPolicyCreateInput> = {}
) {
  return await prisma.escalationPolicy.create({
    data: {
      name,
      steps: {
        create: steps.map(s => ({
          notificationChannels: [],
          ...s,
        })),
      },
      ...overrides,
    },
  });
}

export { prisma as testPrisma };
