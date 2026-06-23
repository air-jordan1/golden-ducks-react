
import { auth, db } from "./firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

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

export { getPreferredTranslation, setPreferredTranslation };