import { ConflictException } from '@nestjs/common';
import { EnglishGameService } from './english-game.service';
import type { RedisService } from '../redis/redis.service';
import type { PrismaService } from '../prisma/prisma.service';

describe('Game concurrency regressions', () => {
  it('does not write a tab event when the session lock is busy', async () => {
    const client = { set: jest.fn().mockResolvedValue(null), get: jest.fn() };
    const service = new EnglishGameService({ client } as unknown as RedisService, {} as PrismaService);
    await expect(service.recordTabHidden(1, 'session')).rejects.toBeInstanceOf(ConflictException);
    expect(client.get).not.toHaveBeenCalled();
  });

  it('rejects a stale question without updating the session', async () => {
    const session = { userId: 1, status: 'playing', endsAt: Date.now() + 60000, question: { id: 'new' } };
    const client = {
      set: jest.fn().mockResolvedValue('OK'),
      get: jest.fn().mockResolvedValue(JSON.stringify(session)),
      eval: jest.fn().mockResolvedValue(1),
    };
    const service = new EnglishGameService({ client } as unknown as RedisService, {} as PrismaService);
    await expect(service.answer(1, 'session', 'old', 'answer')).rejects.toBeInstanceOf(ConflictException);
    expect(client.set).toHaveBeenCalledTimes(1);
    expect(client.eval).toHaveBeenCalledTimes(1);
  });
});
