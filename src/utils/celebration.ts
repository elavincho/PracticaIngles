import confetti from 'canvas-confetti';

/**
 * Triggers a multi-stage celebratory confetti and particle animation sequence
 * when a user completes a level or activity section.
 */
export const triggerLevelCelebration = () => {
  // 1. Initial central burst with vivid colors
  confetti({
    particleCount: 90,
    spread: 80,
    origin: { y: 0.6 },
    colors: ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6'],
    disableForReducedMotion: true,
  });

  // 2. Left side cannon burst after 200ms
  setTimeout(() => {
    confetti({
      particleCount: 60,
      angle: 60,
      spread: 60,
      origin: { x: 0.05, y: 0.65 },
      colors: ['#6366f1', '#10b981', '#f59e0b', '#ec4899'],
      disableForReducedMotion: true,
    });
  }, 200);

  // 3. Right side cannon burst after 400ms
  setTimeout(() => {
    confetti({
      particleCount: 60,
      angle: 120,
      spread: 60,
      origin: { x: 0.95, y: 0.65 },
      colors: ['#6366f1', '#10b981', '#f59e0b', '#ec4899'],
      disableForReducedMotion: true,
    });
  }, 400);

  // 4. Golden fireworks top burst after 650ms
  setTimeout(() => {
    confetti({
      particleCount: 50,
      spread: 100,
      origin: { x: 0.5, y: 0.35 },
      colors: ['#fbbf24', '#f59e0b', '#fef08a', '#ffffff'],
      scalar: 1.2,
      disableForReducedMotion: true,
    });
  }, 650);
};
