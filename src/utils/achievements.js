import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';

export const BADGES = {
  first_drill: { id: 'first_drill', title: 'First Step', description: 'Completed your first drill' },
  streak_7: { id: 'streak_7', title: 'The Consistent', description: 'Achieve a 7-day streak' },
  speed_demon: { id: 'speed_demon', title: 'Speed Demon', description: 'Type at over 60 WPM with 100% accuracy' },
  chapter_champion: { id: 'chapter_champion', title: 'Chapter Champion', description: 'Memorize all verses in a chapter' },
  book_champion: { id: 'book_champion', title: 'Book Champion', description: 'Memorize all verses in an entire book' },
  daily_faithful: { id: 'daily_faithful', title: 'Daily Faithful', description: 'Complete a Daily Global Challenge' },
};

export async function checkAndAwardAchievements(userUid, profile, drillData) {
  if (!profile) return;
  const earned = profile.achievements || [];
  const newAchievements = [];

  // 1. First drill
  if (!earned.includes('first_drill')) {
    newAchievements.push('first_drill');
  }

  // 2. 7-day streak
  if (!earned.includes('streak_7') && profile.currentStreak >= 7) {
    newAchievements.push('streak_7');
  }

  // 3. Speed Demon
  if (!earned.includes('speed_demon') && drillData.wpm >= 60 && drillData.accuracy === 100) {
    newAchievements.push('speed_demon');
  }

  // 4. Daily Faithful
  if (!earned.includes('daily_faithful') && drillData.isDailyChallenge) {
    newAchievements.push('daily_faithful');
  }

  // 5. Chapter & Book Champion (Dynamic API Check)
  if ((!earned.includes('chapter_champion') || !earned.includes('book_champion')) && drillData.reference) {
    try {
      const { parseReference, fetchVersesForChapter, fetchChaptersForBook } = await import('../Passage.js');
      const { map } = await import('../BookIDMap.js');
      const parsed = parseReference(drillData.reference);
      
      if (parsed) {
        const bookId = map.get(parsed.book);
        const chapterId = `${bookId}.${parsed.chapter}`;
        
        // Count user's memorized verses in this chapter
        const memorizedVerses = profile.memorizedVerses || [];
        const memorizedInChapter = memorizedVerses.filter(v => v.toLowerCase().startsWith(`${parsed.book.replace(/-/g, ' ')} ${parsed.chapter}:`));
        
        // Fetch total verses from API
        const verses = await fetchVersesForChapter(profile.preferredTranslation || 'KJV', chapterId);
        const totalVersesInChapter = verses.length;
        
        if (totalVersesInChapter > 0 && memorizedInChapter.length >= totalVersesInChapter) {
          if (!earned.includes('chapter_champion')) newAchievements.push('chapter_champion');
          
          // Check Book Champion ONLY if chapter was just finished (optimization)
          if (!earned.includes('book_champion')) {
            const chapters = await fetchChaptersForBook(profile.preferredTranslation || 'KJV', bookId);
            let bookIsMemorized = true;
            for (const ch of chapters) {
              const chVerses = await fetchVersesForChapter(profile.preferredTranslation || 'KJV', ch.id);
              const chNum = ch.id.split('.')[1];
              const memInCh = memorizedVerses.filter(v => v.toLowerCase().startsWith(`${parsed.book.replace(/-/g, ' ')} ${chNum}:`)).length;
              if (memInCh < chVerses.length) {
                bookIsMemorized = false;
                break;
              }
            }
            if (bookIsMemorized) newAchievements.push('book_champion');
          }
        }
      }
    } catch (err) {
      console.error("Error checking chapter/book champion:", err);
    }
  }

  if (newAchievements.length > 0) {
    const userRef = doc(db, 'users', userUid);
    await updateDoc(userRef, {
      achievements: arrayUnion(...newAchievements)
    });
  }

  return newAchievements;
}
