import { UnauthorizedException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from './auth.service.js';

function makePrismaMock() {
  return {
    user: { findUnique: vi.fn(), create: vi.fn() },
    refreshToken: {
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      create: vi.fn(),
    },
  };
}

function makeJwtServiceMock() {
  return { sign: vi.fn(() => 'signed.access.token') };
}

function makeConfigMock() {
  return { get: vi.fn(() => 'test-secret-that-is-at-least-32-chars') };
}

describe('AuthService#refresh — reuse detection', () => {
  let prisma: ReturnType<typeof makePrismaMock>;
  let service: AuthService;

  beforeEach(() => {
    prisma = makePrismaMock();
    service = new AuthService(
      prisma as never,
      makeJwtServiceMock() as never,
      makeConfigMock() as never,
    );
  });

  it('revokes the whole token family and throws 401 when a revoked token is reused', async () => {
    const familyId = 'family-1';
    prisma.refreshToken.findUnique.mockResolvedValue({
      id: 'row-1',
      familyId,
      userId: 'user-1',
      tokenHash: 'hash',
      revokedAt: new Date('2026-01-01T00:00:00.000Z'),
      expiresAt: new Date('2099-01-01T00:00:00.000Z'),
      createdAt: new Date(),
    });

    await expect(service.refresh('raw-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { familyId, revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
    // No new token should be issued for a detected-theft request.
    expect(prisma.refreshToken.create).not.toHaveBeenCalled();
  });

  it('rejects when the token is not found at all', async () => {
    prisma.refreshToken.findUnique.mockResolvedValue(null);

    await expect(service.refresh('unknown-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(prisma.refreshToken.updateMany).not.toHaveBeenCalled();
  });

  it('rotates the token on a valid, non-revoked refresh', async () => {
    const familyId = 'family-2';
    prisma.refreshToken.findUnique.mockResolvedValue({
      id: 'row-2',
      familyId,
      userId: 'user-2',
      tokenHash: 'hash',
      revokedAt: null,
      expiresAt: new Date('2099-01-01T00:00:00.000Z'),
      createdAt: new Date(),
    });

    const result = await service.refresh('raw-token');

    expect(prisma.refreshToken.update).toHaveBeenCalledWith({
      where: { id: 'row-2' },
      data: { revokedAt: expect.any(Date) },
    });
    expect(prisma.refreshToken.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: 'user-2', familyId }),
      }),
    );
    expect(result.accessToken).toBe('signed.access.token');
    expect(result.refreshToken).toEqual(expect.any(String));
  });
});
