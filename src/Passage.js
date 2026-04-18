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

export { parseReference, parsedRefToID, fetchPassage, getTranslationId }