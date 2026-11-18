import { NotFoundException } from '@nestjs/common';
import { EnglishGameService } from './english-game.service';
import type { RedisService } from '../redis/redis.service';
import type { PrismaService } from '../prisma/prisma.service';

describe('Personal mistake review', () => {
  const question = {
    id: 'question-1', mode: 'fill-gap', skill: 'Grammar', prompt: 'She ____ every day.',
    options: ['walks', 'walk', 'walking', 'walked'], answer: 'walks', hint: 'W',
    explanation: 'Present simple: she + walks.',
  };
  let data: Map<string, string>;
  let service: EnglishGameService;

  function seed(overrides: Record<string, unknown> = {}) {
    data.set('english:session:session-1', JSON.stringify({
      id: 'session-1', userId: 1, kind: 'daily', level: 'B1', seed: 'seed', dailyDate: '2026-11-18',
      questionIndex: 9, score: 0, streak: 0, bestStreak: 0, correctAnswers: 0, answerCount: 0,
      guesses: [], guessFeedback: [], tabSwitches: 0, usedItems: [], hiddenOptions: [],
      status: 'playing', startedAt: Date.now(), endsAt: Date.now() + 60000,
      question, review: [], ...overrides,
    }));
  }

  beforeEach(() => {
    data = new Map();
    const client = {
      get: jest.fn(async (key: string) => data.get(key) ?? null),
      set: jest.fn(async (key: string, value: string) => { data.set(key, value); return 'OK'; }),
      // Model Redis IO here; tests exercise when the service may disclose the
      // review, not Redis' own Lua implementation or leaderboard arithmetic.
      eval: jest.fn(async (_script: string, keyCount: number, ...args: string[]) => {
        if (keyCount === 1) { data.delete(args[0]); return 1; }
        const session = JSON.parse(args[keyCount]);
        session.status = 'finished';
        const json = JSON.stringify(session);
        data.set(args[0], json);
        return json;
      }),
    };
    service = new EnglishGameService({ client } as unknown as RedisService,
      { user: { findUnique: jest.fn().mockResolvedValue({ name: 'Learner' }) } } as unknown as PrismaService);
    seed();
  });

  it('does not disclose answers, explanations or mistakes during a live session', async () => {
    seed({ review: [{ correctAnswer: 'private', explanation: 'private' }] });
    const state = await service.getState(1, 'session-1');
    expect(state.question).not.toHaveProperty('answer');
    expect(state.question).not.toHaveProperty('explanation');
    expect(state.review).toBeUndefined();
    expect(JSON.stringify(state)).not.toContain('private');
  });

  it('stores the wrong answer and reveals its explanation only after the final question', async () => {
    const state = await service.answer(1, 'session-1', question.id, 'walk');
    expect(state.status).toBe('finished');
    expect(state.review).toHaveLength(1);
    expect(state.review?.[0]).toMatchObject({ number: 10, correctAnswer: 'walks', submittedAnswers: ['walk'], explanation: question.explanation });
    expect((await service.getState(1, 'session-1')).review).toEqual(state.review);
  });

  it('does not include a correctly answered final question', async () => {
    const state = await service.answer(1, 'session-1', question.id, 'walks');
    expect(state.review).toEqual([]);
    expect(state.correctAnswers).toBe(1);
  });

  it('keeps a wrong earlier question private until expiry, then adds the unanswered question once', async () => {
    seed({ questionIndex: 0 });
    const state = await service.answer(1, 'session-1', question.id, 'walk');
    expect(state.status).toBe('playing');
    expect(state.review).toBeUndefined();
    const saved = JSON.parse(data.get('english:session:session-1')!);
    saved.endsAt = Date.now() - 1;
    data.set('english:session:session-1', JSON.stringify(saved));
    const finished = await service.getState(1, 'session-1');
    expect(finished.review).toHaveLength(2);
    expect(finished.review?.[1]).toMatchObject({ reason: 'unanswered', submittedAnswers: [] });
    expect((await service.getState(1, 'session-1')).review).toHaveLength(2);
  });

  it('records six failed Wordle guesses as a single mistake', async () => {
    seed({ question: { ...question, mode: 'wordle', answer: 'apple', answerLength: 5 } });
    for (let attempt = 0; attempt < 5; attempt++) {
      const state = await service.answer(1, 'session-1', question.id, 'wrong');
      expect(state.review).toBeUndefined();
    }
    const state = await service.answer(1, 'session-1', question.id, 'wrong');
    expect(state.review).toHaveLength(1);
    expect(state.review?.[0].submittedAnswers).toHaveLength(6);
  });

  it('does not classify a Wordle solved after a wrong guess as a failed question', async () => {
    seed({ question: { ...question, mode: 'wordle', answer: 'apple', answerLength: 5 } });
    await service.answer(1, 'session-1', question.id, 'wrong');
    const state = await service.answer(1, 'session-1', question.id, 'apple');
    expect(state.review).toEqual([]);
  });

  it('does not expose another account\'s review', async () => {
    await expect(service.getState(2, 'session-1')).rejects.toBeInstanceOf(NotFoundException);
  });
});
