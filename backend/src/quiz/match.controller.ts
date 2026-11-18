import { Controller, Get, Param, Query, Req, UseGuards, ParseIntPipe, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../prisma/prisma.service';

@UseGuards(AuthGuard('jwt'))
@Controller('matches')
export class MatchController {
  constructor(private prisma: PrismaService) {}

  @Get('mine')
  mine(@Req() req: any) {
    return this.prisma.matchPlayer.findMany({
      where: { userId: req.user.id },
      select: { id: true, score: true, rank: true, matchId: true, userId: true, match: true },
      orderBy: { id: 'desc' },
      take: 20,
    });
  }

  @Get('leaderboard')
  async leaderboard(@Query('lang') lang: string) {
    const rows = await this.prisma.matchPlayer.groupBy({
      by: ['userId'],
      where: { match: { language: lang === 'JA' ? 'JA' : 'EN' } },
      _sum: { score: true },
      _count: { _all: true },
      orderBy: { _sum: { score: 'desc' } },
      take: 10,
    });
    const users = await this.prisma.user.findMany({
      where: { id: { in: rows.map(r => r.userId) } },
      select: { id: true, name: true },
    });
    return rows.map(r => ({
      name: users.find(u => u.id === r.userId)?.name,
      total: r._sum.score,
      games: r._count._all,
    }));
  }

  @Get(':id')
  async detail(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const [match, ownResult] = await Promise.all([
      this.prisma.match.findUnique({
        where: { id },
        include: { players: { select: { id: true, userId: true, score: true, rank: true, correct: true, responseMs: true, user: { select: { name: true } } }, orderBy: { rank: 'asc' } } },
      }),
      this.prisma.matchPlayer.findUnique({ where: { matchId_userId: { matchId: id, userId: req.user.id } }, select: { review: true } }),
    ]);
    if (!match) throw new NotFoundException('Không tìm thấy trận đấu.');
    return { ...match, review: ownResult?.review ?? null };
  }
}
