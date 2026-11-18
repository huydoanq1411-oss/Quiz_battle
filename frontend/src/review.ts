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

export const checkPracticeAnswer = (answer: string, correct: string) => {
  const normalize = (value: string) => value.trim().toLocaleLowerCase('en-US').replace(/\s+/g, ' ');
  return normalize(answer) === normalize(correct);
};
