import { initialVocabulary } from './initialVocabulary.js';
import { vocabularyLevels2to5 } from './vocabularyLevels2to5.js';
import { vocabularyLevels3to5 } from './vocabularyLevels3to5.js';

export const allVocabulary = [
  ...initialVocabulary,
  ...vocabularyLevels2to5,
  ...vocabularyLevels3to5
];
