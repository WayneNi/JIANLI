import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted to properly hoist mock values with vi.mock
const { mockPrisma } = vi.hoisted(() => {
  return {
    mockPrisma: {
      user: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      $transaction: vi.fn(),
    },
  };
});

vi.mock('@/lib/db', () => ({
  default: mockPrisma,
}));

// Import after mocking
import {
  checkCredits,
  reserveCredits,
  refundCredits,
  getCreditInfo,
} from '@/lib/credit';
import { CREDIT_COSTS } from '@/lib/stripe-products';

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  credits: 100,
  isLifetime: false,
  freeUsageCount: 0,
  freeResetDate: new Date('2026-04-01'), // Current month
};

describe('Credit System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkCredits', () => {
    it('should prioritize free quota over credits when available', async () => {
      // freeUsageCount: 0 means free quota is available
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        credits: 100,
        isLifetime: false,
        freeUsageCount: 0,
        freeResetDate: new Date('2026-04-01'), // Same month - quota available
      });

      const result = await checkCredits('user-1', 'OPTIMIZE');

      // Free quota is checked first, so it returns 'free' even though user has credits
      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('free');
      expect(result.cost).toBe(0);
    });

    it('should use credits when free quota is exhausted', async () => {
      // freeUsageCount: 1 means free quota is already used
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        credits: 100,
        isLifetime: false,
        freeUsageCount: 1, // Free quota exhausted
        freeResetDate: new Date('2026-04-01'), // Same month
      });

      const result = await checkCredits('user-1', 'OPTIMIZE');

      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('credits');
      expect(result.cost).toBe(CREDIT_COSTS.OPTIMIZE);
      expect(result.remaining).toBe(100);
    });

    it('should deny user with insufficient credits when free quota exhausted', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        credits: 5,
        isLifetime: false,
        freeUsageCount: 1, // Free quota exhausted
        freeResetDate: new Date('2026-04-01'), // Same month
      });

      const result = await checkCredits('user-1', 'OPTIMIZE');

      expect(result.allowed).toBe(false);
      expect(result.error).toBe('NO_CREDITS');
      expect(result.required).toBe(CREDIT_COSTS.OPTIMIZE);
      expect(result.remaining).toBe(5);
    });

    it('should deny non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await checkCredits('nonexistent', 'OPTIMIZE');

      expect(result.allowed).toBe(false);
      expect(result.error).toBe('NO_CREDITS');
      expect(result.message).toBe('用户不存在');
    });

    it('should allow lifetime user without checking credits', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        isLifetime: true,
        credits: 0,
        freeUsageCount: 1,
      });

      const result = await checkCredits('user-1', 'OPTIMIZE');

      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('lifetime');
      expect(result.cost).toBe(0);
    });

    it('should allow free quota usage on first OPTIMIZE', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        credits: 0,
        isLifetime: false,
        freeUsageCount: 0,
        freeResetDate: new Date('2026-04-01'),
      });

      const result = await checkCredits('user-1', 'OPTIMIZE');

      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('free');
      expect(result.cost).toBe(0);
    });

    it('should deny free quota when already used in same month', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        credits: 0,
        isLifetime: false,
        freeUsageCount: 1,
        freeResetDate: new Date('2026-04-01'), // Same month
      });

      const result = await checkCredits('user-1', 'OPTIMIZE');

      expect(result.allowed).toBe(false);
      expect(result.error).toBe('NO_CREDITS');
    });

    it('should reset free quota in new month', async () => {
      // Last month date - should trigger reset
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        credits: 0,
        isLifetime: false,
        freeUsageCount: 1, // Used free quota last month
        freeResetDate: new Date('2026-03-15'), // Last month - should reset
      });

      const result = await checkCredits('user-1', 'OPTIMIZE');

      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('free');
    });
  });

  describe('reserveCredits', () => {
    it('should reserve free quota for eligible user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        credits: 0,
        isLifetime: false,
        freeUsageCount: 0,
        freeResetDate: new Date('2026-04-01'),
      });

      mockPrisma.user.update.mockResolvedValue({
        ...mockUser,
        freeUsageCount: 1,
      });

      const result = await reserveCredits('user-1', 'OPTIMIZE');

      expect(result.success).toBe(true);
      expect(result.reason).toBe('free');
      expect(result.cost).toBe(0);
      expect(mockPrisma.user.update).toHaveBeenCalled();
    });

    it('should reserve for lifetime user without deduction', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        isLifetime: true,
      });

      const result = await reserveCredits('user-1', 'OPTIMIZE');

      expect(result.success).toBe(true);
      expect(result.reason).toBe('lifetime');
      expect(result.cost).toBe(0);
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('should fail for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await reserveCredits('nonexistent', 'OPTIMIZE');

      expect(result.success).toBe(false);
      expect(result.error).toBe('用户不存在');
    });
  });

  describe('refundCredits', () => {
    it('should refund credits successfully', async () => {
      mockPrisma.user.update.mockResolvedValue({
        ...mockUser,
        credits: 100,
      });

      await refundCredits('user-1', 'OPTIMIZE', 10);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { credits: { increment: 10 } },
      });
    });

    it('should not refund when cost is zero', async () => {
      await refundCredits('user-1', 'OPTIMIZE', 0);

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('should not refund when cost is negative', async () => {
      await refundCredits('user-1', 'OPTIMIZE', -5);

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.user.update.mockRejectedValue(new Error('DB Error'));

      // Should not throw
      await expect(refundCredits('user-1', 'OPTIMIZE', 10)).resolves.not.toThrow();

      // Error should be logged but not thrown
      expect(mockPrisma.user.update).toHaveBeenCalled();
    });
  });

  describe('getCreditInfo', () => {
    it('should return correct credit info for regular user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        credits: 50,
        isLifetime: false,
        freeUsageCount: 0,
        freeResetDate: new Date('2026-04-01'),
      });

      const info = await getCreditInfo('user-1');

      expect(info).toEqual({
        credits: 50,
        isLifetime: false,
        freeQuotaUsed: false,
        freeQuotaRemaining: 1,
        freeResetDate: expect.any(Date),
      });
    });

    it('should return null for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const info = await getCreditInfo('nonexistent');

      expect(info).toBeNull();
    });

    it('should indicate free quota used when count >= 1 in same month', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        credits: 50,
        isLifetime: false,
        freeUsageCount: 1,
        freeResetDate: new Date('2026-04-01'), // Same month - quota used
      });

      const info = await getCreditInfo('user-1');

      expect(info?.freeQuotaUsed).toBe(true);
      expect(info?.freeQuotaRemaining).toBe(0);
    });

    it('should indicate lifetime membership correctly', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        credits: 0,
        isLifetime: true,
        freeUsageCount: 1,
      });

      const info = await getCreditInfo('user-1');

      expect(info?.isLifetime).toBe(true);
    });

    it('should reset free quota in new month', async () => {
      // Last month date - should trigger reset
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        credits: 50,
        isLifetime: false,
        freeUsageCount: 1, // Had used quota last month
        freeResetDate: new Date('2026-03-15'), // Last month - should reset
      });

      const info = await getCreditInfo('user-1');

      // In new month, quota should be reset
      expect(info?.freeQuotaUsed).toBe(false);
      expect(info?.freeQuotaRemaining).toBe(1);
    });
  });
});
