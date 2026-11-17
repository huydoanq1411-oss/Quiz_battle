import { ConflictException } from '@nestjs/common';
import { RoomRepository } from './room.repository';
import type { RedisService } from '../redis/redis.service';

describe('Redis room storage', () => {
  it('restores player and answer maps from a persisted snapshot', async () => {
    const client = {
      set: jest.fn().mockResolvedValue('OK'),
      get: jest.fn().mockResolvedValue(JSON.stringify({ code: 'ABCDE', players: [[1, { score: 100 }]], answers: [[1, 2]] })),
      eval: jest.fn().mockResolvedValue(1),
    };
    const repository = new RoomRepository({ client } as unknown as RedisService);
    await repository.update('ABCDE', async room => {
      expect(room?.players.get(1)?.score).toBe(100);
      expect(room?.answers.get(1)).toBe(2);
    });
    const persisted = JSON.parse(client.eval.mock.calls[0][5]);
    expect(persisted.answers).toEqual([[1, 2]]);
    expect(persisted.players).toEqual([[1, { score: 100 }]]);
  });

  it('rejects a write after ownership of the lock was lost', async () => {
    const client = {
      set: jest.fn().mockResolvedValue('OK'),
      get: jest.fn().mockResolvedValue('{"code":"ABCDE","players":[],"answers":[]}'),
      eval: jest.fn().mockResolvedValueOnce(0).mockResolvedValueOnce(0),
    };
    const repository = new RoomRepository({ client } as unknown as RedisService);
    await expect(repository.update('ABCDE', async () => undefined)).rejects.toBeInstanceOf(ConflictException);
    expect(client.eval).toHaveBeenCalledTimes(2);
  });
});
