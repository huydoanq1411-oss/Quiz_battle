import {
  WebSocketGateway, SubscribeMessage, ConnectedSocket, MessageBody,
  OnGatewayInit, OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { GameService } from './game.service';
import type { EnglishLevel } from './english-question-bank';
import type { JapaneseLevel, QuizLevel } from './question.service';

const ENGLISH_LEVELS: EnglishLevel[] = ['A1-A2', 'B1-B2', 'C1-C2'];
const JAPANESE_LEVELS: JapaneseLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

@WebSocketGateway({ cors: { origin: '*' } })
export class QuizGateway implements OnGatewayInit, OnGatewayDisconnect {
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
    this.game.disconnect(client.id);
  }

  @SubscribeMessage('room:create')
  async create(@ConnectedSocket() c: Socket, @MessageBody() b: { lang: string; total: number; mode?: string; level?: string }) {
    const lang = b.lang === 'JA' ? 'JA' : 'EN';
    const mode = lang === 'JA' ? 'JLPT' : b.mode === 'IELTS' ? 'IELTS' : 'VOCAB';
    const availableLevels: string[] = lang === 'JA' ? JAPANESE_LEVELS : ENGLISH_LEVELS;
    const defaultLevel = lang === 'JA' ? 'N5' : 'A1-A2';
    const level = (availableLevels.includes(b.level ?? '') ? b.level : defaultLevel) as QuizLevel;
    const room = this.game.create(c.data.user, c.id, lang, Number(b.total) || 10, mode, level);
    await c.join(room.code);
    this.game.broadcastPlayers(room);
    return { ok: true, code: room.code };
  }

  @SubscribeMessage('room:join')
  async join(@ConnectedSocket() c: Socket, @MessageBody() b: { code: string }) {
    const res = this.game.join(b.code, c.data.user, c.id);
    if ('error' in res) return res;
    await c.join(res.room.code);
    this.game.broadcastPlayers(res.room);
    return {
      ok: true,
      code: res.room.code,
      lang: res.room.lang,
      mode: res.room.mode,
      level: res.room.level,
    };
  }

  @SubscribeMessage('game:start')
  async start(@ConnectedSocket() c: Socket, @MessageBody() b: { code: string }) {
    return await this.game.start((b.code ?? '').toUpperCase(), c.data.user.id);
  }

  @SubscribeMessage('game:answer')
  answer(@ConnectedSocket() c: Socket, @MessageBody() b: { code: string; choice: number }) {
    this.game.answer((b.code ?? '').toUpperCase(), c.data.user.id, b.choice);
  }
}
