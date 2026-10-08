import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { getEnglishGameModule, type EnglishGameQuestion, type EnglishModeId } from './english-game-modes';
import type { CefrLevel } from './english-learning-bank';
import { RedisService } from '../redis/redis.service';
import { PrismaService } from '../prisma/prisma.service';

type SessionKind = 'time-attack' | 'daily';
type ItemId = 'fifty-fifty' | 'extra-time' | 'hint';
type SessionStatus = 'playing' | 'finished';

interface EnglishSession {
  id: string;
  userId: number;
  kind: SessionKind;
  level: CefrLevel;
  seed: string;
  dailyDate?: string;
  questionIndex: number;
  score: number;
  streak: number;
  bestStreak: number;
  correctAnswers: number;
  answerCount: number;
  guesses: string[];
  tabSwitches: number;
  usedItems: ItemId[];
  hiddenOptions: number[];
  status: SessionStatus;
  startedAt: number;
  endsAt: number;
  question: EnglishGameQuestion;
  dailyStreak?: number;
}

const LEVELS: readonly CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const PLAYABLE_MODES: readonly EnglishModeId[] = ['meaning-choice', 'letter-order', 'fill-gap', 'listen-choice', 'wordle'];
const DAILY_MODES: readonly EnglishModeId[] = ['meaning-choice', 'letter-order', 'fill-gap', 'listen-choice', 'wordle'];
const TIME_ATTACK_MS = 60_000;
const DAILY_QUESTION_COUNT = 10;
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 2;

const utcDate = (time = Date.now()) => new Date(time).toISOString().slice(0, 10);

function weekStart(time = Date.now()) {
  const date = new Date(time);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  return date.toISOString().slice(0, 10);
}

