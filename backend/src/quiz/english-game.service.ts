import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { getEnglishGameModule, type EnglishGameQuestion, type EnglishModeId } from './english-game-modes';
import type { CefrLevel } from './english-learning-bank';
import { RedisService } from '../redis/redis.service';
import { PrismaService } from '../prisma/prisma.service';
import { makeReviewItem, type ReviewItem } from './review';
import { TOPICS, type Topic } from './topics';
import { QuestionHistory } from './question-history';
import { englishQuestionPool } from './question-pool';

type SessionKind = 'time-attack' | 'daily' | 'lesson' | 'challenge';
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
  guessFeedback: ('correct' | 'present' | 'absent')[][];
  tabSwitches: number;
  usedItems: ItemId[];
  hiddenOptions: number[];
  status: SessionStatus;
  startedAt: number;
  endsAt: number;
  question: EnglishGameQuestion;
  dailyStreak?: number;
  review?: ReviewItem[];
  topic?: Topic;
  challengeId?: string;
  completedAt?: number;
  weeklyDays?: number;
  dailyGoalMet?: boolean;
  deck?: EnglishGameQuestion[];
  uniqueQuestions?: boolean;
  finishReason?: 'pool-exhausted';
}

interface Challenge { id: string; seed: string; level: CefrLevel; topic?: Topic; expiresAt: number; deck?: EnglishGameQuestion[]; creatorId?: number }

