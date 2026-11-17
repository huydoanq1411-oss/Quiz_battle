import {
  WebSocketGateway, SubscribeMessage, ConnectedSocket, MessageBody,
  OnGatewayInit, OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { GameService } from './game.service';
import type { CefrLevel as EnglishLevel } from './english-learning-bank';
import type { JapaneseLevel, QuizLevel } from './question.service';
import { clientOrigins } from '../config';
import { ConflictException, Logger } from '@nestjs/common';

const ENGLISH_LEVELS: EnglishLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const JAPANESE_LEVELS: JapaneseLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

@WebSocketGateway({ cors: { origin: clientOrigins() } })
export class QuizGateway implements OnGatewayInit, OnGatewayDisconnect {
  private readonly logger = new Logger(QuizGateway.name);
  constructor(private jwt: JwtService, private prisma: PrismaService, private game: GameService) {}

  afterInit(server: Server) {
    this.game.server = server;
    server.use(async (socket, next) => {
      try {
        const { sub } = this.jwt.verify(socket.handshake.auth.token);
        const user = await this.prisma.user.findUnique({
          where: { id: sub }, select: { id: true, name: true },
        });
        if (!user) return next(new Error('unauthorized'));
        socket.data.user = user;
        next();
      } catch {
        next(new Error('unauthorized'));
      }
    });
  }

  handleDisconnect(client: Socket) {
    void this.game.disconnect(client.id).catch(() => this.logger.warn('Could not record disconnect; room remains saved.'));
  }

  private async respond<T>(operation: () => Promise<T>) {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof ConflictException) return { error: error.message, retryable: true };
      this.logger.warn('Room request failed; client can retry.');
      return { error: 'Chưa cập nhật được phòng. Vui lòng thử lại.', retryable: true };
    }
  }

  @SubscribeMessage('room:create')
  async create(@ConnectedSocket() c: Socket, @MessageBody() b: { lang: string; total: number; mode?: string; level?: string }) {
    return this.respond(async () => {
      if (!b || typeof b !== 'object') return { error: 'Thông tin phòng không hợp lệ.' };
      const lang = b.lang === 'JA' ? 'JA' : 'EN';
      const mode = lang === 'JA' ? 'JLPT' : b.mode === 'IELTS' ? 'IELTS' : 'VOCAB';
      const availableLevels: string[] = lang === 'JA' ? JAPANESE_LEVELS : ENGLISH_LEVELS;
      const defaultLevel = lang === 'JA' ? 'N5' : 'A1';
      const level = (availableLevels.includes(b.level ?? '') ? b.level : defaultLevel) as QuizLevel;
      const total = Number(b.total);
      const room = await this.game.create(c.data.user, c.id, lang, Number.isFinite(total) ? total : 10, mode, level);
      await c.join(room.code);
      this.game.broadcastPlayers(room);
      return { ok: true, code: room.code };
    });
  }

  @SubscribeMessage('room:join')
  async join(@ConnectedSocket() c: Socket, @MessageBody() b: { code: string }) {
    return this.respond(async () => {
      if (typeof b?.code !== 'string' || !/^[A-Z2-9]{5}$/.test(b.code.toUpperCase())) return { error: 'Mã phòng không hợp lệ.' };
      const res = await this.game.join(b.code.toUpperCase(), c.data.user, c.id);
      if ('error' in res) return res;
      await c.join(res.room.code);
      this.game.broadcastPlayers(res.room);
      return {
        ok: true,
        code: res.room.code,
        lang: res.room.lang,
        mode: res.room.mode,
        level: res.room.level,
        state: this.game.publicState(res.room, c.data.user.id),
      };
    });
  }

  @SubscribeMessage('game:start')
  async start(@ConnectedSocket() c: Socket, @MessageBody() b: { code: string }) {
    return this.respond(async () => {
      if (typeof b?.code !== 'string') return { error: 'Mã phòng không hợp lệ.' };
      return this.game.start(b.code.toUpperCase(), c.data.user.id);
    });
  }

  @SubscribeMessage('game:answer')
  answer(@ConnectedSocket() c: Socket, @MessageBody() b: { code: string; index: number; choice: number }) {
    return this.respond(async () => {
      if (typeof b?.code !== 'string' || !Number.isInteger(b.index)) return { error: 'Câu hỏi không hợp lệ.' };
      return this.game.answer(b.code.toUpperCase(), c.data.user.id, c.id, b.index, b.choice);
    });
  }
}
