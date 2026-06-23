// Normalize text to a common format for comparison (lowercase, remove punctuation, trim)
export function norm(text) {
  return text
    .toLowerCase()
    .normalize('NFD')                   // Decompose accented characters (built in normalize function)
    .replace(/[\u0300-\u036f]/g, '')    // Remove diacritical marks
    .replace(/[^\w\s]/g, '')
    .trim();
}

// Longest Common Subsequence (LCS) accuracy
export function lcsAccuracy(targetWords, typedWords) {
  const n = targetWords.length;
  const m = typedWords.length;
  if (!n) return 0;
  const dp = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      dp[i][j] = targetWords[i - 1] === typedWords[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return Math.round((dp[n][m] / n) * 100);
}

export function calcAccuracyDefault(typed, target) {
  return lcsAccuracy(
    norm(target).split(/\s+/).filter(Boolean),
    norm(typed).split(/\s+/).filter(Boolean)
  );
}


export function getMissedWords(typed, target) {
  const targetWords = norm(target).split(/\s+/).filter(Boolean);
  const typedWords = norm(typed).split(/\s+/).filter(Boolean);
  const missed = [];
  for (const w of targetWords) {
    const idx = typedWords.indexOf(w);
    if (idx !== -1) {
      typedWords.splice(idx, 1);
    } else {
      missed.push(w);
    }
  }
  return missed;
}

export function calcAccuracyOverlay(typed, target) {
  return lcsAccuracy(
    target.split(/\s+/).filter(Boolean),
    typed.split(/\s+/).filter(Boolean)
  );
}

// Converts a string like "John 3:16" to a safe string like "john_3_16"
export function getProgressKey(reference) {
  return reference.replace(/[\s:.]/g, '_');
}
