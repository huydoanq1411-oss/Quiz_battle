import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EnglishGameService } from './english-game.service';
import { getEnglishGameModule } from './english-game-modes';
import { TOPICS, topicVocabulary } from './topics';
import type { PrismaService } from '../prisma/prisma.service';
import type { RedisService } from '../redis/redis.service';

describe('Learning paths and shared challenges', () => {
  let data: Map<string, string>;
  let service: EnglishGameService;
  let evaluate: jest.Mock;
  beforeEach(() => {
    data = new Map();
    const seen = new Map<string, Set<string>>();
    evaluate = jest.fn(async (_script: string, keys: number, ...args: string[]) => {
      if (_script.includes('local wanted =')) {
        const ids = args.slice(keys + 1);
        const stores = args.slice(0, keys).map(key => { if (!seen.has(key)) seen.set(key, new Set()); return seen.get(key)!; });
        const available = ids.map((hash, i) => ({ hash, index: i + 1 })).filter(item => stores.every(store => !store.has(item.hash)));
        const count = Number(args[keys]);
        if (available.length < count) return [available.length];
        const chosen = available.slice(0, count);
        for (const item of chosen) for (const store of stores) store.add(item.hash);
        return [available.length, ...chosen.map(item => item.index)];
      }
      if (keys === 1) { data.delete(args[0]); return 1; }
      const session = JSON.parse(args[keys]);
      session.status = 'finished';
      const value = JSON.stringify(session);
      data.set(args[0], value);
      return value;
    });
    const client = {
      get: jest.fn(async (key: string) => data.get(key) ?? null),
      exists: jest.fn(async (key: string) => Number(data.has(key))),
      set: jest.fn(async (key: string, value: string, ...options: unknown[]) => {
        if (options.includes('NX') && data.has(key)) return null;
        data.set(key, value); return 'OK';
      }),
      zrevrange: jest.fn(async () => []),
      scard: jest.fn(async () => 5), smembers: jest.fn(async () => ['A1']),
      eval: evaluate,
    };
    service = new EnglishGameService({ client } as unknown as RedisService,
      { user: { findUnique: jest.fn(async () => ({ name: 'Learner' })) } } as unknown as PrismaService);
  });

  const saved = (id: string) => JSON.parse(data.get(`english:session:${id}`)!);
  async function complete(id: string, userId: number, correctCount = 10) {
    let state = await service.getState(userId, id);
    for (let index = 0; index < 10; index++) {
      let next = saved(id);
      const answer = index < correctCount ? next.question.answer : 'incorrect';
      state = await service.answer(userId, id, next.question.id, answer);
      while (state.questionComplete === false) {
        next = saved(id);
        state = await service.answer(userId, id, next.question.id, answer);
      }
    }
    return state;
  }

  it('covers three topics at every CEFR level with valid choices and match mappings', () => {
    for (const topic of TOPICS) for (const level of ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const) {
      expect(topicVocabulary(topic, level)).toHaveLength(20);
      const meanings = topicVocabulary(topic, level).map(item => item.meaning);
      const question = getEnglishGameModule('meaning-choice').generateQuestion(level, () => 0.42, topic);
      expect(new Set(question.options).size).toBe(4);
      expect(question.options?.every(option => meanings.includes(option))).toBe(true);
      const match = getEnglishGameModule('word-match').generateQuestion(level, () => 0.42, topic);
      expect(match.answer.split('-').sort()).toEqual(['1', '2', '3']);
      expect(getEnglishGameModule('word-match').checkAnswer(match, match.answer)).toBe(true);
    }
  });

  it('finishes a topic lesson at ten questions, keeps answers private and excludes items', async () => {
    const start = await service.start(1, 'lesson', 'C2', 'travel');
    expect(start.questionTotal).toBe(10);
    expect(start.question).not.toHaveProperty('answer');
    await expect(service.useItem(1, start.id, 'extra-time')).rejects.toBeInstanceOf(BadRequestException);
    const finished = await complete(start.id, 1);
    expect(finished).toMatchObject({ status: 'finished', correctAnswers: 10, topic: 'travel', questionIndex: 10 });
    expect(finished.review).toEqual([]);
    expect(finished.question).not.toHaveProperty('contentKey');
    expect(finished).not.toHaveProperty('deck');
    expect(evaluate.mock.calls.some(call => call[1] === 10 && call.includes('english:learning:1:travel'))).toBe(true);
  });

  it('gives friends the same ten questions, resumes one attempt and hides seeds/answers', async () => {
    const creator = await service.createChallenge(1, 'B1');
    const friend = await service.joinChallenge(2, creator.challengeId!);
    expect(creator.question).toEqual(friend.question);
    expect(creator.endsAt - creator.serverNow).toBeLessThanOrEqual(150000);
    expect((await service.joinChallenge(2, creator.challengeId!)).id).toBe(friend.id);
    for (let index = 0; index < 10; index++) {
      const first = saved(creator.id), second = saved(friend.id);
      expect(first.question).toEqual(second.question);
      // Submit a correct answer to finish Wordle in one guess as well.
      const a = await service.answer(1, creator.id, first.question.id, first.question.answer);
      const b = await service.answer(2, friend.id, second.question.id, second.question.answer);
      expect(a.question).toEqual(b.question);
      if (index < 9) { expect(a.review).toBeUndefined(); expect(a.question).not.toHaveProperty('explanation'); }
    }
    expect((await service.joinChallenge(1, creator.challengeId!)).status).toBe('finished');
    const info = await service.challengeInfo(2, creator.challengeId!);
    expect(info).not.toHaveProperty('seed');
    expect(info.sessionId).toBe(friend.id);
    await expect(service.getState(3, friend.id)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects expired links and invalid topic/level values', async () => {
    await expect(service.joinChallenge(1, 'missing')).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.start(1, 'lesson', 'Z9' as 'A1', 'travel')).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.start(1, 'lesson', 'A1', 'unknown' as 'travel')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('issues two disjoint lesson decks and preserves the current deck on reload', async () => {
    const first = await service.start(1, 'lesson', 'A1', 'travel');
    const second = await service.start(1, 'lesson', 'A1', 'travel');
    const deckA = saved(first.id).deck.map((question: { contentKey: string }) => question.contentKey);
    const deckB = saved(second.id).deck.map((question: { contentKey: string }) => question.contentKey);
    expect(new Set(deckA).size).toBe(10);
    expect(deckB.every((key: string) => !deckA.includes(key))).toBe(true);
    expect((await service.getState(1, first.id)).question).toEqual(first.question);
  });

  it('shares a Daily deck across accounts but not across different dates', async () => {
    const a = await service.start(1, 'daily', 'A1');
    const b = await service.start(2, 'daily', 'C2');
    expect(saved(a.id).deck).toEqual(saved(b.id).deck);
    const firstKeys = saved(a.id).deck.map((question: { contentKey: string }) => question.contentKey);
    const now = Date.now();
    const clock = jest.spyOn(Date, 'now').mockReturnValue(now + 86400000);
    try {
      const tomorrow = await service.start(1, 'daily', 'B1');
      expect(saved(tomorrow.id).deck.every((question: { contentKey: string }) => !firstKeys.includes(question.contentKey))).toBe(true);
    } finally { clock.mockRestore(); }
  });

  it('sets the Daily goal only for ten completed questions and at least eight correct', async () => {
    const win = await service.start(1, 'daily', 'A1');
    expect((await complete(win.id, 1, 8)).dailyGoalMet).toBe(true);
    const miss = await service.start(2, 'daily', 'B1');
    expect((await complete(miss.id, 2, 7)).dailyGoalMet).toBe(false);
    const timeout = await service.start(3, 'daily', 'B1');
    const session = saved(timeout.id);
    session.correctAnswers = 8; session.questionIndex = 8; session.endsAt = Date.now() - 1;
    data.set(`english:session:${timeout.id}`, JSON.stringify(session));
    expect((await service.getState(3, timeout.id)).dailyGoalMet).toBe(false);
    expect(await service.progress(1)).toMatchObject({ days: 5, badge: 'Bạc', lessons: { travel: ['A1'] } });
  });
});
