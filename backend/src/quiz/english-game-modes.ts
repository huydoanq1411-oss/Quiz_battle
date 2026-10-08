import { GRAMMAR, VOCABULARY, type CefrLevel } from './english-learning-bank';

export type EnglishModeId =
  | 'meaning-choice'
  | 'letter-order'
  | 'fill-gap'
  | 'listen-choice'
  | 'wordle'
  | 'picture-match'
  | 'hangman'
  | 'error-correction'
  | 'sentence-order'
  | 'speaking'
  | 'reading'
  | 'word-chain'
  | 'crossword'
  | 'boggle';

export interface EnglishGameQuestion {
  id: string;
  mode: EnglishModeId;
  skill: string;
  prompt: string;
  options?: string[];
  letters?: string[];
  spokenText?: string;
  answerLength?: number;
  hint: string;
  answer: string;
}

export interface EnglishGameModule {
  id: EnglishModeId;
  skill: string;
  generateQuestion(level: CefrLevel, random: () => number): EnglishGameQuestion;
  checkAnswer(question: EnglishGameQuestion, answer: string): boolean;
  todo?: boolean;
}

const pick = <T,>(items: readonly T[], random: () => number): T =>
  items[Math.floor(random() * items.length)];

const shuffle = <T,>(items: readonly T[], random: () => number): T[] => {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
};

const normalize = (value: string) => value.trim().toLocaleLowerCase('en-US').replace(/\s+/g, ' ');

const vocabularyEntry = (level: CefrLevel, random: () => number) => {
  const entries = VOCABULARY.filter((entry) => entry.level === level);
  return pick(entries, random);
};

const grammarEntry = (level: CefrLevel, random: () => number) => {
  const entries = GRAMMAR.filter((entry) => entry.level === level);
  return pick(entries, random);
};

const choiceQuestion = (
  id: string,
  mode: 'meaning-choice' | 'fill-gap' | 'listen-choice',
  skill: string,
  prompt: string,
  answer: string,
  distractors: readonly string[],
  random: () => number,
  spokenText?: string,
): EnglishGameQuestion => ({
  id,
  mode,
  skill,
  prompt,
  options: shuffle([answer, ...shuffle(distractors.filter((item) => item !== answer), random).slice(0, 3)], random),
  spokenText,
  hint: answer[0].toLocaleUpperCase('en-US'),
  answer,
});

export const ENGLISH_GAME_MODULES: readonly EnglishGameModule[] = [
  {
    id: 'meaning-choice',
    skill: 'Từ vựng',
    generateQuestion(level, random) {
      const entry = vocabularyEntry(level, random);
      const distractors = shuffle(VOCABULARY.filter((item) => item.level === level && item.word !== entry.word), random)
        .slice(0, 3).map((item) => item.meaning);
      return choiceQuestion(entry.word, 'meaning-choice', this.skill, `“${entry.word}” có nghĩa là gì?`, entry.meaning, distractors, random);
    },
    checkAnswer: (question, answer) => normalize(question.answer) === normalize(answer),
  },
  {
    id: 'letter-order',
    skill: 'Chính tả',
    generateQuestion(level, random) {
      const entry = vocabularyEntry(level, random);
      return {
        id: entry.word, mode: this.id, skill: this.skill,
        prompt: `Sắp xếp chữ cái để tạo từ có nghĩa “${entry.meaning}”.`,
        letters: shuffle(Array.from(entry.word.toLocaleUpperCase('en-US')), random),
        hint: entry.word[0].toLocaleUpperCase('en-US'), answer: entry.word,
      };
    },
    checkAnswer: (question, answer) => normalize(question.answer) === normalize(answer),
  },
  {
    id: 'fill-gap',
    skill: 'Ngữ pháp',
    generateQuestion(level, random) {
      const entry = grammarEntry(level, random);
      return choiceQuestion(entry.sentence, 'fill-gap', this.skill, entry.sentence, entry.answer, entry.distractors, random);
    },
    checkAnswer: (question, answer) => normalize(question.answer) === normalize(answer),
  },
  {
    id: 'listen-choice',
    skill: 'Nghe',
    generateQuestion(level, random) {
      const entry = vocabularyEntry(level, random);
      const distractors = shuffle(VOCABULARY.filter((item) => item.level === level && item.word !== entry.word), random)
        .slice(0, 3).map((item) => item.meaning);
      return choiceQuestion(entry.word, 'listen-choice', this.skill, 'Nghe từ tiếng Anh rồi chọn nghĩa phù hợp.', entry.meaning, distractors, random, entry.word);
    },
    checkAnswer: (question, answer) => normalize(question.answer) === normalize(answer),
  },
  {
    id: 'wordle',
    skill: 'Từ vựng và chính tả',
    generateQuestion(level, random) {
      const entry = vocabularyEntry(level, random);
      return {
        id: entry.word, mode: this.id, skill: this.skill,
        prompt: `Đoán từ tiếng Anh có nghĩa “${entry.meaning}”.`,
        answerLength: Array.from(entry.word).length, hint: `${Array.from(entry.word).length} chữ cái`, answer: entry.word,
      };
    },
    checkAnswer: (question, answer) => normalize(question.answer) === normalize(answer),
  },
  ...(['picture-match', 'hangman', 'error-correction', 'sentence-order', 'speaking', 'reading', 'word-chain', 'crossword', 'boggle'] as const).map((id): EnglishGameModule => ({
    id,
    skill: 'Đang phát triển',
    todo: true,
    generateQuestion(level, random) {
      const entry = vocabularyEntry(level, random);
      return { id: entry.word, mode: id, skill: this.skill, prompt: 'TODO: hoàn thiện dạng chơi này.', hint: '', answer: entry.word };
    },
    checkAnswer: () => false,
  })),
];

export const getEnglishGameModule = (id: EnglishModeId): EnglishGameModule => {
  const gameModule = ENGLISH_GAME_MODULES.find((item) => item.id === id);
  if (!gameModule || gameModule.todo) throw new Error(`Dạng chơi chưa sẵn sàng: ${id}`);
  return gameModule;
};
