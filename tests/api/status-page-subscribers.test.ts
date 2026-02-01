import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, DELETE } from '../../src/app/api/status-page/subscribers/route';
import { NextRequest } from 'next/server';
import prisma from '../../src/lib/prisma';
import * as auth from '../../src/lib/auth';
import * as nextAuth from 'next-auth';
import * as rbac from '../../src/lib/rbac';

// Mock dependencies
vi.mock('../../src/lib/prisma', () => ({
  default: {
    statusPageSubscription: {
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('../../src/lib/auth', () => ({
  getAuthOptions: vi.fn(),
}));

vi.mock('../../src/lib/rbac', () => ({
  assertAdmin: vi.fn(),
}));

describe('Status Page Subscribers API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (nextAuth.getServerSession as any).mockResolvedValue({ user: { id: 'admin-1' } });
    (auth.getAuthOptions as any).mockReturnValue({});
    (rbac.assertAdmin as any).mockResolvedValue(true);
  });

  describe('GET', () => {
    it('should return unauthorized if no session', async () => {
      (nextAuth.getServerSession as any).mockResolvedValue(null);
      const req = new NextRequest('http://localhost/api/status-page/subscribers');
      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it('should return forbidden if not admin', async () => {
      (rbac.assertAdmin as any).mockRejectedValue(new Error('Unauthorized'));
      const req = new NextRequest('http://localhost/api/status-page/subscribers');
      const res = await GET(req);
      expect(res.status).toBe(403);
    });

    it('should return subscribers with pagination', async () => {
      (prisma.statusPageSubscription.count as any).mockResolvedValue(20);
      (prisma.statusPageSubscription.findMany as any).mockResolvedValue([
        { id: '1', email: 'test@example.com' },
      ]);

      const req = new NextRequest('http://localhost/api/status-page/subscribers?page=1&limit=10');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      // jsonOk typically returns the object directly as JSON body
      expect(data.total).toBe(20);
      expect(data.subscribers).toHaveLength(1);
    });

    it('should filter by verified status', async () => {
      (prisma.statusPageSubscription.count as any).mockResolvedValue(5);
      (prisma.statusPageSubscription.findMany as any).mockResolvedValue([]);

      const req = new NextRequest('http://localhost/api/status-page/subscribers?verified=true');
      await GET(req);

      expect(prisma.statusPageSubscription.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ verified: true }),
        })
      );
    });
  });

  describe('DELETE', () => {
    it('should unsubscribe subscriber', async () => {
      (prisma.statusPageSubscription.findUnique as any).mockResolvedValue({
        id: 'sub-1',
        email: 'test@example.com',
      });

      const req = new NextRequest('http://localhost/api/status-page/subscribers?id=sub-1');
      const res = await DELETE(req);

      expect(res.status).toBe(200);
      expect(prisma.statusPageSubscription.update).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
        data: expect.objectContaining({ unsubscribedAt: expect.any(Date) }),
      });
    });

    it('should return 404 if subscriber not found', async () => {
      (prisma.statusPageSubscription.findUnique as any).mockResolvedValue(null);

      const req = new NextRequest('http://localhost/api/status-page/subscribers?id=sub-1');
      const res = await DELETE(req);

      expect(res.status).toBe(404);
    });
  });
});
