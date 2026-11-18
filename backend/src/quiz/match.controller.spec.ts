import { MatchController } from './match.controller';
import type { PrismaService } from '../prisma/prisma.service';

describe('Private match review', () => {
  it('selects only the requester\'s review and keeps other players\' choices out of the ranking query', async () => {
    const ownReview = [{ correctAnswer: 'walks' }];
    const findUnique = jest.fn().mockResolvedValue({ review: ownReview });
    const matchQuery = jest.fn().mockResolvedValue({ id: 3, players: [{ id: 1, score: 100 }] });
    const controller = new MatchController({ match: { findUnique: matchQuery }, matchPlayer: { findUnique } } as unknown as PrismaService);
    const result = await controller.detail({ user: { id: 7 } }, 3);
    expect(result.review).toEqual(ownReview);
    expect(findUnique).toHaveBeenCalledWith({ where: { matchId_userId: { matchId: 3, userId: 7 } }, select: { review: true } });
    expect(matchQuery.mock.calls[0][0].include.players.select).not.toHaveProperty('review');
  });

  it('does not return review data for a non-participant', async () => {
    const controller = new MatchController({
      match: { findUnique: jest.fn().mockResolvedValue({ id: 3, players: [] }) },
      matchPlayer: { findUnique: jest.fn().mockResolvedValue(null) },
    } as unknown as PrismaService);
    expect((await controller.detail({ user: { id: 9 } }, 3)).review).toBeNull();
  });
});
