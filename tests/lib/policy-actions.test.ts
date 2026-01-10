import { beforeEach, describe, expect, it, vi } from 'vitest';
import prisma from '@/lib/prisma';
import { movePolicyStep } from '@/app/(app)/policies/actions';

vi.mock('@/lib/rbac', () => ({
  assertAdmin: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/audit', () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
  getDefaultActorId: vi.fn().mockResolvedValue('actor-1'),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('movePolicyStep', () => {
  const prismaMock = prisma as any;

  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$transaction.mockImplementation(async (arg: any) => {
      if (Array.isArray(arg)) {
        return Promise.all(arg);
      }
      return arg(prismaMock);
    });
  });

  it('swaps delay minutes when moving a step up', async () => {
    prismaMock.escalationRule.findUnique.mockResolvedValue({
      id: 'step-1',
      policyId: 'pol-1',
      stepOrder: 1,
      delayMinutes: 10,
    });

    prismaMock.escalationRule.findMany.mockResolvedValue([
      { id: 'step-0', stepOrder: 0, delayMinutes: 0 },
      { id: 'step-1', stepOrder: 1, delayMinutes: 10 },
    ]);

    await movePolicyStep('step-1', 'up');

    const updates = prismaMock.escalationRule.update.mock.calls.map((call: any) => call[0]);

    expect(updates).toEqual(
      expect.arrayContaining([
        {
          where: { id: 'step-1' },
          data: { stepOrder: 0, delayMinutes: 0 },
        },
        {
          where: { id: 'step-0' },
          data: { stepOrder: 1, delayMinutes: 10 },
        },
      ])
    );
  });
});
