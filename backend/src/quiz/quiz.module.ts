import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MatchController } from './match.controller';
import { QuestionService } from './question.service';
import { GameService } from './game.service';
import { QuizGateway } from './quiz.gateway';

@Module({
  imports: [AuthModule],
  controllers: [MatchController],
  providers: [QuestionService, GameService, QuizGateway],
})
export class QuizModule {}
