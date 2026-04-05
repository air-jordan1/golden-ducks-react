import { addDoc, collection } from "firebase/firestore";
import { db } from './firebase';

async function getBibles() {
    const response = await fetch('https://rest.api.bible/v1/bibles', {
        headers: {
            'api-key': import.meta.env.VITE_BIBLE_API_KEY
        }
    })

    const bibles = await response.json();

    const bibleData = bibles.data;

    for (let i = 0; i < bibleData.length; i++) {
        try {
            const list = await addDoc(collection(db, "translations"), bibleData[i]);
            console.log("Doc ID: ", list.id);
        } catch (e) {
            console.error("Error, lol: ", e);
        };
    }
}

// getBibles();