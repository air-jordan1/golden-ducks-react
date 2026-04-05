import { addDoc, collection } from "firebase/firestore";

async function getBibles() {
    const response = await fetch('https://rest.api.bible/v1/bibles', {
        headers: {
            'api-key': process.env.BIBLE_API_KEY
        }
    })

    const bibles = await response.json();

    const bibleData = bibles.data;

    try {
        const list = await addDoc(collection(db, "translations"), bibleData);
        console.log("Doc ID: ", list.id);
    } catch (e) {
        console.error("Error, lol: ", e);
    };
}