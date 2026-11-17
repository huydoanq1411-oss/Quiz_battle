import { ConflictException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { RedisService } from '../redis/redis.service';
import type { Room } from './game.service';

const PREFIX = 'quiz:room:';
const TTL = 24 * 60 * 60;

@Injectable()
export class RoomRepository {
  constructor(private readonly redis: RedisService) {}

  async create(room: Room) {
    return (await this.redis.client.set(PREFIX + room.code, this.encode(room), 'EX', TTL, 'NX')) === 'OK';
  }

  async codes() {
    const codes: string[] = [];
    let cursor = '0';
    do {
      const result = await this.redis.client.scan(cursor, 'MATCH', PREFIX + '*', 'COUNT', 100);
      cursor = result[0];
      codes.push(...result[1].map(key => key.slice(PREFIX.length)));
    } while (cursor !== '0');
    return codes;
  }

  async update<T>(code: string, operation: (room: Room | null) => Promise<T>): Promise<T> {
    const lockKey = 'quiz:room-lock:' + code;
    const token = randomUUID();
    if (!await this.redis.client.set(lockKey, token, 'PX', 15_000, 'NX')) {
      throw new ConflictException('Phòng đang được cập nhật. Vui lòng thử lại.');
    }
    try {
      const json = await this.redis.client.get(PREFIX + code);
      const room = json ? this.decode(json) : null;
      const result = await operation(room);
      if (room) {
        // A timed-out operation must never overwrite a newer room version.
        const saved = await this.redis.client.eval(
          "if redis.call('get', KEYS[1]) ~= ARGV[1] then return 0 end redis.call('set', KEYS[2], ARGV[2], 'EX', ARGV[3]) return 1",
          2, lockKey, PREFIX + code, token, this.encode(room), String(TTL),
        );
        if (saved !== 1) throw new ConflictException('Phòng đã thay đổi. Vui lòng kết nối lại.');
      }
      return result;
    } finally {
      await this.redis.client.eval(
        "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
        1, lockKey, token,
      );
    }
  }

  private encode(room: Room) {
    return JSON.stringify({ ...room, players: [...room.players], answers: [...room.answers] });
  }

  private decode(json: string): Room {
    const data = JSON.parse(json) as Omit<Room, 'players' | 'answers'> & {
      players: [number, Room['players'] extends Map<number, infer P> ? P : never][];
      answers: [number, number][];
    };
    return { ...data, players: new Map(data.players), answers: new Map(data.answers) };
  }
}
