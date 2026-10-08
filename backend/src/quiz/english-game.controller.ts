import { Body, Controller, Get, Param, Post, Query, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EnglishGameService } from './english-game.service';
import type { CefrLevel } from './english-learning-bank';

@UseGuards(AuthGuard('jwt'))
@Controller('english-games')
export class EnglishGameController {
  constructor(private readonly games: EnglishGameService) {}

  @Post('start')
  start(@Req() request: any, @Body() body: { kind?: string; level?: string }) {
    if (body.kind !== 'daily' && body.kind !== 'time-attack') throw new BadRequestException('Dạng chơi không hợp lệ.');
    return this.games.start(request.user.id, body.kind, (body.level ?? 'A1') as CefrLevel);
  }

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
  answer(@Req() request: any, @Param('id') id: string, @Body() body: { answer?: string }) {
    if (typeof body.answer !== 'string') throw new BadRequestException('Câu trả lời phải là chuỗi.');
    return this.games.answer(request.user.id, id, body.answer);
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
