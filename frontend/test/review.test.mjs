import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkPracticeAnswer } from '../src/review.ts';

test('practice uses the same whitespace and case normalization as server grading', () => {
  assert.equal(checkPracticeAnswer('  WILL   stay ', 'will stay'), true);
  assert.equal(checkPracticeAnswer('walk', 'walks'), false);
  assert.equal(checkPracticeAnswer(' APPLE ', 'apple'), true);
  assert.equal(checkPracticeAnswer('りんご', 'りんご'), true);
});