const LEVELS: readonly CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const PLAYABLE_MODES: readonly EnglishModeId[] = ['meaning-choice', 'letter-order', 'fill-gap', 'listen-choice', 'wordle', 'sentence-order', 'error-correction', 'word-match'];
const DAILY_MODES: readonly EnglishModeId[] = ['meaning-choice', 'letter-order', 'fill-gap', 'listen-choice', 'wordle'];
const TIME_ATTACK_MS = 60_000;
const DAILY_QUESTION_COUNT = 10;
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

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

  async start(userId: number, kind: SessionKind, level: CefrLevel, topic?: Topic, challenge?: Challenge) {
    if (!LEVELS.includes(level)) throw new BadRequestException('Cấp độ CEFR không hợp lệ.');
    if (topic !== undefined && !TOPICS.includes(topic)) throw new BadRequestException('Chủ đề không hợp lệ.');
    if (kind === 'challenge' && !challenge) throw new BadRequestException('Thiếu thách đấu.');
    if (kind === 'daily') topic = undefined;
    const dailyDate = kind === 'daily' ? utcDate() : undefined;
    const effectiveLevel: CefrLevel = kind === 'daily' ? 'B1' : level;
    if (dailyDate) {
      const completedKey = this.dailyCompletedKey(userId, dailyDate);
      if (await this.redis.client.exists(completedKey)) {
        const completedId = await this.redis.client.get(this.dailyActiveKey(userId, dailyDate));
        const completed = completedId ? await this.readSession(completedId) : null;
        if (completed?.userId === userId && completed.status === 'finished') return this.publicState(completed);
        throw new ConflictException('Bạn đã hoàn thành Daily Challenge hôm nay.');
      }
      const activeKey = this.dailyActiveKey(userId, dailyDate);
      const activeId = await this.redis.client.get(activeKey);
      if (activeId) {
        const activeSession = await this.readSession(activeId);
        if (activeSession?.status === 'playing') return this.publicState(activeSession);
      }
    }

    const now = Date.now();
    const id = randomUUID();
    const history = new QuestionHistory(this.redis);
    const deck = kind === 'daily' ? await this.dailyDeck(dailyDate!)
      : kind === 'lesson' ? await history.take([userId], `lesson:${effectiveLevel}:${topic ?? 'all'}`, englishQuestionPool(effectiveLevel, topic, id), 10)
        : challenge?.deck;
    const firstQuestion = deck?.[0] ?? (challenge
      ? this.makeQuestion(kind, effectiveLevel, sessionSeed(kind, dailyDate, challenge.seed, 0), 0, topic)
      : (await history.take([userId], `time-attack:${effectiveLevel}:${topic ?? 'all'}`, englishQuestionPool(effectiveLevel, topic, id), 1))[0]);
    const session: EnglishSession = {
      id,
      userId,
      kind,
      level: effectiveLevel,
      topic: kind === 'daily' ? undefined : topic,
      challengeId: challenge?.id,
      seed: challenge?.seed ?? id,
      deck,
      uniqueQuestions: true,
      dailyDate,
      questionIndex: 0,
      score: 0,
      streak: 0,
      bestStreak: 0,
      correctAnswers: 0,
      answerCount: 0,
      guesses: [],
      guessFeedback: [],
      tabSwitches: 0,
      usedItems: [],
      hiddenOptions: [],
      review: [],
      status: 'playing',
      startedAt: now,
      endsAt: Math.min(challenge?.expiresAt ?? Infinity, now + (kind === 'lesson' ? 600_000 : kind === 'time-attack' ? TIME_ATTACK_MS : 150_000)),
      question: firstQuestion,
    };
    if (dailyDate) {
      const reserved = await this.redis.client.set(this.dailyActiveKey(userId, dailyDate), id, 'EX', SESSION_TTL_SECONDS, 'NX');
      if (!reserved) {
        const activeId = await this.redis.client.get(this.dailyActiveKey(userId, dailyDate));
        const activeSession = activeId ? await this.readSession(activeId) : null;
        if (activeSession?.status === 'playing') return this.publicState(activeSession);
        throw new ConflictException('Daily Challenge đang được mở ở một cửa sổ khác.');
      }
    }
    await this.saveSession(session);
    return this.publicState(session);
  }

  async getState(userId: number, id: string) {
    return this.withSessionLock(id, async () => this.getStateLocked(userId, id));
  }

  private async getStateLocked(userId: number, id: string) {
    const session = await this.requireSession(userId, id);
    if (session.status === 'playing' && Date.now() >= session.endsAt) await this.finish(session);
    return this.publicState(session);
  }

  async answer(userId: number, id: string, questionId: string, answer: string) {
    return this.withSessionLock(id, async () => this.answerLocked(userId, id, questionId, answer));
  }

  private async answerLocked(userId: number, id: string, questionId: string, answer: string) {
    const session = await this.requireSession(userId, id);
    if (session.status !== 'playing') throw new ConflictException('Lượt chơi này đã kết thúc.');
    if (Date.now() >= session.endsAt) {
      await this.finish(session);
      return this.publicState(session);
    }

    if (session.question.id !== questionId) throw new ConflictException('Câu hỏi đã thay đổi. Vui lòng tải lại lượt chơi.');
    const gameModule = getEnglishGameModule(session.question.mode);
    const correct = gameModule.checkAnswer(session.question, answer);
    session.answerCount++;
    if (session.question.mode === 'wordle') {
      const guess = answer.trim().slice(0, 40).toLocaleLowerCase('en-US');
      session.guesses.push(guess);
      session.guessFeedback.push(this.wordleFeedback(session.question.answer, guess));
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
    if (!correct) {
      session.review ??= [];
      session.review.push(makeReviewItem(session.question, session.questionIndex,
        session.question.mode === 'wordle' ? [...session.guesses] : [answer.trim().slice(0, 200)], 'wrong'));
    }
    const completed = session.kind !== 'time-attack'
      ? session.questionIndex + 1 >= DAILY_QUESTION_COUNT
      : false;
    if (completed) {
      session.questionIndex++;
      await this.finish(session, false);
    } else if (session.kind === 'time-attack' && Date.now() >= session.endsAt) {
      await this.finish(session, false);
    } else {
      session.questionIndex++;
      session.guesses = [];
      session.guessFeedback = [];
      session.hiddenOptions = [];
      if (session.deck) {
        session.question = session.deck[session.questionIndex];
        await this.saveSession(session);
      } else if (session.kind === 'time-attack' && session.uniqueQuestions) {
        try {
          session.question = (await new QuestionHistory(this.redis).take([userId], `time-attack:${session.level}:${session.topic ?? 'all'}`, englishQuestionPool(session.level, session.topic, session.seed), 1))[0];
          await this.saveSession(session);
        } catch (error) {
          if (!(error instanceof BadRequestException)) throw error;
          session.finishReason = 'pool-exhausted';
          await this.finish(session, false);
        }
      } else {
        // Keep already-issued legacy sessions/challenge links compatible.
        session.question = this.makeQuestion(session.kind, session.level, sessionSeed(session.kind, session.dailyDate, session.seed, session.questionIndex), session.questionIndex, session.topic);
        await this.saveSession(session);
      }
    }

    return { ...this.publicState(session), lastAnswerCorrect: correct, questionComplete: true, wordleFailed };
  }

  async useItem(userId: number, id: string, item: ItemId) {
    return this.withSessionLock(id, async () => this.useItemLocked(userId, id, item));
  }

  private async useItemLocked(userId: number, id: string, item: ItemId) {
    const session = await this.requireSession(userId, id);
    if (session.kind !== 'time-attack') throw new BadRequestException('Vật phẩm chỉ dùng trong Time Attack.');
    if (session.status !== 'playing' || Date.now() >= session.endsAt) throw new ConflictException('Lượt chơi đã kết thúc.');
    if (!(['fifty-fifty', 'extra-time', 'hint'] as string[]).includes(item)) throw new BadRequestException('Vật phẩm không hợp lệ.');
    if (session.usedItems.includes(item)) throw new ConflictException('Mỗi vật phẩm chỉ dùng được một lần trong lượt chơi.');

    let result: { hiddenOptions?: number[]; hint?: string; endsAt?: number } = {};
    if (item === 'fifty-fifty') {
      if (!session.question.options || session.question.options.length < 4) throw new BadRequestException('50/50 chỉ dùng được ở câu hỏi trắc nghiệm.');
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
    return this.withSessionLock(id, () => this.recordTabHiddenLocked(userId, id));
  }

  private async recordTabHiddenLocked(userId: number, id: string) {
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

  private makeQuestion(kind: SessionKind, level: CefrLevel, seed: string, questionIndex?: number, topic?: Topic): EnglishGameQuestion {
    const random = seededRandom(seed);
    const pool: readonly EnglishModeId[] = topic ? ['meaning-choice', 'letter-order', 'listen-choice', 'word-match'] : PLAYABLE_MODES;
    const mode = kind === 'daily'
      ? DAILY_MODES[(questionIndex ?? 0) % DAILY_MODES.length]
      : pool[Math.floor(random() * pool.length)];
    return getEnglishGameModule(mode).generateQuestion(level, random, topic);
  }

  private publicState(session: EnglishSession) {
    const { answer: _answer, hint: _hint, explanation: _explanation, contentKey: _contentKey, ...question } = session.question;
    return {
      id: session.id,
      kind: session.kind,
      level: session.level,
      topic: session.topic,
      challengeId: session.challengeId,
      dailyDate: session.dailyDate,
      status: session.status,
      score: session.score,
      streak: session.streak,
      bestStreak: session.bestStreak,
      correctAnswers: session.correctAnswers,
      answerCount: session.answerCount,
      questionIndex: session.questionIndex,
      questionTotal: session.kind !== 'time-attack' ? DAILY_QUESTION_COUNT : null,
      endsAt: session.endsAt,
      serverNow: Date.now(),
      question,
      guesses: session.guesses,
      guessFeedback: session.guessFeedback,
      tabSwitches: session.tabSwitches,
      usedItems: session.usedItems,
      hiddenOptions: session.hiddenOptions,
      dailyStreak: session.dailyStreak,
      dailyGoalMet: session.dailyGoalMet,
      weeklyDays: session.weeklyDays,
      completedAt: session.completedAt,
      finishReason: session.finishReason,
      review: session.status === 'finished' ? session.review : undefined,
    };
  }

  private wordleFeedback(answer: string, guess: string): ('correct' | 'present' | 'absent')[] {
    const answerLetters = Array.from(answer.toLocaleLowerCase('en-US'));
    const guessLetters = Array.from(guess);
    const feedback: ('correct' | 'present' | 'absent')[] = Array.from({ length: guessLetters.length }, () => 'absent');
    const remaining = new Map<string, number>();
    for (let index = 0; index < answerLetters.length; index++) {
      if (guessLetters[index] === answerLetters[index]) feedback[index] = 'correct';
      else remaining.set(answerLetters[index], (remaining.get(answerLetters[index]) ?? 0) + 1);
    }
    for (let index = 0; index < guessLetters.length; index++) {
      if (feedback[index] === 'correct') continue;
      const count = remaining.get(guessLetters[index]) ?? 0;
      if (count > 0) {
        feedback[index] = 'present';
        remaining.set(guessLetters[index], count - 1);
      }
    }
    return feedback;
  }

  private async finish(session: EnglishSession, includeCurrent = true) {
    if (session.status === 'finished') return;
    session.review ??= [];
    if (includeCurrent && !session.review.some(item => item.number === session.questionIndex + 1)) {
      session.review.push(makeReviewItem(session.question, session.questionIndex, [...session.guesses], session.guesses.length ? 'wrong' : 'unanswered'));
    }
    const user = await this.prisma.user.findUnique({ where: { id: session.userId }, select: { name: true } });
    session.completedAt = Math.min(Date.now(), session.endsAt);
    session.dailyGoalMet = session.kind === 'daily' && session.questionIndex >= 10 && session.correctAnswers >= 8;
    const date = session.dailyDate ?? utcDate();
    const previousDay = new Date(date + 'T00:00:00.000Z');
    previousDay.setUTCDate(previousDay.getUTCDate() - 1);
    // All completion effects commit together; retries return the saved result.
    const result = await this.redis.client.eval(`
      local current = redis.call('get', KEYS[1])
      if not current then return redis.error_reply('Session expired') end
      if cjson.decode(current).status == 'finished' then return current end
      local session = cjson.decode(ARGV[1])
      session.status = 'finished'
      if session.kind == 'daily' then
        if session.dailyGoalMet then redis.call('sadd', KEYS[8], ARGV[3]) end
        redis.call('expire', KEYS[8], 34560000)
        session.weeklyDays = redis.call('scard', KEYS[8])
        local lastDate = redis.call('hget', KEYS[6], 'date')
        local count = tonumber(redis.call('hget', KEYS[6], 'count')) or 0
        if lastDate == ARGV[4] then count = count + 1
        elseif lastDate ~= ARGV[3] then count = 1 end
        session.dailyStreak = count
        redis.call('hset', KEYS[6], 'date', ARGV[3], 'count', count)
        redis.call('set', KEYS[5], '1', 'EX', 34560000)
      end
      if session.kind == 'challenge' then
        local elapsed = session.completedAt - session.startedAt
        redis.call('zadd', KEYS[9], session.correctAnswers * 1000000 + (150000 - elapsed), ARGV[2])
        redis.call('expire', KEYS[9], 604800)
      end
      if session.kind == 'lesson' and session.questionIndex >= 10 and session.correctAnswers >= 8 then
        redis.call('sadd', KEYS[10], session.level)
      end
      if session.score > 0 and (session.kind == 'daily' or session.kind == 'time-attack') then
        redis.call('hset', KEYS[7], ARGV[2], ARGV[5])
        for i = 2, 4 do redis.call('zincrby', KEYS[i], session.score, ARGV[2]) end
        redis.call('expire', KEYS[2], 864000)
        redis.call('expire', KEYS[3], 6048000)
      end
      local encoded = string.gsub(ARGV[1], '"status":"playing"', '"status":"finished"', 1)
      if session.kind == 'daily' then
        encoded = string.sub(encoded, 1, -2) .. ',"dailyStreak":' .. session.dailyStreak .. ',"weeklyDays":' .. session.weeklyDays .. '}'
      end
      redis.call('set', KEYS[1], encoded, 'EX', ARGV[6])
      return encoded
    `, 10,
      'english:session:' + session.id,
      'english:leaderboard:today:' + date,
      'english:leaderboard:week:' + weekStart(new Date(date + 'T00:00:00.000Z').getTime()),
      'english:leaderboard:all:all',
      this.dailyCompletedKey(session.userId, date),
      'english:daily:streak:' + session.userId,
      'english:players',
      `english:daily:week:${session.userId}:${weekStart(new Date(date + 'T00:00:00Z').getTime())}`,
      `english:challenge:ranking:${session.challengeId ?? 'none'}`,
      `english:learning:${session.userId}:${session.topic ?? 'all'}`,
      JSON.stringify(session), String(session.userId), date,
      previousDay.toISOString().slice(0, 10), user?.name ?? String(session.userId),
      String(SESSION_TTL_SECONDS),
    );
    Object.assign(session, JSON.parse(result as string) as EnglishSession);
  }

  async progress(userId: number) {
    const days = await this.redis.client.scard(`english:daily:week:${userId}:${weekStart()}`);
    const lessons = Object.fromEntries(await Promise.all(TOPICS.map(async topic =>
      [topic, await this.redis.client.smembers(`english:learning:${userId}:${topic}`)])));
    return { week: weekStart(), days, badge: days >= 7 ? 'Vàng' : days >= 5 ? 'Bạc' : days >= 3 ? 'Đồng' : null, lessons };
  }

  async createChallenge(userId: number, level: CefrLevel, topic?: Topic) {
    if (!LEVELS.includes(level) || (topic !== undefined && !TOPICS.includes(topic))) throw new BadRequestException('Cấp độ hoặc chủ đề không hợp lệ.');
    const challenge: Challenge = { id: randomUUID(), seed: randomUUID(), level, topic, expiresAt: Date.now() + SESSION_TTL_SECONDS * 1000 };
    challenge.creatorId = userId;
    challenge.deck = await new QuestionHistory(this.redis).take([userId], `challenge:${level}:${topic ?? 'all'}`, englishQuestionPool(level, topic, challenge.seed), 10);
    await this.redis.client.set(`english:challenge:${challenge.id}`, JSON.stringify(challenge), 'EX', SESSION_TTL_SECONDS);
    return this.joinChallenge(userId, challenge.id);
  }

  private async requireChallenge(id: string): Promise<Challenge> {
    const value = await this.redis.client.get(`english:challenge:${id}`);
    if (!value) throw new NotFoundException('Link thách đấu không tồn tại hoặc đã hết hạn 7 ngày.');
    const challenge = JSON.parse(value) as Challenge;
    if (Date.now() >= challenge.expiresAt) throw new NotFoundException('Link đã hết hạn.');
    return challenge;
  }

  async challengeInfo(userId: number, id: string) {
    const challenge = await this.requireChallenge(id);
    const scores = await this.redis.client.zrevrange(`english:challenge:ranking:${id}`, 0, 49, 'WITHSCORES');
    const ranking = await Promise.all(Array.from({ length: scores.length / 2 }, async (_, index) => {
      const participantId = scores[index * 2];
      const score = Number(scores[index * 2 + 1]);
      const correct = Math.floor(score / 1000000);
      const user = await this.prisma.user.findUnique({ where: { id: Number(participantId) }, select: { name: true } });
      return { userId: Number(participantId), name: user?.name ?? 'Người chơi', correct, elapsedMs: 150000 - (score - correct * 1000000) };
    }));
    return { id, level: challenge.level, topic: challenge.topic, expiresAt: challenge.expiresAt, ranking,
      sessionId: await this.redis.client.get(`english:challenge:attempt:${id}:${userId}`) };
  }

  async joinChallenge(userId: number, id: string) {
    return this.withSessionLock(`challenge:${id}:${userId}`, async () => {
      const challenge = await this.requireChallenge(id);
      const key = `english:challenge:attempt:${id}:${userId}`;
      const existing = await this.redis.client.get(key);
      if (existing) return this.getState(userId, existing);
      if (challenge.deck && challenge.creatorId !== userId) {
        await new QuestionHistory(this.redis).take([userId], `challenge:${challenge.level}:${challenge.topic ?? 'all'}`, challenge.deck, 10);
      }
      const state = await this.start(userId, 'challenge', challenge.level, challenge.topic, challenge);
      await this.redis.client.set(key, state.id, 'PX', Math.max(1, challenge.expiresAt - Date.now()));
      return state;
    });
  }

  private async requireSession(userId: number, id: string) {
    const session = await this.readSession(id);
    if (!session || session.userId !== userId) throw new NotFoundException('Không tìm thấy lượt chơi.');
    return session;
  }

  private async dailyDeck(date: string): Promise<EnglishGameQuestion[]> {
    return this.withSessionLock(`daily-deck:${date}`, async () => {
      const key = `english:daily:deck:v1:${date}`;
      const existing = await this.redis.client.get(key);
      if (existing) return JSON.parse(existing) as EnglishGameQuestion[];
      const deck = await new QuestionHistory(this.redis).take(['shared'], 'daily:B1:all', englishQuestionPool('B1', undefined, date, true), 10);
      await this.redis.client.set(key, JSON.stringify(deck), 'EX', SESSION_TTL_SECONDS);
      return deck;
    });
  }

  private async withSessionLock<T>(id: string, operation: () => Promise<T>): Promise<T> {
    const key = `english:session-lock:${id}`;
    const token = randomUUID();
    const acquired = await this.redis.client.set(key, token, 'PX', 15_000, 'NX');
    if (!acquired) throw new ConflictException('Lượt chơi đang được cập nhật. Thử lại ngay.');
    try {
      return await operation();
    } finally {
      await this.redis.client.eval(
        "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
        1,
        key,
        token,
      );
    }
  }

  private async readSession(id: string) {
    const json = await this.redis.client.get(`english:session:${id}`);
    if (!json) return null;
    const session = JSON.parse(json) as EnglishSession;
    session.guessFeedback ??= [];
    return session;
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
