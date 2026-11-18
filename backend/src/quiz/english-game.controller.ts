import { Body, Controller, Get, Param, Post, Query, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EnglishGameService } from './english-game.service';
import type { CefrLevel } from './english-learning-bank';
import type { Topic } from './topics';

@UseGuards(AuthGuard('jwt'))
@Controller('english-games')
export class EnglishGameController {
  constructor(private readonly games: EnglishGameService) {}

  @Post('start')
  start(@Req() request: any, @Body() body: { kind?: string; level?: string; topic?: Topic }) {
    if (body.kind !== 'daily' && body.kind !== 'time-attack' && body.kind !== 'lesson') throw new BadRequestException('Dạng chơi không hợp lệ.');
    return this.games.start(request.user.id, body.kind, (body.level ?? 'A1') as CefrLevel, body.kind === 'daily' ? undefined : body.topic);
  }

  @Get('progress')
  progress(@Req() request: any) { return this.games.progress(request.user.id); }

  @Post('challenges')
  createChallenge(@Req() request: any, @Body() body: { level?: CefrLevel; topic?: Topic }) {
    return this.games.createChallenge(request.user.id, body.level ?? 'A1', body.topic);
  }

  @Get('challenges/:id')
  challengeInfo(@Req() request: any, @Param('id') id: string) { return this.games.challengeInfo(request.user.id, id); }

  @Post('challenges/:id/join')
  joinChallenge(@Req() request: any, @Param('id') id: string) { return this.games.joinChallenge(request.user.id, id); }

  @Get('leaderboard')
  leaderboard(@Query('scope') scope: string) {
    if (scope !== 'today' && scope !== 'week' && scope !== 'all') throw new BadRequestException('Khoảng thời gian không hợp lệ.');
    return this.games.leaderboard(scope);
  }

  @Get(':id')
  state(@Req() request: any, @Param('id') id: string) {
    return this.games.getState(request.user.id, id);
  }

  @Post(':id/answer')
  answer(@Req() request: any, @Param('id') id: string, @Body() body: { questionId?: string; answer?: string }) {
    if (typeof body.answer !== 'string') throw new BadRequestException('Câu trả lời phải là chuỗi.');
    if (typeof body.questionId !== 'string' || !body.questionId) throw new BadRequestException('Thiếu mã câu hỏi.');
    return this.games.answer(request.user.id, id, body.questionId, body.answer);
  }

  @Post(':id/items')
  item(@Req() request: any, @Param('id') id: string, @Body() body: { item?: string }) {
    if (typeof body.item !== 'string') throw new BadRequestException('Vật phẩm không hợp lệ.');
    return this.games.useItem(request.user.id, id, body.item as 'fifty-fifty' | 'extra-time' | 'hint');
  }

  @Post(':id/tab-hidden')
  tabHidden(@Req() request: any, @Param('id') id: string) {
    return this.games.recordTabHidden(request.user.id, id);
  }
}
