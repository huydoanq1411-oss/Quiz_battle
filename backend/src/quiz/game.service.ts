import { Injectable, Logger, type OnApplicationBootstrap, type OnModuleDestroy } from '@nestjs/common';
import { randomInt, randomUUID } from 'node:crypto';
import { Server } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import { QuestionService, type Question, type Lang, type QuizLevel, type QuizMode } from './question.service';
import { RoomRepository } from './room.repository';
import type { ReviewItem } from './review';
import type { Topic } from './topics';

export interface Player { userId: number; name: string; socketId: string; score: number; connected: boolean; correct?: number; responseMs?: number }
export interface Room {
  id: string;
  code: string; hostId: number; lang: Lang; mode: QuizMode; level: QuizLevel; total: number;
  status: 'lobby' | 'starting' | 'playing' | 'reveal' | 'finishing' | 'ended';
  players: Map<number, Player>;
  questions: Question[]; index: number;
  answers: Map<number, number>;
  endsAt: number;
  revision: number;
  reviewByUser?: Record<string, ReviewItem[]>;
  duel?: boolean;
  topic?: Topic;
  responseByUser?: Record<string, number>;
}

const QUESTION_MS = 15000;
const REVEAL_MS = 3000;
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

@Injectable()
export class GameService implements OnApplicationBootstrap, OnModuleDestroy {
  server: Server;
  private readonly logger = new Logger(GameService.name);
  private readonly timers = new Map<string, NodeJS.Timeout>();
  private readonly revisions = new Map<string, number>();
  private readonly memberships = new Map<string, Set<string>>();
  private stopped = false;

  constructor(private prisma: PrismaService, private questions: QuestionService, private rooms: RoomRepository) {}

  async onApplicationBootstrap() {
    // One Render instance owns timers and Socket.IO connections. Redis is the
    // durable source of truth; horizontal scaling needs a Socket.IO adapter.
    for (const code of await this.rooms.codes()) {
      const room = await this.rooms.update(code, async room => {
        if (room) {
          for (const player of room.players.values()) player.connected = false;
          room.revision++;
        }
        return room;
      });
      if (room) this.schedule(room);
    }
  }

  onModuleDestroy() {
    this.stopped = true;
    for (const timer of this.timers.values()) clearTimeout(timer);
    this.timers.clear();
  }

  private remember(code: string, socketId: string) {
    const codes = this.memberships.get(socketId) ?? new Set<string>();
    codes.add(code);
    this.memberships.set(socketId, codes);
  }

  players(room: Room) {
    return [...room.players.values()].map(player => ({
      userId: player.userId, name: player.name, score: player.score,
      isHost: player.userId === room.hostId, connected: player.connected,
    }));
  }

  private ranking(room: Room) {
    const compare = (a: Player, b: Player) => (room.duel
      ? (b.correct ?? 0) - (a.correct ?? 0) || (a.responseMs ?? 0) - (b.responseMs ?? 0)
      : b.score - a.score);
    const players = [...room.players.values()].sort((a, b) => compare(a, b) || a.userId - b.userId);
    return players.map((player, index) => ({ rank: room.duel ? players.findIndex(candidate => compare(candidate, player) === 0) + 1 : index + 1, userId: player.userId, name: player.name, score: player.score,
        correct: player.correct ?? 0, accuracy: Math.round((player.correct ?? 0) / room.total * 100), responseMs: player.responseMs ?? 0 }));
  }

  publicState(room: Room, userId: number) {
    const question = room.questions[room.index];
    const reveal = room.status === 'reveal';
    return {
      id: room.id, revision: room.revision, code: room.code,
      phase: room.status === 'finishing' ? 'reveal' : room.status === 'starting' ? 'lobby' : room.status,
      lang: room.lang, mode: room.mode, level: room.level,
      duel: Boolean(room.duel),
      topic: room.topic,
      players: this.players(room),
      question: question ? {
        index: room.index, total: room.questions.length, text: question.text,
        options: question.options, durationMs: QUESTION_MS,
        endsAt: room.endsAt, serverNow: Date.now(),
      } : null,
      myChoice: room.answers.get(userId) ?? null,
      answered: [...room.answers.keys()],
      correctIndex: question && (reveal || room.status === 'finishing') ? question.correctIndex : null,
      ranking: room.status === 'ended' ? this.ranking(room) : [],
      review: room.status === 'ended' && room.reviewByUser ? room.reviewByUser[userId] ?? [] : undefined,
    };
  }

