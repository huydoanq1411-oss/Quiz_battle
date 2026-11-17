import { ServiceUnavailableException } from '@nestjs/common';
import { HealthController } from './health.controller';
import type { PrismaService } from './prisma/prisma.service';
import type { RedisService } from './redis/redis.service';

describe('Cloud readiness', () => {
  it('checks both PostgreSQL and Redis', async () => {
    const query = jest.fn().mockResolvedValue([{ '?column?': 1 }]);
    const ping = jest.fn().mockResolvedValue('PONG');
    const health = new HealthController({ $queryRaw: query } as unknown as PrismaService, { client: { ping } } as unknown as RedisService);
    await expect(health.health()).resolves.toEqual({ ok: true, db: 'up', redis: 'up' });
    expect(query).toHaveBeenCalledTimes(1);
    expect(ping).toHaveBeenCalledTimes(1);
  });

  it('returns an unavailable response without exposing connection errors', async () => {
    const health = new HealthController(
      { $queryRaw: jest.fn().mockRejectedValue(new Error('private connection details')) } as unknown as PrismaService,
      { client: { ping: jest.fn().mockResolvedValue('PONG') } } as unknown as RedisService,
    );
    await expect(health.health()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