function seededRandom(seed: string): () => number {
  let state = 2166136261;
  for (const char of seed) state = Math.imul(state ^ char.charCodeAt(0), 16777619);
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

@Injectable()
export class EnglishGameService {
  constructor(private readonly redis: RedisService, private readonly prisma: PrismaService) {}

  async start(userId: number, kind: SessionKind, level: CefrLevel) {
    if (!LEVELS.includes(level)) throw new Error('Cấp độ CEFR không hợp lệ.');
    const dailyDate = kind === 'daily' ? utcDate() : undefined;
    if (dailyDate) {
      const completedKey = this.dailyCompletedKey(userId, dailyDate);
      if (await this.redis.client.exists(completedKey)) throw new Error('Bạn đã hoàn thành Daily Challenge hôm nay.');
      const activeKey = this.dailyActiveKey(userId, dailyDate);
      const activeId = await this.redis.client.get(activeKey);
      if (activeId) {
        const activeSession = await this.readSession(activeId);
        if (activeSession?.status === 'playing') return this.publicState(activeSession);
      }
    }

    const now = Date.now();
    const id = randomUUID();
    const session: EnglishSession = {
      id,
      userId,
      kind,
      level,
      seed: kind === 'daily' ? `${dailyDate}:${userId}` : `${id}:${now}`,
      dailyDate,
      questionIndex: 0,
      score: 0,
      streak: 0,
      bestStreak: 0,
      correctAnswers: 0,
      answerCount: 0,
      guesses: [],
      tabSwitches: 0,
      usedItems: [],
      hiddenOptions: [],
      status: 'playing',
      startedAt: now,
      endsAt: now + (kind === 'daily' ? 15 * DAILY_QUESTION_COUNT * 1000 : TIME_ATTACK_MS),
      question: this.makeQuestion(kind, level, sessionSeed(kind, dailyDate, id, 0), 0),
    };
    await this.saveSession(session);
    if (dailyDate) await this.redis.client.set(this.dailyActiveKey(userId, dailyDate), id, 'EX', SESSION_TTL_SECONDS);
    return this.publicState(session);
  }

  async getState(userId: number, id: string) {
    const session = await this.requireSession(userId, id);
    if (session.status === 'playing' && Date.now() >= session.endsAt) await this.finish(session);
    return this.publicState(session);
  }

  async answer(userId: number, id: string, answer: string) {
    const session = await this.requireSession(userId, id);
    if (session.status !== 'playing') throw new Error('Lượt chơi này đã kết thúc.');
    if (Date.now() >= session.endsAt) {
      await this.finish(session);
      return this.publicState(session);
    }

    const gameModule = getEnglishGameModule(session.question.mode);
    const correct = gameModule.checkAnswer(session.question, answer);
    session.answerCount++;
    if (session.question.mode === 'wordle') {
      session.guesses.push(answer.trim().slice(0, 40));
      if (!correct && session.guesses.length < 6) {
        await this.saveSession(session);
        return { ...this.publicState(session), lastAnswerCorrect: false, questionComplete: false };
      }
    }

    if (correct) {
      session.correctAnswers++;
      session.streak++;
      session.bestStreak = Math.max(session.bestStreak, session.streak);
      session.score += 10 * (1 + Math.min(4, Math.floor((session.streak - 1) / 3)));
    } else {
      session.streak = 0;
    }

    const wordleFailed = session.question.mode === 'wordle' && !correct;
    const completed = session.kind === 'daily'
      ? session.questionIndex + 1 >= DAILY_QUESTION_COUNT
      : false;
    if (completed) {
      await this.finish(session);
    } else if (session.kind === 'time-attack' && Date.now() >= session.endsAt) {
      await this.finish(session);
    } else {
      session.questionIndex++;
      session.guesses = [];
      session.hiddenOptions = [];
      session.question = this.makeQuestion(session.kind, session.level, sessionSeed(session.kind, session.dailyDate, session.seed, session.questionIndex), session.questionIndex);
      await this.saveSession(session);
    }

    return { ...this.publicState(session), lastAnswerCorrect: correct, questionComplete: true, wordleFailed };
  }

  async useItem(userId: number, id: string, item: ItemId) {
    const session = await this.requireSession(userId, id);
    if (session.status !== 'playing' || Date.now() >= session.endsAt) throw new Error('Lượt chơi đã kết thúc.');
    if (!(['fifty-fifty', 'extra-time', 'hint'] as string[]).includes(item)) throw new Error('Vật phẩm không hợp lệ.');
    if (session.usedItems.includes(item)) throw new Error('Mỗi vật phẩm chỉ dùng được một lần trong lượt chơi.');

    let result: { hiddenOptions?: number[]; hint?: string; endsAt?: number } = {};
    if (item === 'fifty-fifty') {
      if (!session.question.options || session.question.options.length < 4) throw new Error('50/50 chỉ dùng được ở câu hỏi trắc nghiệm.');
      const correctIndex = session.question.options.indexOf(session.question.answer);
      const wrong = session.question.options.map((_, index) => index).filter((index) => index !== correctIndex);
      session.hiddenOptions = wrong.slice(0, 2);
      result.hiddenOptions = session.hiddenOptions;
    } else if (item === 'extra-time') {
      session.endsAt += 10_000;
      result.endsAt = session.endsAt;
    } else {
      result.hint = session.question.hint;
    }
    session.usedItems.push(item);
    await this.saveSession(session);
    return { ...this.publicState(session), ...result };
  }

  async recordTabHidden(userId: number, id: string) {
    const session = await this.requireSession(userId, id);
    if (session.status === 'playing') {
      session.tabSwitches++;
      await this.saveSession(session);
    }
    return { tabSwitches: session.tabSwitches };
  }

  async leaderboard(scope: 'today' | 'week' | 'all') {
    const now = Date.now();
    const suffix = scope === 'today' ? utcDate(now) : scope === 'week' ? weekStart(now) : 'all';
    const key = `english:leaderboard:${scope}:${suffix}`;
    const ids = await this.redis.client.zrevrange(key, 0, 9, 'WITHSCORES');
    const results: { userId: number; name: string; score: number }[] = [];
    for (let index = 0; index < ids.length; index += 2) {
      const userId = Number(ids[index]);
      const name = await this.redis.client.hget('english:players', ids[index]);
      results.push({ userId, name: name ?? `Người chơi ${userId}`, score: Number(ids[index + 1]) });
    }
    return results;
  }

  private makeQuestion(kind: SessionKind, level: CefrLevel, seed: string, questionIndex?: number): EnglishGameQuestion {
    const random = seededRandom(seed);
    const mode = kind === 'daily'
      ? DAILY_MODES[(questionIndex ?? 0) % DAILY_MODES.length]
      : PLAYABLE_MODES[Math.floor(random() * PLAYABLE_MODES.length)];
    return getEnglishGameModule(mode).generateQuestion(level, random);
  }

  private publicState(session: EnglishSession) {
    const { answer: _answer, hint: _hint, ...question } = session.question;
    return {
      id: session.id,
      kind: session.kind,
      level: session.level,
      status: session.status,
      score: session.score,
      streak: session.streak,
      bestStreak: session.bestStreak,
      correctAnswers: session.correctAnswers,
      answerCount: session.answerCount,
      questionIndex: session.questionIndex,
      questionTotal: session.kind === 'daily' ? DAILY_QUESTION_COUNT : null,
      endsAt: session.endsAt,
      serverNow: Date.now(),
      question,
      guesses: session.guesses,
      tabSwitches: session.tabSwitches,
      usedItems: session.usedItems,
      hiddenOptions: session.hiddenOptions,
      dailyStreak: session.dailyStreak,
    };
  }

  private async finish(session: EnglishSession) {
    if (session.status === 'finished') return;
    session.status = 'finished';
    const increment = session.score;
    if (increment > 0) await this.addLeaderboardScore(session.userId, increment, session.dailyDate ?? utcDate());
    if (session.kind === 'daily' && session.dailyDate) {
      await this.redis.client.set(this.dailyCompletedKey(session.userId, session.dailyDate), '1', 'EX', 60 * 60 * 24 * 400);
      const streakKey = `english:daily:streak:${session.userId}`;
      const previousDate = await this.redis.client.hget(streakKey, 'date');
      const previousStreak = Number(await this.redis.client.hget(streakKey, 'count')) || 0;
      const previousDay = new Date(`${session.dailyDate}T00:00:00.000Z`);
      previousDay.setUTCDate(previousDay.getUTCDate() - 1);
      session.dailyStreak = previousDate === previousDay.toISOString().slice(0, 10) ? previousStreak + 1 : 1;
      await this.redis.client.hset(streakKey, { date: session.dailyDate, count: session.dailyStreak });
    }
    await this.saveSession(session);
  }

  private async addLeaderboardScore(userId: number, score: number, dailyDate: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    if (user) await this.redis.client.hset('english:players', String(userId), user.name);
    const scopes = [
      { name: 'today', key: `english:leaderboard:today:${dailyDate}`, ttl: 60 * 60 * 24 * 10 },
      { name: 'week', key: `english:leaderboard:week:${weekStart(new Date(`${dailyDate}T00:00:00.000Z`).getTime())}`, ttl: 60 * 60 * 24 * 70 },
      { name: 'all', key: 'english:leaderboard:all:all' },
    ];
    const pipeline = this.redis.client.pipeline();
    for (const scope of scopes) {
      pipeline.zincrby(scope.key, score, String(userId));
      if (scope.ttl) pipeline.expire(scope.key, scope.ttl);
    }
    await pipeline.exec();
  }

  private async requireSession(userId: number, id: string) {
    const session = await this.readSession(id);
    if (!session || session.userId !== userId) throw new Error('Không tìm thấy lượt chơi.');
    return session;
  }

  private async readSession(id: string) {
    const json = await this.redis.client.get(`english:session:${id}`);
    return json ? JSON.parse(json) as EnglishSession : null;
  }

  private saveSession(session: EnglishSession) {
    return this.redis.client.set(`english:session:${session.id}`, JSON.stringify(session), 'EX', SESSION_TTL_SECONDS);
  }

  private dailyActiveKey(userId: number, date: string) {
    return `english:daily:active:${userId}:${date}`;
  }

  private dailyCompletedKey(userId: number, date: string) {
    return `english:daily:complete:${userId}:${date}`;
  }
}

function sessionSeed(kind: SessionKind, dailyDate: string | undefined, id: string, questionIndex: number) {
  return kind === 'daily' ? `${dailyDate}:challenge:${questionIndex}` : `${id}:question:${questionIndex}`;
}
