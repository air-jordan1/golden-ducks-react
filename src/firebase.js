
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC8ZYUE-3-bBiQerxs-HYfN6cTV1QUr-q4",
  authDomain: "scripturize-36b25.firebaseapp.com",
  projectId: "scripturize-36b25",
  storageBucket: "scripturize-36b25.firebasestorage.app",
  messagingSenderId: "601534847502",
  appId: "1:601534847502:web:261e4207b71c9590bafa5f",
  measurementId: "G-LRMY7FFZRW"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

export { auth, provider, db };
