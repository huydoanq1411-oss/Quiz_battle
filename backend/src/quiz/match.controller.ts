import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
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
      include: { match: true },
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
  detail(@Param('id') id: string) {
    return this.prisma.match.findUnique({
      where: { id: +id },
      include: { players: { include: { user: { select: { name: true } } }, orderBy: { rank: 'asc' } } },
    });
  }
}
