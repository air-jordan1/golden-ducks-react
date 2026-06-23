import { db } from "./firebase";
import { map } from './BookIDMap';
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore";

/**
 * Parses the user's chosen Scripture reference.
 * @param {*} ref 
 * @returns 
 */
function parseReference(ref) {
  const t = ref.trim();
  const bookSlug = (b) => b.toLowerCase().replace(/\s+/g, '-');

  // Verse range: "John 1:1-7"
  const rangeMatch = t.match(/^(.+?)\s+(\d+):(\d+)-(\d+)$/);
  if (rangeMatch) return {
    type: 'range',
    book: bookSlug(rangeMatch[1]),
    chapter: rangeMatch[2],
    start: parseInt(rangeMatch[3]),
    end: parseInt(rangeMatch[4]),
  };

  // Single verse: "John 3:16"
  const verseMatch = t.match(/^(.+?)\s+(\d+):(\d+)$/);
  if (verseMatch) return {
    type: 'verse',
    book: bookSlug(verseMatch[1]),
    chapter: verseMatch[2],
    verse: verseMatch[3],
  };

  // Full chapter: "Proverbs 2"
  const chapterMatch = t.match(/^(.+?)\s+(\d+)$/);
  if (chapterMatch) return {
    type: 'chapter',
    book: bookSlug(chapterMatch[1]),
    chapter: chapterMatch[2],
  };

  return null;
}

/**
 * Converts parsed Scripture reference to USFM code.
 * @param {*} parsed 
 * @returns 
 */
function parsedRefToID(parsed) {
  let id = '';
  const book = map.get(parsed.book);
  const chapter = parsed.chapter;

  if (parsed.type === 'range') {
    id = `${book}.${chapter}.${parsed.start}-${book}.${chapter}.${parsed.end}`;
  }
  if (parsed.type === 'verse') {
    id = `${book}.${chapter}.${parsed.verse}`;
  }
  if (parsed.type === 'chapter') {
    id = `${book}.${chapter}`;
  }

  return id;
}

/**
 * Fetches the passage from the parsed reference.
 * @param {*} parsed 
 * @param {*} translation 
 * @returns 
 */
async function fetchPassage(parsed, translation) {

  const bibleId = await getTranslationId(translation);
  const base = `https://rest.api.bible/v1/bibles/${bibleId}`;
  const modifiers = `?content-type=text&include-notes=false&include-titles=false&include-chapter-numbers=false&include-verse-numbers=false&include-verse-spans=false`;
  const id = parsedRefToID(parsed);

  if (parsed.type === 'verse') {
    const res = await fetch(`${base}/verses/${id}${modifiers}`, { headers: { 'api-key': import.meta.env.VITE_BIBLE_API_KEY }});
    if (!res.ok) throw new Error();
    return (await res.json()).data.content.replace('¶', '');
  }

  if (parsed.type === 'range') {
    const res = await fetch(`${base}/passages/${id}${modifiers}`, { headers: { 'api-key': import.meta.env.VITE_BIBLE_API_KEY }});
    if (!res.ok) throw new Error();
    return (await res.json()).data.content.replace('¶', '');
  }

  if (parsed.type === 'chapter') {
    const res = await fetch(`${base}/chapters/${id}${modifiers}`, { headers: { 'api-key': import.meta.env.VITE_BIBLE_API_KEY }});
    if (!res.ok) throw new Error();
    return (await res.json()).data.content.replace('¶', '');
  }

  throw new Error();
}

// Clean verse numbers like [1], [2], etc.
function cleanVerseNumbers(text) {
  return text
  .replace(/\[[^\]]*\]/g, '') // Remove [1], [2], etc.
  .replace('¶', '')
  .replace(/\s+/g, ' ').trim(); // Clean up extra whitespace
}

/**
 * Gets the bibleId for the specified translation.
 * @param {*} abbrev 
 * @returns 
 */
async function getTranslationId(abbrev) {
    const q = await query(collection(db, "translations"), where("abbreviationLocal", "==", abbrev));
    const qSnapshot = await getDocs(q);
    if (!qSnapshot.empty) {
        return qSnapshot.docs[0].data().id;
    };
}

export async function fetchChaptersForBook(translation, bookId) {
  const bibleId = await getTranslationId(translation);
  const base = `https://rest.api.bible/v1/bibles/${bibleId}`;
  const res = await fetch(`${base}/books/${bookId}/chapters`, { headers: { 'api-key': import.meta.env.VITE_BIBLE_API_KEY }});
  if (!res.ok) throw new Error();
  const data = await res.json();
  return data.data.filter(c => c.number !== 'intro');
}

export async function fetchVersesForChapter(translation, chapterId) {
  const bibleId = await getTranslationId(translation);
  const base = `https://rest.api.bible/v1/bibles/${bibleId}`;
  const res = await fetch(`${base}/chapters/${chapterId}/verses`, { headers: { 'api-key': import.meta.env.VITE_BIBLE_API_KEY }});
  if (!res.ok) throw new Error();
  const data = await res.json();
  return data.data;
}

export async function getRandomVerse(translation, bookId = null, chapterId = null) {
  let finalBookId = bookId;
  let finalChapterId = chapterId;

  if (!finalBookId || finalBookId === 'ANY') {
    const uniqueBookIds = [...new Set(map.values())];
    finalBookId = uniqueBookIds[Math.floor(Math.random() * uniqueBookIds.length)];
  }

  if (!finalChapterId || finalChapterId === 'ANY') {
    const chapters = await fetchChaptersForBook(translation, finalBookId);
    if (chapters.length === 0) throw new Error("No chapters found");
    const randomChapter = chapters[Math.floor(Math.random() * chapters.length)];
    finalChapterId = randomChapter.id;
  }

  const verses = await fetchVersesForChapter(translation, finalChapterId);
  if (verses.length === 0) throw new Error("No verses found");
  const randomVerse = verses[Math.floor(Math.random() * verses.length)];

  const parsed = parseReference(randomVerse.reference);
  const text = await fetchPassage(parsed, translation);

  return {
    reference: randomVerse.reference,
    text: text
  };
}

export function generateDistractors(correctRef) {
  const match = correctRef.match(/^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/);
  if (!match) return [correctRef];

  const bookName = match[1];
  const chapter = parseInt(match[2]);
  const verse = parseInt(match[3]);

  const options = new Set([correctRef]);
  const books = ["Genesis", "Exodus", "Psalms", "Proverbs", "Isaiah", "Matthew", "Mark", "Luke", "John", "Romans", "1 Corinthians", "Ephesians", "James", "Revelation"];

  while (options.size < 4) {
    const rand = Math.random();
    let newRef = '';
    if (rand < 0.4) {
      const vDiff = Math.floor(Math.random() * 10) - 5;
      const v = Math.max(1, verse + (vDiff === 0 ? 1 : vDiff));
      newRef = `${bookName} ${chapter}:${v}`;
    } else if (rand < 0.8) {
      const cDiff = Math.floor(Math.random() * 5) - 2;
      const c = Math.max(1, chapter + (cDiff === 0 ? 1 : cDiff));
      newRef = `${bookName} ${c}:${verse}`;
    } else {
      const b = books[Math.floor(Math.random() * books.length)];
      newRef = `${b} ${chapter}:${verse}`;
    }
    
    if (newRef !== correctRef) {
      options.add(newRef);
    }
  }
  
  return Array.from(options).sort(() => Math.random() - 0.5);
}

export { parseReference, parsedRefToID, fetchPassage, getTranslationId }