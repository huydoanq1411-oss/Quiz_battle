import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import { QuestionService, Question, Lang, QuizLevel, QuizMode } from './question.service';

export interface Player { userId: number; name: string; socketId: string; score: number; connected: boolean }
export interface Room {
  code: string; hostId: number; lang: Lang; mode: QuizMode; level: QuizLevel; total: number;
  status: 'lobby' | 'playing' | 'ended';
  players: Map<number, Player>;
  questions: Question[]; index: number;
  answers: Map<number, number>;
  endsAt: number;
  timer?: NodeJS.Timeout;
}

const QUESTION_MS = 15000;
const REVEAL_MS = 3000;
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

@Injectable()
export class GameService {
  server: Server;
  private rooms = new Map<string, Room>();

  constructor(private prisma: PrismaService, private questions: QuestionService) {}

  private newCode() {
    let c: string;
    do {
      c = Array.from({ length: 5 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('');
    } while (this.rooms.has(c));
    return c;
  }

  private addPlayer(r: Room, u: { id: number; name: string }, socketId: string) {
    const old = r.players.get(u.id);
    r.players.set(u.id, { userId: u.id, name: u.name, socketId, score: old?.score ?? 0, connected: true });
  }

  players(r: Room) {
    return [...r.players.values()].map(p => ({
      userId: p.userId, name: p.name, score: p.score, isHost: p.userId === r.hostId,
    }));
  }

  broadcastPlayers(r: Room) {
    this.server.to(r.code).emit('room:players', this.players(r));
  }

  create(u: { id: number; name: string }, socketId: string, lang: Lang, total: number, mode: QuizMode, level: QuizLevel) {
    const room: Room = {
      code: this.newCode(), hostId: u.id, lang, mode, level,
      total: Math.min(Math.max(total, 3), 20),
      status: 'lobby', players: new Map(), questions: [], index: -1,
      answers: new Map(), endsAt: 0,
    };
    this.rooms.set(room.code, room);
    this.addPlayer(room, u, socketId);
    return room;
  }

  join(code: string, u: { id: number; name: string }, socketId: string) {
    const room = this.rooms.get((code ?? '').toUpperCase());
    if (!room) return { error: 'Không tìm thấy phòng' };
    if (room.status !== 'lobby' && !room.players.has(u.id)) return { error: 'Phòng đã bắt đầu' };
    this.addPlayer(room, u, socketId);
    return { room };
  }

  disconnect(socketId: string) {
    for (const r of this.rooms.values()) {
      const p = [...r.players.values()].find(x => x.socketId === socketId);
      if (!p) continue;
      if (r.status === 'lobby') {
        r.players.delete(p.userId);
        if (r.hostId === p.userId) {
          const next = r.players.keys().next().value;
          if (next !== undefined) r.hostId = next;
        }
      } else {
        p.connected = false;
      }
      if (![...r.players.values()].some(x => x.connected)) {
        clearTimeout(r.timer);
        this.rooms.delete(r.code);
      } else {
        this.broadcastPlayers(r);
      }
    }
  }

  async start(code: string, userId: number) {
    const r = this.rooms.get(code);
    if (!r || r.hostId !== userId || r.status !== 'lobby') return { error: 'Không thể bắt đầu' };
    try {
      r.questions = await this.questions.get(r.lang, r.total, r.mode, r.level);
    } catch (e) {
      console.error(e);
      return { error: 'Không lấy được câu hỏi, đợi vài giây rồi thử lại' };
    }
    r.status = 'playing';
    r.index = -1;
    this.server.to(code).emit('game:start', { total: r.questions.length });
    r.timer = setTimeout(() => this.next(r), 1500);
    return { ok: true };
  }

  private next(r: Room) {
    if (!this.rooms.has(r.code)) return;
    r.index++;
    if (r.index >= r.questions.length) return void this.finish(r);

    r.answers.clear();
    r.endsAt = Date.now() + QUESTION_MS;
    const q = r.questions[r.index];
    this.server.to(r.code).emit('game:question', {
      index: r.index, total: r.questions.length,
      text: q.text, options: q.options, durationMs: QUESTION_MS,
    });
    r.timer = setTimeout(() => this.reveal(r), QUESTION_MS);
  }

  answer(code: string, userId: number, choice: number) {
    const r = this.rooms.get(code);
    if (!r || r.status !== 'playing' || Date.now() > r.endsAt) return;
    if (!r.players.has(userId) || r.answers.has(userId)) return;
    const q = r.questions[r.index];
    if (!Number.isInteger(choice) || choice < 0 || choice >= q.options.length) return;

    r.answers.set(userId, choice);
    if (choice === q.correctIndex) {
      const bonus = Math.round((50 * (r.endsAt - Date.now())) / QUESTION_MS);
      r.players.get(userId)!.score += 100 + bonus;
    }
    this.server.to(code).emit('game:answered', { userId });

    const online = [...r.players.values()].filter(p => p.connected);
    if (online.every(p => r.answers.has(p.userId))) {
      clearTimeout(r.timer);
      this.reveal(r);
    }
  }

  private reveal(r: Room) {
    r.endsAt = 0;
    const q = r.questions[r.index];
    this.server.to(r.code).emit('game:reveal', {
      correctIndex: q.correctIndex,
      answers: Object.fromEntries(r.answers),
      players: this.players(r),
    });
    r.timer = setTimeout(() => this.next(r), REVEAL_MS);
  }

  private async finish(r: Room) {
    r.status = 'ended';
    const ranking = [...r.players.values()]
      .sort((a, b) => b.score - a.score)
      .map((p, i) => ({ rank: i + 1, userId: p.userId, name: p.name, score: p.score }));
    this.server.to(r.code).emit('game:end', { ranking });

    await this.prisma.match.create({
      data: {
        code: r.code, language: r.lang, totalQuestions: r.questions.length,
        players: { create: ranking.map(x => ({ userId: x.userId, score: x.score, rank: x.rank })) },
      },
    }).catch(console.error);

    setTimeout(() => this.rooms.delete(r.code), 60_000);
  }
}