  broadcastPlayers(room: Room) {
    for (const player of room.players.values()) {
      if (player.connected) this.server.to(player.socketId).emit('room:state', this.publicState(room, player.userId));
    }
  }

  async create(user: { id: number; name: string }, socketId: string, lang: Lang, total: number, mode: QuizMode, level: QuizLevel, duel = false, topic?: Topic) {
    for (let attempt = 0; attempt < 10; attempt++) {
      const room: Room = {
        id: randomUUID(), code: Array.from({ length: 5 }, () => ALPHABET[randomInt(ALPHABET.length)]).join(''),
        hostId: user.id, lang, mode, level, duel, topic, total: duel ? 10 : Math.min(Math.max(Math.trunc(total), 3), 20),
        status: 'lobby', players: new Map(), questions: [], index: -1,
        answers: new Map(), endsAt: 0, revision: 1,
      };
      room.players.set(user.id, { userId: user.id, name: user.name, socketId, score: 0, connected: true });
      if (await this.rooms.create(room)) {
        this.remember(room.code, socketId);
        return room;
      }
    }
    throw new Error('Could not allocate room code');
  }

  async join(code: string, user: { id: number; name: string }, socketId: string) {
    const result = await this.rooms.update(code, async room => {
      if (!room) return { error: 'Không tìm thấy phòng hoặc phòng đã hết hạn.' };
      if (room.status !== 'lobby' && !room.players.has(user.id)) return { error: 'Phòng đã bắt đầu' };
      const old = room.players.get(user.id);
      if (room.duel && !old && room.players.size >= 2) return { error: 'Phòng 1v1 đã đủ hai người.' };
      room.players.set(user.id, { ...old, userId: user.id, name: user.name, socketId, score: old?.score ?? 0, connected: true });
      if (room.status === 'lobby' && !room.players.get(room.hostId)?.connected) room.hostId = user.id;
      room.revision++;
      return { room };
    });
    if (result.room) {
      this.remember(code, socketId);
      this.schedule(result.room);
    }
    return result;
  }

  async disconnect(socketId: string) {
    const codes = this.memberships.get(socketId);
    this.memberships.delete(socketId);
    for (const code of codes ?? []) {
      const room = await this.rooms.update(code, async room => {
        if (!room) return null;
        const player = [...room.players.values()].find(player => player.socketId === socketId);
        if (player) {
          player.connected = false;
          if (room.status === 'lobby' && room.hostId === player.userId) {
            room.hostId = [...room.players.values()].find(candidate => candidate.connected)?.userId ?? room.hostId;
          }
          room.revision++;
        }
        return room;
      });
      if (room) this.broadcastPlayers(room);
    }
  }

  async start(code: string, userId: number) {
    const result = await this.rooms.update(code, async room => {
      if (!room || room.hostId !== userId || room.status !== 'lobby') return { error: 'Không thể bắt đầu' };
      if (room.duel && [...room.players.values()].filter(player => player.connected).length !== 2) return { error: 'Cần hai người đang kết nối để bắt đầu 1v1.' };
      room.questions = await this.questions.get(room.lang, room.total, room.mode, room.level, room.topic, [...room.players.keys()]);
      if (!room.questions.length) return { error: 'Chưa có câu hỏi cho cấp độ này.' };
      room.status = 'starting';
      room.index = -1;
      room.endsAt = Date.now() + 1500;
      room.revision++;
      return { room };
    });
    if (!result.room) return result;
    this.broadcastPlayers(result.room);
    this.schedule(result.room);
    return { ok: true };
  }

