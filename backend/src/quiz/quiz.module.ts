import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MatchController } from './match.controller';
import { QuestionService } from './question.service';
import { GameService } from './game.service';
import { QuizGateway } from './quiz.gateway';
import { EnglishGameController } from './english-game.controller';
import { EnglishGameService } from './english-game.service';

@Module({
  imports: [AuthModule],
  controllers: [MatchController, EnglishGameController],
  providers: [QuestionService, GameService, QuizGateway, EnglishGameService],
})
export class QuizModule {}
