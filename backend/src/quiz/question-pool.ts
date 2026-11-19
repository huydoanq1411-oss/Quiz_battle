import { GRAMMAR, VOCABULARY, type CefrLevel } from './english-learning-bank';
import { getEnglishGameModule, matchQuestion, type EnglishModeId, type EnglishGameQuestion } from './english-game-modes';
import { topicVocabulary, type Topic } from './topics';

export function seededRandom(seed: string): () => number {
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

export function englishQuestionPool(level: CefrLevel, topic: Topic | undefined, seed: string, daily = false): EnglishGameQuestion[] {
  const words = topic ? topicVocabulary(topic, level) : VOCABULARY.filter(item => item.level === level);
  const grammar = GRAMMAR.filter(item => item.level === level);
  const modes: EnglishModeId[] = topic ? ['meaning-choice', 'letter-order', 'listen-choice', 'word-match']
    : daily ? ['meaning-choice', 'letter-order', 'fill-gap', 'listen-choice', 'wordle']
      : ['meaning-choice', 'letter-order', 'fill-gap', 'listen-choice', 'wordle', 'sentence-order', 'error-correction', 'word-match'];
  const random = seededRandom(seed);
  const pool = modes.flatMap(mode => {
    if (mode === 'word-match') return words.map((_, index) => matchQuestion([words[index], words[(index + 1) % words.length], words[(index + 2) % words.length]], random));
    const size = ['fill-gap', 'sentence-order', 'error-correction'].includes(mode) ? grammar.length : words.length;
    return Array.from({ length: size }, (_, index) => {
      let first = true;
      return getEnglishGameModule(mode).generateQuestion(level, () => {
        if (first) { first = false; return (index + 0.5) / size; }
        return random();
      }, topic);
    });
  });
  for (let index = pool.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [pool[index], pool[other]] = [pool[other], pool[index]];
  }
  return pool;
}
