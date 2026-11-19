import { Injectable } from '@nestjs/common';
import { KanjiCard } from '@prisma/client';
import { BadRequestException, Optional } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { QuestionHistory } from './question-history';
import { topicVocabulary, type Topic } from './topics';
import { PrismaService } from '../prisma/prisma.service';
import { GRAMMAR, VOCABULARY, type CefrLevel } from './english-learning-bank';

type EnglishLevel = CefrLevel;
type EnglishMode = 'VOCAB' | 'IELTS';

export type Lang = 'EN' | 'JA';
export type JapaneseLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
export type QuizLevel = EnglishLevel | JapaneseLevel;
export type QuizMode = EnglishMode | 'JLPT';
export interface Question { text: string; options: string[]; correctIndex: number; explanation?: string; contentKey?: string }

const shuffle = <T,>(a: T[]) => {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
};
const sample = <T,>(items: readonly T[], count: number) => {
  if (items.length === 0) throw new Error('Không có dữ liệu câu hỏi cho cấp độ này.');
  if (items.length < count) throw new BadRequestException(`Chỉ có ${items.length} câu khác nhau, cần ${count} câu.`);
  return shuffle([...items]).slice(0, count);
};
const clean = (s?: string) => s?.replace(/[.-]/g, '');

@Injectable()
export class QuestionService {
  constructor(private prisma: PrismaService, @Optional() private redis?: RedisService) {}

  async get(lang: Lang, n: number, mode: QuizMode = 'VOCAB', level: QuizLevel = 'A1', topic?: Topic, users: number[] = []) {
    const pool = lang === 'JA' ? await this.japanese(level as JapaneseLevel)
      : this.english(mode === 'IELTS' ? 'IELTS' : 'VOCAB', level as EnglishLevel, topic);
    if (!users.length) return sample(pool, n);
    if (!this.redis) throw new Error('Question history store is unavailable.');
    return new QuestionHistory(this.redis).take(users, `room:${lang}:${mode}:${level}:${topic ?? 'all'}`, shuffle(pool), n);
  }

  private english(mode: EnglishMode, level: EnglishLevel, topic?: Topic): Question[] {
    if (mode === 'IELTS') {
      const items = GRAMMAR.filter((item) => item.level === level);
      return items.map((item) => {
        const options = shuffle([item.answer, ...item.distractors]);
        return {
          contentKey: `fill-gap:${item.sentence}`,
          text: `Chọn đáp án phù hợp nhất để hoàn thành câu:\n${item.sentence}`,
          options,
          correctIndex: options.indexOf(item.answer),
          explanation: `${item.explanation} Câu hoàn chỉnh: ${item.sentence.replace('____', item.answer)}`,
        };
      });
    }

    const items = topic ? topicVocabulary(topic, level) : VOCABULARY.filter((item) => item.level === level);
    return items.map((item) => {
      const distractors = shuffle(items.filter((candidate) => candidate.word !== item.word));
      const options = shuffle([item.meaning, ...distractors.slice(0, 3).map((candidate) => candidate.meaning)]);
      return {
        contentKey: `meaning-choice:${item.word}`,
        text: `Từ “${item.word}” có nghĩa gần nhất là gì?`,
        options,
        correctIndex: options.indexOf(item.meaning),
        explanation: `“${item.word}” có nghĩa là “${item.meaning}”.`,
      };
    });
  }

  private async japanese(level: JapaneseLevel): Promise<Question[]> {
    const jlpt = Number(level.slice(1));
    const cards = shuffle(await this.prisma.kanjiCard.findMany({ where: { jlpt } }));
    if (cards.length < 4) {
      throw new Error(`Chưa đủ dữ liệu kanji ${level}. Hãy chạy seed-kanji để nạp dữ liệu JLPT.`);
    }

    const out: Question[] = [];
    for (const card of cards) {
      const mode: 'meaning' | 'reading' = Math.random() < 0.5 ? 'meaning' : 'reading';
      const val = (c: KanjiCard) =>
        mode === 'meaning'
          ? (c.meanings as string[])[0]
          : clean((c.kunReadings as string[])[0]);

      const correct = val(card);
      if (!correct) continue;

      const wrong = [...new Set(
        cards.filter(c => c.id !== card.id).map(val)
          .filter(v => v && v !== correct && !(card.meanings as string[]).includes(v)),
      )] as string[];
      const options = shuffle([correct, ...shuffle(wrong).slice(0, 3)]);
      if (options.length < 4) continue;

      out.push({
        contentKey: `kanji:${mode}:${card.kanji}`,
        text: mode === 'meaning'
          ? `「${card.kanji}」có nghĩa là gì?`
          : `「${card.kanji}」đọc là gì? (kun-yomi)`,
        options,
        correctIndex: options.indexOf(correct),
        explanation: mode === 'meaning'
          ? `Kanji 「${card.kanji}」 có nghĩa: ${(card.meanings as string[]).join(', ')}.`
          : `Một cách đọc kun-yomi của 「${card.kanji}」 là “${correct}”. Các cách đọc trong dữ liệu: ${(card.kunReadings as string[]).join(', ')}.`,
      });
    }
    if (!out.length) throw new Error(`Không đủ câu hỏi có đáp án hợp lệ cho ${level}.`);
    return out;
  }
}
