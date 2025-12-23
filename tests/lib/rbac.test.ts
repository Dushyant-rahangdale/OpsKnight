import { describe, it, expect, vi, beforeEach } from 'vitest';
import { assertAdmin, assertAdminOrResponder, assertResponderOrAbove } from '@/lib/rbac';
import * as rbacModule from '@/lib/rbac';

// Mock the getCurrentUser function
vi.mock('@/lib/rbac', async () => {
  const actual = await vi.importActual('@/lib/rbac');
  return {
    ...actual,
    getCurrentUser: vi.fn(),
  };
});

describe('RBAC Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('assertAdmin', () => {
    it('should allow ADMIN role', async () => {
      vi.mocked(rbacModule.getCurrentUser).mockResolvedValueOnce({
        id: 'user-1',
        role: 'ADMIN',
        email: 'admin@test.com',
        name: 'Admin User',
      } as any);

      const user = await assertAdmin();
      expect(user.role).toBe('ADMIN');
    });

    it('should throw error for non-ADMIN role', async () => {
      vi.mocked(rbacModule.getCurrentUser).mockResolvedValueOnce({
        id: 'user-1',
        role: 'USER',
        email: 'user@test.com',
        name: 'Regular User',
      } as any);

      await expect(assertAdmin()).rejects.toThrow('Unauthorized. Admin access required.');
    });
  });

  describe('assertAdminOrResponder', () => {
    it('should allow ADMIN role', async () => {
      vi.mocked(rbacModule.getCurrentUser).mockResolvedValueOnce({
        id: 'user-1',
        role: 'ADMIN',
        email: 'admin@test.com',
        name: 'Admin User',
      } as any);

      const user = await assertAdminOrResponder();
      expect(user.role).toBe('ADMIN');
    });

    it('should allow RESPONDER role', async () => {
      vi.mocked(rbacModule.getCurrentUser).mockResolvedValueOnce({
        id: 'user-1',
        role: 'RESPONDER',
        email: 'responder@test.com',
        name: 'Responder User',
      } as any);

      const user = await assertAdminOrResponder();
      expect(user.role).toBe('RESPONDER');
    });

    it('should throw error for USER role', async () => {
      vi.mocked(rbacModule.getCurrentUser).mockResolvedValueOnce({
        id: 'user-1',
        role: 'USER',
        email: 'user@test.com',
        name: 'Regular User',
      } as any);

      await expect(assertAdminOrResponder()).rejects.toThrow('Unauthorized. Admin or Responder access required.');
    });
  });

  describe('assertResponderOrAbove', () => {
    it('should allow ADMIN role', async () => {
      vi.mocked(rbacModule.getCurrentUser).mockResolvedValueOnce({
        id: 'user-1',
        role: 'ADMIN',
        email: 'admin@test.com',
        name: 'Admin User',
      } as any);

      const user = await assertResponderOrAbove();
      expect(user.role).toBe('ADMIN');
    });

    it('should allow RESPONDER role', async () => {
      vi.mocked(rbacModule.getCurrentUser).mockResolvedValueOnce({
        id: 'user-1',
        role: 'RESPONDER',
        email: 'responder@test.com',
        name: 'Responder User',
      } as any);

      const user = await assertResponderOrAbove();
      expect(user.role).toBe('RESPONDER');
    });

    it('should throw error for USER role', async () => {
      vi.mocked(rbacModule.getCurrentUser).mockResolvedValueOnce({
        id: 'user-1',
        role: 'USER',
        email: 'user@test.com',
        name: 'Regular User',
      } as any);

      await expect(assertResponderOrAbove()).rejects.toThrow('Unauthorized. Responder access or above required.');
    });
  });
});

