import { BadRequestException } from '@nestjs/common';
import { QuestionService } from './question.service';
import { englishQuestionPool } from './question-pool';
import { QuestionHistory } from './question-history';
import type { PrismaService } from '../prisma/prisma.service';
import type { RedisService } from '../redis/redis.service';

// Models Redis' reservation contract. The Lua itself is additionally exercised
// in a local interpreter; no production Redis connection is used in Jest.
function memoryHistory() {
  const sets = new Map<string, Set<string>>();
  return { client: { eval: jest.fn(async (_script: string, count: number, ...args: string[]) => {
    const keys = args.slice(0, count);
    const wanted = Number(args[count]);
    const candidates = args.slice(count + 1);
    const available = candidates.map((hash, index) => ({ hash, index: index + 1 }))
      .filter(({ hash }) => keys.every(key => !sets.get(key)?.has(hash)));
    if (available.length < wanted) return [available.length];
    for (const key of keys) {
      const seen = sets.get(key) ?? new Set<string>();
      available.slice(0, wanted).forEach(item => seen.add(item.hash)); sets.set(key, seen);
    }
    return [available.length, ...available.slice(0, wanted).map(item => item.index)];
  }) } } as unknown as RedisService;
}

describe('Non-repeating question history', () => {
  it('gives rooms disjoint questions for every participant, including a returning guest', async () => {
    const service = new QuestionService({} as PrismaService, memoryHistory());
    const first = await service.get('EN', 10, 'VOCAB', 'A1', 'travel', [1, 2]);
    const second = await service.get('EN', 10, 'VOCAB', 'A1', 'travel', [2, 3]);
    expect(new Set(first.map(q => q.text)).size).toBe(10);
    expect(second.every(q => !first.some(old => old.contentKey === q.contentKey))).toBe(true);
    await expect(service.get('EN', 10, 'VOCAB', 'A1', 'travel', [2])).rejects.toBeInstanceOf(BadRequestException);
    expect(await service.get('EN', 10, 'VOCAB', 'A1', 'work', [2])).toHaveLength(10);
  });

  it('does not recycle grammar and does not consume remaining questions on a failed request', async () => {
    const service = new QuestionService({} as PrismaService, memoryHistory());
    const first = await service.get('EN', 15, 'IELTS', 'B2', undefined, [1]);
    await expect(service.get('EN', 10, 'IELTS', 'B2', undefined, [1])).rejects.toThrow('Chỉ còn 5');
    const remaining = await service.get('EN', 5, 'IELTS', 'B2', undefined, [1]);
    expect(remaining.every(q => !first.some(old => old.text === q.text))).toBe(true);
  });

  it('reserves disjoint decks for concurrent starts and ignores changed option/letter order', async () => {
    const history = new QuestionHistory(memoryHistory());
    const a = englishQuestionPool('C1', 'life', 'one');
    const b = englishQuestionPool('C1', 'life', 'two');
    expect(new Set(a.map(q => q.contentKey))).toEqual(new Set(b.map(q => q.contentKey)));
    const [first, second] = await Promise.all([history.take([1], 'scope', a, 10), history.take([1], 'scope', b, 10)]);
    expect(second.every(q => !first.some(old => old.contentKey === q.contentKey))).toBe(true);
  });

  it('enumerates every topic/level without duplicate identities, ambiguous choices or missing answers', () => {
    for (const topic of ['travel', 'work', 'life', undefined] as const) for (const level of ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const) {
      const pool = englishQuestionPool(level, topic, 'fixture');
      expect(pool.length).toBeGreaterThanOrEqual(80);
      expect(new Set(pool.map(q => q.contentKey)).size).toBe(pool.length);
      for (const question of pool) {
        expect(question.answer).toBeTruthy();
        if (question.options) { expect(question.options).toContain(question.answer); expect(new Set(question.options).size).toBe(4); }
      }
    }
  });
});
