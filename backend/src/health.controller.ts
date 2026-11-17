import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { RedisService } from './redis/redis.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService, private readonly redis: RedisService) {}

  @Get()
  async health() {
    try {
      await Promise.all([this.prisma.$queryRaw`SELECT 1`, this.redis.client.ping()]);
      return { ok: true, db: 'up', redis: 'up' };
    } catch {
      throw new ServiceUnavailableException('Dịch vụ đang khởi động. Vui lòng thử lại.');
    }
  }
}
