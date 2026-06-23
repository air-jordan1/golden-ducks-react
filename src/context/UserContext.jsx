import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (authUser) => {
      setUser(authUser);
      if (authUser) {
        // Subscribe to user profile changes
        const userRef = doc(db, 'users', authUser.uid);
        const unsubscribeDoc = onSnapshot(userRef, async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const { isYesterday, formatISO } = await import('date-fns');
            const todayISO = formatISO(new Date(), { representation: 'date' });
            
            // Check if streak needs updating
            if (data.lastActiveDate !== todayISO) {
              let newStreak = data.currentStreak || 0;
              let newLongest = data.longestStreak || 0;

              if (data.lastActiveDate && isYesterday(new Date(data.lastActiveDate + 'T12:00:00'))) {
                newStreak += 1;
              } else {
                newStreak = 1;
              }
              if (newStreak > newLongest) newLongest = newStreak;

              // This update will trigger onSnapshot again, but lastActiveDate will match todayISO
              updateDoc(userRef, {
                lastActiveDate: todayISO,
                currentStreak: newStreak,
                longestStreak: newLongest,
                drillsToday: 0
              });
            }
            
            setProfile(docSnap.data());
          } else {
            setProfile(null);
          }
          setLoading(false);
        });
        return () => unsubscribeDoc();
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const updatePreferredTranslation = async (translation) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), { preferredTranslation: translation });
      // The onSnapshot will automatically update the profile state
    } catch (err) {
      console.error("Error updating translation:", err);
    }
  };

  const value = {
    user,
    profile,
    loading,
    updatePreferredTranslation
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
