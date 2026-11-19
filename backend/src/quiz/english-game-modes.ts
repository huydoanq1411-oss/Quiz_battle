import { GRAMMAR, VOCABULARY, type CefrLevel, type VocabularyEntry } from './english-learning-bank';
import { topicVocabulary, type Topic } from './topics';

export type EnglishModeId =
  | 'meaning-choice'
  | 'word-match'
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
  contentKey?: string;
  id: string;
  mode: EnglishModeId;
  skill: string;
  prompt: string;
  options?: string[];
  letters?: string[];
  spokenText?: string;
  answerLength?: number;
  matchWords?: string[];
  matchMeanings?: string[];
  hint: string;
  answer: string;
  explanation?: string;
}

export interface EnglishGameModule {
  id: EnglishModeId;
  skill: string;
  generateQuestion(level: CefrLevel, random: () => number, topic?: Topic): EnglishGameQuestion;
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
const questionId = (mode: EnglishModeId, random: () => number) => `${mode}:${Math.floor(random() * 0xffffffff).toString(36)}`;

const vocabularyEntry = (level: CefrLevel, random: () => number, topic?: Topic) => {
  const entries = topic ? topicVocabulary(topic, level) : VOCABULARY.filter((entry) => entry.level === level);
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

export function matchQuestion(entries: VocabularyEntry[], random: () => number): EnglishGameQuestion {
  const meanings = shuffle(entries.map(item => item.meaning), random);
  const answer = entries.map(item => String(meanings.indexOf(item.meaning) + 1)).join('-');
  return { id: questionId('word-match', random), mode: 'word-match', skill: 'Ghép từ với nghĩa',
    contentKey: `word-match:${entries.map(item => item.word).sort().join('|')}`,
    matchWords: entries.map(item => item.word), matchMeanings: meanings,
    prompt: `Ghép A, B, C với nghĩa 1, 2, 3. Nhập ba số theo thứ tự, ví dụ 2-3-1.\n${entries.map((item, index) => `${String.fromCharCode(65 + index)}. ${item.word}`).join('\n')}\n${meanings.map((meaning, index) => `${index + 1}. ${meaning}`).join('\n')}`,
    answer, hint: answer[0], explanation: entries.map(item => `${item.word}: ${item.meaning}`).join('; ') };
}

export const ENGLISH_GAME_MODULES: readonly EnglishGameModule[] = [
  {
    id: 'sentence-order', skill: 'Xếp câu',
    generateQuestion(level, random) {
      const entry = grammarEntry(level, random);
      const answer = entry.sentence.replace('____', entry.answer);
      return { id: questionId(this.id, random), mode: this.id, skill: this.skill,
        contentKey: `${this.id}:${entry.sentence}`,
        prompt: 'Sắp xếp các từ thành câu hoàn chỉnh. Giữ nguyên dấu câu.',
        letters: shuffle(answer.split(' '), random), answer, hint: answer.split(' ')[0],
        explanation: `${entry.explanation} Câu đúng: ${answer}` };
    },
    checkAnswer: (question, answer) => normalize(question.answer) === normalize(answer),
  },
  {
    id: 'error-correction', skill: 'Sửa lỗi ngữ pháp',
    generateQuestion(level, random) {
      const entry = grammarEntry(level, random);
      const answer = entry.sentence.replace('____', entry.answer);
      return { id: questionId(this.id, random), mode: this.id, skill: this.skill,
        contentKey: `${this.id}:${entry.sentence}`,
        prompt: `Sửa phần trong ngoặc vuông và nhập lại cả câu: ${entry.sentence.replace('____', `[${entry.distractors[0]}]`)}`,
        answer, hint: entry.answer[0], explanation: `${entry.explanation} Câu đúng: ${answer}` };
    },
    checkAnswer: (question, answer) => normalize(question.answer) === normalize(answer),
  },
  {
    id: 'word-match', skill: 'Ghép từ với nghĩa',
    generateQuestion(level, random, topic) {
      const entries = shuffle(topic ? topicVocabulary(topic, level) : VOCABULARY.filter(item => item.level === level), random).slice(0, 3);
      return matchQuestion(entries, random);
    },
    checkAnswer: (question, answer) => normalize(question.answer) === normalize(answer),
  },
  {
    id: 'meaning-choice',
    skill: 'Từ vựng',
    generateQuestion(level, random, topic) {
      const entry = vocabularyEntry(level, random, topic);
      const distractors = shuffle((topic ? topicVocabulary(topic, level) : VOCABULARY.filter(item => item.level === level)).filter(item => item.word !== entry.word), random)
        .slice(0, 3).map((item) => item.meaning);
      return { contentKey: `${this.id}:${entry.word}`, ...choiceQuestion(questionId(this.id, random), 'meaning-choice', this.skill, `“${entry.word}” có nghĩa là gì?`, entry.meaning, distractors, random), explanation: `“${entry.word}” có nghĩa là “${entry.meaning}”. Chọn nghĩa tương ứng với từ tiếng Anh này.` };
    },
    checkAnswer: (question, answer) => normalize(question.answer) === normalize(answer),
  },
  {
    id: 'letter-order',
    skill: 'Chính tả',
    generateQuestion(level, random, topic) {
      const entry = vocabularyEntry(level, random, topic);
      return {
        id: questionId(this.id, random), mode: this.id, skill: this.skill,
        contentKey: `${this.id}:${entry.word}`,
        prompt: `Sắp xếp chữ cái để tạo từ có nghĩa “${entry.meaning}”.`,
        letters: shuffle(Array.from(entry.word.toLocaleUpperCase('en-US')), random),
        hint: entry.word[0].toLocaleUpperCase('en-US'), answer: entry.word,
        explanation: `Từ đúng là “${entry.word}”, nghĩa là “${entry.meaning}”. Thứ tự chữ cái: ${Array.from(entry.word).join(' – ')}.`,
      };
    },
    checkAnswer: (question, answer) => normalize(question.answer) === normalize(answer),
  },
  {
    id: 'fill-gap',
    skill: 'Ngữ pháp',
    generateQuestion(level, random) {
      const entry = grammarEntry(level, random);
      return { contentKey: `${this.id}:${entry.sentence}`, ...choiceQuestion(questionId(this.id, random), 'fill-gap', this.skill, entry.sentence, entry.answer, entry.distractors, random), explanation: `${entry.explanation} Câu hoàn chỉnh: ${entry.sentence.replace('____', entry.answer)}` };
    },
    checkAnswer: (question, answer) => normalize(question.answer) === normalize(answer),
  },
  {
    id: 'listen-choice',
    skill: 'Nghe',
    generateQuestion(level, random, topic) {
      const entry = vocabularyEntry(level, random, topic);
      const distractors = shuffle((topic ? topicVocabulary(topic, level) : VOCABULARY.filter(item => item.level === level)).filter(item => item.word !== entry.word), random)
        .slice(0, 3).map((item) => item.meaning);
      return { contentKey: `${this.id}:${entry.word}`, ...choiceQuestion(questionId(this.id, random), 'listen-choice', this.skill, 'Nghe từ tiếng Anh rồi chọn nghĩa phù hợp.', entry.meaning, distractors, random, entry.word), explanation: `Từ bạn nghe là “${entry.word}”, có nghĩa là “${entry.meaning}”.` };
    },
    checkAnswer: (question, answer) => normalize(question.answer) === normalize(answer),
  },
  {
    id: 'wordle',
    skill: 'Từ vựng và chính tả',
    generateQuestion(level, random, topic) {
      const entry = vocabularyEntry(level, random, topic);
      return {
        id: questionId(this.id, random), mode: this.id, skill: this.skill,
        contentKey: `${this.id}:${entry.word}`,
        prompt: `Đoán từ tiếng Anh có nghĩa “${entry.meaning}”.`,
        answerLength: Array.from(entry.word).length, hint: entry.word[0].toLocaleUpperCase('en-US'), answer: entry.word,
        explanation: `Từ cần tìm là “${entry.word}”, nghĩa là “${entry.meaning}”, gồm ${Array.from(entry.word).length} chữ cái.`,
      };
    },
    checkAnswer: (question, answer) => normalize(question.answer) === normalize(answer),
  },
  ...(['picture-match', 'hangman', 'speaking', 'reading', 'word-chain', 'crossword', 'boggle'] as const).map((id): EnglishGameModule => ({
    id,
    skill: 'Đang phát triển',
    todo: true,
    generateQuestion(level, random, topic) {
      const entry = vocabularyEntry(level, random, topic);
      return { id: questionId(id, random), mode: id, skill: this.skill, prompt: 'TODO: hoàn thiện dạng chơi này.', hint: '', answer: entry.word };
    },
    checkAnswer: () => false,
  })),
];

export const getEnglishGameModule = (id: EnglishModeId): EnglishGameModule => {
  const gameModule = ENGLISH_GAME_MODULES.find((item) => item.id === id);
  if (!gameModule || gameModule.todo) throw new Error(`Dạng chơi chưa sẵn sàng: ${id}`);
  return gameModule;
};
