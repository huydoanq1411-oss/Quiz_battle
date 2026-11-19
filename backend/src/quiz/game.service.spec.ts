import { ConflictException } from '@nestjs/common';
import { GameService, type Room } from './game.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { QuestionService } from './question.service';
import type { RoomRepository } from './room.repository';

// Transactional store shared by two service lifetimes, without external IO.
class MemoryRooms {
  data = new Map<string, Room>();
  locks = new Set<string>();
  async create(room: Room) { this.data.set(room.code, structuredClone(room)); return true; }
  async codes() { return [...this.data.keys()]; }
  async update<T>(code: string, operation: (room: Room | null) => Promise<T>) {
    if (this.locks.has(code)) throw new ConflictException();
    this.locks.add(code);
    try {
      const room = this.data.get(code);
      const copy = room ? structuredClone(room) : null;
      const result = await operation(copy);
      if (copy) this.data.set(code, copy);
      return result;
    } finally { this.locks.delete(code); }
  }
}

describe('Persistent multiplayer', () => {
  const host = { id: 1, name: 'Host' };
  const other = { id: 2, name: 'Guest' };
  const questions = [{ text: 'Test?', options: ['Yes', 'No'], correctIndex: 0 }];
  let store: MemoryRooms;
  let service: GameService;
  let get: jest.Mock;
  let upsert: jest.Mock;
  let emit: jest.Mock;

  function makeService() {
    const result = new GameService(
      { match: { upsert } } as unknown as PrismaService,
      { get } as unknown as QuestionService,
      store as unknown as RoomRepository,
    );
    result.server = { to: () => ({ emit }) } as unknown as GameService['server'];
    return result;
  }

  async function playing() {
    const room = await service.create(host, 'host', 'EN', 3, 'VOCAB', 'A1');
    await service.join(room.code, other, 'guest');
    await service.start(room.code, 1);
    await jest.advanceTimersByTimeAsync(1500);
    return room.code;
  }

  beforeEach(() => {
    jest.useFakeTimers();
    store = new MemoryRooms();
    get = jest.fn().mockResolvedValue(questions);
    upsert = jest.fn().mockResolvedValue({ id: 1 });
    emit = jest.fn();
    service = makeService();
  });

  afterEach(() => { service.onModuleDestroy(); jest.useRealTimers(); });

  it('requires exactly two connected accounts for a fixed ten-question duel', async () => {
    get.mockResolvedValue(Array.from({ length: 10 }, () => questions[0]));
    const room = await service.create(host, 'host', 'EN', 3, 'VOCAB', 'A1', true);
    expect(room.total).toBe(10);
    expect(await service.start(room.code, host.id)).toHaveProperty('error');
    await service.join(room.code, other, 'guest');
    expect(await service.join(room.code, { id: 3, name: 'Third' }, 'third')).toHaveProperty('error');
    expect(await service.start(room.code, host.id)).toEqual({ ok: true });
    expect(get).toHaveBeenCalledWith('EN', 10, 'VOCAB', 'A1', undefined, [1, 2]);
    await jest.advanceTimersByTimeAsync(1500);
    await jest.advanceTimersByTimeAsync(1000);
    await service.answer(room.code, host.id, 'host', 0, 0);
    await service.answer(room.code, host.id, 'host', 0, 0);
    await jest.advanceTimersByTimeAsync(2000);
    await service.answer(room.code, other.id, 'guest', 0, 0);
    expect(store.data.get(room.code)!.players.get(1)).toMatchObject({ correct: 1, responseMs: 1000 });
    expect(store.data.get(room.code)!.players.get(2)).toMatchObject({ correct: 1, responseMs: 3000 });
    await service.join(room.code, host, 'reconnected');
    expect(store.data.get(room.code)!.players.get(1)?.responseMs).toBe(1000);
  });

  it('ranks duel accuracy before speed and charges unanswered questions fifteen seconds', async () => {
    const code = await playing();
    const room = store.data.get(code)!;
    room.duel = true; room.total = 10;
    room.players.get(1)!.correct = 7; room.players.get(1)!.responseMs = 1000;
    room.players.get(2)!.correct = 8; room.players.get(2)!.responseMs = 10000;
    await jest.advanceTimersByTimeAsync(15000);
    expect(store.data.get(code)!.players.get(1)?.responseMs).toBe(16000);
    const ended = store.data.get(code)!; ended.status = 'ended';
    const state = service.publicState(ended, 1);
    expect(state.ranking[0]).toMatchObject({ userId: 2, correct: 8, accuracy: 80 });
    ended.players.get(1)!.correct = 8;
    ended.players.get(1)!.responseMs = ended.players.get(2)!.responseMs;
    expect(service.publicState(ended, 1).ranking.map(player => player.rank)).toEqual([1, 1]);
  });

  it('rejects concurrent starts while questions load', async () => {
    let resolve!: (value: typeof questions) => void;
    get.mockImplementation(() => new Promise(done => { resolve = done; }));
    const room = await service.create(host, 'host', 'EN', 3, 'VOCAB', 'A1');
    const first = service.start(room.code, 1);
    await expect(service.start(room.code, 1)).rejects.toBeInstanceOf(ConflictException);
    resolve(questions);
    await first;
    expect(get).toHaveBeenCalledTimes(1);
  });

  it('restores answers, score and deadline after restart and reconnect', async () => {
    const code = await playing();
    await service.answer(code, 1, 'host', 0, 0);
    const before = structuredClone(store.data.get(code)!);
    service.onModuleDestroy();
    service = makeService();
    await service.onApplicationBootstrap();
    const joined = await service.join(code, host, 'new-host');
    expect(joined.room).toBeDefined();
    const state = service.publicState(joined.room!, 1);
    expect(state.myChoice).toBe(0);
    expect(state.players.find(player => player.userId === 1)?.score).toBe(150);
    expect(state.question?.endsAt).toBe(before.endsAt);
    expect(state.correctIndex).toBeNull();
    expect(JSON.stringify(state)).not.toContain('correctIndex":0');
    expect(await service.answer(code, 1, 'host', 0, 0)).toHaveProperty('error');
  });

  it('does not award points twice and rejects a stale question', async () => {
    const code = await playing();
    await service.answer(code, 1, 'host', 0, 0);
    await service.answer(code, 1, 'host', 0, 0);
    expect(store.data.get(code)!.players.get(1)!.score).toBe(150);
    expect(await service.answer(code, 2, 'guest', -1, 0)).toHaveProperty('error');
    expect(store.data.get(code)!.answers.has(2)).toBe(false);
  });

  it('allows participants to reconnect but not new users to enter a running match', async () => {
    const code = await playing();
    await service.disconnect('host');
    expect(store.data.has(code)).toBe(true);
    expect((await service.join(code, host, 'rejoined')).room?.players.get(1)?.connected).toBe(true);
    expect(await service.join(code, { id: 3, name: 'New' }, 'new')).toHaveProperty('error');
  });

  it('recovers an expired question into reveal without skipping the remaining game', async () => {
    const code = await playing();
    service.onModuleDestroy();
    jest.setSystemTime(Date.now() + 60000);
    service = makeService();
    await service.onApplicationBootstrap();
    await jest.advanceTimersByTimeAsync(1);
    expect(store.data.get(code)!.status).toBe('reveal');
    expect(store.data.get(code)!.index).toBe(0);
    await jest.advanceTimersByTimeAsync(3001);
    expect(store.data.get(code)!.status).toBe('ended');
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { roomId: store.data.get(code)!.id } }));
  });

  it('retries a committed match with the same unique room ID after a crash', async () => {
    const code = await playing();
    service.onModuleDestroy();
    const saved = store.data.get(code)!;
    saved.status = 'finishing';
    saved.endsAt = Date.now();
    // Simulate the DB having committed, but the Redis completion write lost.
    await upsert({ where: { roomId: saved.id } });
    service = makeService();
    await service.onApplicationBootstrap();
    await jest.advanceTimersByTimeAsync(1);
    expect(upsert.mock.calls.map(call => call[0].where.roomId)).toEqual([saved.id, saved.id]);
    expect(store.data.get(code)!.status).toBe('ended');
  });

  it('collects private mistakes and saves them with match results without leaking them during play', async () => {
    const code = await playing();
    await service.answer(code, 1, 'host', 0, 0);
    expect(service.publicState(store.data.get(code)!, 1).review).toBeUndefined();
    await service.answer(code, 2, 'guest', 0, 1);
    expect(service.publicState(store.data.get(code)!, 2).review).toBeUndefined();
    await jest.advanceTimersByTimeAsync(3001);
    const room = store.data.get(code)!;
    expect(room.status).toBe('ended');
    expect(service.publicState(room, 1).review).toEqual([]);
    expect(service.publicState(room, 2).review?.[0]).toMatchObject({ submittedAnswers: ['No'], correctAnswer: 'Yes', reason: 'wrong' });
    expect(upsert.mock.calls[0][0].create.players.create.find((player: { userId: number }) => player.userId === 2).review).toHaveLength(1);
  });

  it('records a multiplayer question left unanswered at the deadline', async () => {
    const code = await playing();
    await service.answer(code, 1, 'host', 0, 0);
    await jest.advanceTimersByTimeAsync(18001);
    const room = store.data.get(code)!;
    expect(room.status).toBe('ended');
    expect(service.publicState(room, 2).review?.[0]).toMatchObject({ reason: 'unanswered', submittedAnswers: [], number: 1 });
  });
});