  async answer(code: string, userId: number, socketId: string, index: number, choice: number) {
    const result = await this.rooms.update(code, async room => {
      if (!room || room.status !== 'playing' || Date.now() >= room.endsAt || room.index !== index) return { error: 'Câu hỏi đã kết thúc hoặc thay đổi.' };
      const player = room.players.get(userId);
      if (!player || player.socketId !== socketId || !player.connected) return { error: 'Vui lòng kết nối lại phòng.' };
      if (room.answers.has(userId)) return { room };
      const question = room.questions[room.index];
      if (!Number.isInteger(choice) || choice < 0 || choice >= question.options.length) return { error: 'Đáp án không hợp lệ.' };
      room.answers.set(userId, choice);
      room.responseByUser ??= {};
      room.responseByUser[userId] = Math.max(0, Math.min(QUESTION_MS, QUESTION_MS - (room.endsAt - Date.now())));
      if (choice === question.correctIndex) {
        player.correct = (player.correct ?? 0) + 1;
        player.score += 100 + Math.max(0, Math.round(50 * (room.endsAt - Date.now()) / QUESTION_MS));
      }
      const online = [...room.players.values()].filter(player => player.connected);
      if (online.length && online.every(player => room.answers.has(player.userId))) {
        this.collectMistakes(room);
        room.status = 'reveal';
        room.endsAt = Date.now() + REVEAL_MS;
      }
      room.revision++;
      return { room };
    });
    if (!result.room) return result;
    this.broadcastPlayers(result.room);
    this.schedule(result.room);
    return { ok: true };
  }

  private schedule(room: Room) {
    if (room.revision < (this.revisions.get(room.code) ?? -1)) return;
    this.revisions.set(room.code, room.revision);
    clearTimeout(this.timers.get(room.code));
    this.timers.delete(room.code);
    if (this.stopped || room.status === 'lobby' || room.status === 'ended') return;
    this.timers.set(room.code, setTimeout(() => { void this.advance(room.code); }, Math.max(0, room.endsAt - Date.now())));
  }

  private collectMistakes(room: Room) {
    const question = room.questions[room.index];
    if (!question) return;
    room.reviewByUser ??= {};
    for (const player of room.players.values()) {
      const choice = room.answers.get(player.userId);
      // Called once per question on transition to reveal, including disconnects.
      player.responseMs = (player.responseMs ?? 0) + (room.responseByUser?.[player.userId] ?? QUESTION_MS);
      if (choice === question.correctIndex) continue;
      const review = room.reviewByUser[player.userId] ??= [];
      if (review.some(item => item.number === room.index + 1)) continue;
      const correctAnswer = question.options[question.correctIndex];
      review.push({
        id: `${room.id}:${room.index}`, number: room.index + 1, mode: 'choice',
        skill: room.lang === 'JA' ? 'Kanji' : room.mode === 'IELTS' ? 'Ngữ pháp' : 'Từ vựng',
        prompt: question.text, options: question.options,
        submittedAnswers: choice === undefined ? [] : [question.options[choice]], correctAnswer,
        explanation: question.explanation ?? `Đáp án cần ghi nhớ: “${correctAnswer}”.`,
        reason: choice === undefined ? 'unanswered' : 'wrong',
      });
    }
  }

  private async advance(code: string) {
    if (this.stopped) return;
    try {
      const room = await this.rooms.update(code, async room => {
        if (!room || room.status === 'ended' || room.status === 'lobby' || Date.now() < room.endsAt) return room;
        if (room.status === 'finishing') {
          const ranking = this.ranking(room);
          // Unique roomId makes retry after a crash safe, including after the
          // database committed but before Redis stored the ended state.
          await this.prisma.match.upsert({
            where: { roomId: room.id }, update: {},
            create: {
              roomId: room.id, code: room.code, language: room.lang, totalQuestions: room.questions.length, duel: room.duel ?? false,
              players: { create: ranking.map(player => ({ userId: player.userId, score: player.score, rank: player.rank, correct: player.correct, responseMs: player.responseMs, review: JSON.parse(JSON.stringify(room.reviewByUser?.[player.userId] ?? [])) })) },
            },
          });
          room.status = 'ended';
        } else if (room.status === 'playing') {
          this.collectMistakes(room);
          room.status = 'reveal';
          room.endsAt = Date.now() + REVEAL_MS;
        } else if (room.status === 'reveal' && room.index + 1 >= room.questions.length) {
          room.status = 'finishing';
          room.endsAt = Date.now();
        } else {
          room.index++;
          room.answers.clear();
          room.responseByUser = {};
          room.status = 'playing';
          room.endsAt = Date.now() + QUESTION_MS;
        }
        room.revision++;
        return room;
      });
      if (room) {
        this.broadcastPlayers(room);
        this.schedule(room);
      }
    } catch {
      this.logger.warn('Room update delayed; retrying without discarding saved state.');
      if (!this.stopped) this.timers.set(code, setTimeout(() => { void this.advance(code); }, 2000));
    }
  }
}
