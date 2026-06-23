export const SRS_LEVELS = {
  0: { name: 'Learning', hours: 12 },
  1: { name: 'Familiar', hours: 24 }, // 1 day
  2: { name: 'Familiar', hours: 72 }, // 3 days
  3: { name: 'Familiar', hours: 168 }, // 7 days
  4: { name: 'Mastered', hours: 336 }, // 14 days
  5: { name: 'Mastered', hours: 720 }, // 30 days
};

export const calculateNextReview = (currentLevel, accuracy) => {
  let newLevel = currentLevel || 0;

  // Bump level based on accuracy
  if (accuracy >= 95) {
    newLevel = Math.min(newLevel + 1, 5);
  } else if (accuracy < 80) {
    newLevel = Math.max(newLevel - 1, 0);
  }
  // if accuracy between 80-94, keep same level

  const hoursToAdd = SRS_LEVELS[newLevel].hours;
  const nextReviewDate = new Date(Date.now() + hoursToAdd * 60 * 60 * 1000);

  return { newLevel, nextReviewDate: nextReviewDate.toISOString() };
};

export const getPipelineCategory = (level) => {
  if (level <= 0) return 'Learning';
  if (level <= 3) return 'Familiar';
  return 'Mastered';
};
