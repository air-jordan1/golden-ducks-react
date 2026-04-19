export const maxLevel = 4;
export const COMPLETION_THRESHOLD = 90;
export const STATES = {
  INTRO: 'intro',
  RUNNING: 'running',
  RESULTS: 'results'
};
export const levelDescriptions = [
  { level: 1, label: 'Level 1', desc: 'Full verse shown — type it out' },
  { level: 2, label: 'Level 2', desc: '30% of words hidden — fill in the blanks' },
  { level: 3, label: 'Level 3', desc: '66% of words hidden — fill in the blanks' },
  { level: maxLevel, label: `Level ${maxLevel}`, desc: 'No verse shown — type from memory' },
];

export default maxLevel;