import { useEffect, useState } from 'react';
import { auth, db } from "./firebase";
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore";

async function getPreferredTranslation() {
    const user = auth.currentUser;
    if (!user) return;
    return getDoc(doc(db, "users", user.uid))
      .then(snap => {
        if (snap.exists() && snap.data().preferredTranslation) {
            return snap.data().preferredTranslation;
        }
      })
      .catch(console.error);
}

async function setPreferredTranslation(val) {
  const user = auth.currentUser;
  try {
      await updateDoc(doc(db, "users", user.uid), { preferredTranslation: val });
  } catch (err) {
      console.error("Error saving translation:", err);
  }
}

async function getTranslationId(abbrev) {
    const q = await query(collection(db, "translations"), where("abbreviationLocal", "==", abbrev));
    const qSnapshot = await getDocs(q);
    if (!qSnapshot.empty) {
      return qSnapshot.docs[0].data().id;
    };
}

export { getPreferredTranslation, setPreferredTranslation, getTranslationId };