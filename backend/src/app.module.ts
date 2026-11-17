import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { QuizModule } from './quiz/quiz.module';
import { RedisModule } from './redis/redis.module';
import { HealthController } from './health.controller';

@Module({
  imports: [PrismaModule, RedisModule, AuthModule, QuizModule],
  controllers: [HealthController],
})
export class AppModule {}
