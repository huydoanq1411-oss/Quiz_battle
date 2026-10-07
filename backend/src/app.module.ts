import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { QuizModule } from './quiz/quiz.module';

@Module({
  imports: [PrismaModule, AuthModule, QuizModule],
})
export class AppModule {}
