// Utility for tracking word failure counts locally and in backend database

export interface WordFailMap {
  [word: string]: number;
}

const LOCAL_FAILURES_KEY = 'vocab_word_failures';

export function getLocalWordFailures(): WordFailMap {
  try {
    const raw = localStorage.getItem(LOCAL_FAILURES_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading local word failures:', e);
  }
  return {};
}

export function recordWordFailure(word: string): WordFailMap {
  if (!word) return getLocalWordFailures();

  const failures = getLocalWordFailures();
  const normalizedWord = word.trim();
  failures[normalizedWord] = (failures[normalizedWord] || 0) + 1;

  try {
    localStorage.setItem(LOCAL_FAILURES_KEY, JSON.stringify(failures));
  } catch (e) {
    console.error('Error saving local word failures:', e);
  }

  // Attempt backend update non-blocking
  try {
    const API_BASE = (import.meta as any).env?.VITE_API_URL || '/api';
    fetch(`${API_BASE}/vocab/fail-word`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word: normalizedWord })
    }).catch(() => {});
  } catch (e) {
    // Ignore network error in offline mode
  }

  return failures;
}
