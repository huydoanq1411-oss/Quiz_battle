import { BadRequestException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import type { RedisService } from '../redis/redis.service';

export interface IdentifiedQuestion { contentKey?: string }
export const contentHash = (key: string) => createHash('sha256').update(key.trim().toLowerCase().replace(/\s+/g, ' ')).digest('hex');

export class QuestionHistory {
  constructor(private readonly redis: RedisService) {}

  async take<T extends IdentifiedQuestion>(users: (number | string)[], scope: string, candidates: T[], count: number): Promise<T[]> {
    const unique = [...new Map(candidates.map(question => [contentHash(question.contentKey!), question])).values()];
    const keys = [...new Set(users)].map(id => `quiz:seen:v1:${scope}:${id}`);
    if (!keys.length) throw new Error('Question history requires a participant.');
    // Selection and reservation are one operation across all participants. A
    // concurrent new game cannot claim questions reserved by this game.
    const raw = await this.redis.client.eval(`
      local wanted = tonumber(ARGV[1])
      local chosen = {}
      local available = 0
      for i = 2, #ARGV do
        local hash = ARGV[i]
        local seen = false
        for _, key in ipairs(KEYS) do
          if redis.call('sismember', key, hash) == 1 then seen = true; break end
        end
        if not seen then
          available = available + 1
          if #chosen < wanted then table.insert(chosen, i - 1) end
        end
      end
      if #chosen < wanted then return {available} end
      for _, i in ipairs(chosen) do
        for _, key in ipairs(KEYS) do redis.call('sadd', key, ARGV[i + 1]) end
      end
      local result = {available}
      for _, i in ipairs(chosen) do table.insert(result, i) end
      return result
    `, keys.length, ...keys, String(count), ...unique.map(question => contentHash(question.contentKey!)));
    const result = raw as number[];
    if (result.length !== count + 1) throw new BadRequestException(`Chỉ còn ${result[0]} câu mới, cần ${count} câu. Hãy đổi chủ đề/cấp độ hoặc giảm số câu; câu cũ không được tự lặp lại.`);
    return result.slice(1).map(index => unique[index - 1]);
  }
}
