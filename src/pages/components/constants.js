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
export const TRANSLATIONS = {
  ASV: 'ASV — American Standard Version',
  CSB: 'CSB - Christian Standard Bible',
  KJV: 'KJV — King James Version',
  NIV: 'NIV - New International Version',
  NLT: 'NLT - New Living Translation',
  JND: 'JND - French J. N. Darby Translation',
  ELO: 'ELO - German Unrevised Elberfelder Translation',
  VBL: 'VBL - Spanish Free Translation',
  BLT: 'BLT - Portuguese Free Translation',
};
export const TRANSLATIONS_CONCISE = {
  ASV: 'ASV',
  CSB: 'CSB',
  KJV: 'KJV',
  NIV: 'NIV',
  NLT: 'NLT',
  JND: 'JND',
  ELO: 'ELO',
  VBL: 'VBL',
  BLT: 'BLT',
};

export default maxLevel;