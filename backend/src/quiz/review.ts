import type { EnglishGameQuestion } from './english-game-modes';

export interface ReviewItem {
  id: string;
  number: number;
  mode: string;
  skill: string;
  prompt: string;
  options?: string[];
  letters?: string[];
  spokenText?: string;
  answerLength?: number;
  submittedAnswers: string[];
  correctAnswer: string;
  explanation: string;
  reason: 'wrong' | 'unanswered';
}

export function makeReviewItem(question: EnglishGameQuestion, index: number, answers: string[], reason: ReviewItem['reason']): ReviewItem {
  return {
    id: `${question.id}:${index}`, number: index + 1, mode: question.mode,
    skill: question.skill, prompt: question.prompt, options: question.options,
    letters: question.letters, spokenText: question.spokenText, answerLength: question.answerLength,
    submittedAnswers: answers, correctAnswer: question.answer,
    explanation: question.explanation ?? `Đáp án cần ghi nhớ: “${question.answer}”.`, reason,
  };
}
