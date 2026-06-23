export const DAILY_VERSES = [
  "John 3:16", // 1st
  "Romans 8:28", // 2nd
  "Philippians 4:13", // 3rd
  "Proverbs 3:5", // 4th
  "Jeremiah 29:11", // 5th
  "Isaiah 41:10", // 6th
  "Romans 12:2", // 7th
  "Matthew 28:19", // 8th
  "Philippians 4:6", // 9th
  "Joshua 1:9", // 10th
  "Romans 12:1", // 11th
  "Matthew 6:33", // 12th
  "Hebrews 11:1", // 13th
  "Romans 3:23", // 14th
  "Proverbs 3:6", // 15th
  "Romans 5:8", // 16th
  "Romans 6:23", // 17th
  "Genesis 1:1", // 18th
  "Psalm 23:1", // 19th
  "John 14:6", // 20th
  "Galatians 5:22", // 21st
  "1 Corinthians 13:4", // 22nd
  "Ephesians 2:8", // 23rd
  "2 Timothy 3:16", // 24th
  "Psalm 119:105", // 25th
  "Isaiah 53:5", // 26th
  "Matthew 11:28", // 27th
  "1 Peter 5:7", // 28th
  "James 1:5", // 29th
  "Hebrews 12:2", // 30th
  "Revelation 21:4" // 31st
];

export function getVerseOfTheDay() {
  const dayOfMonth = new Date().getDate(); // 1 to 31
  return DAILY_VERSES[dayOfMonth - 1];
}
