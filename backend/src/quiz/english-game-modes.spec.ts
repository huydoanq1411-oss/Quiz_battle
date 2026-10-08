import { ENGLISH_GAME_MODULES, getEnglishGameModule } from './english-game-modes';
import { GRAMMAR, VOCABULARY } from './english-learning-bank';

describe('English learning modes', () => {
  it('contains at least 50 vocabulary entries and 20 grammar examples', () => {
    expect(VOCABULARY.length).toBeGreaterThanOrEqual(50);
    expect(GRAMMAR.length).toBeGreaterThanOrEqual(20);
  });

  it('covers every CEFR level in both question banks', () => {
    for (const level of ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const) {
      expect(VOCABULARY.some((entry) => entry.level === level)).toBe(true);
      expect(GRAMMAR.some((entry) => entry.level === level)).toBe(true);
    }
  });

  it('creates a reproducible Daily Challenge question from the same seed', () => {
    const mode = getEnglishGameModule('meaning-choice');
    const first = mode.generateQuestion('B1', () => 0.314159);
    const second = mode.generateQuestion('B1', () => 0.314159);
    expect(first).toEqual(second);
    expect(mode.checkAnswer(first, first.answer)).toBe(true);
    expect(ENGLISH_GAME_MODULES.filter((item) => item.todo)).toHaveLength(9);
  });
});