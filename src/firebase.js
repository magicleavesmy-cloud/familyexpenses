import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyABrQ5hPjmafp-klwdyW0m_ZM_aWh5wVZw",
  authDomain: "duitku-57d7c.firebaseapp.com",
  projectId: "duitku-57d7c",
  storageBucket: "duitku-57d7c.firebasestorage.app",
  messagingSenderId: "416161520546",
  appId: "1:416161520546:web:d7bae10ea5688f0a7130fb"
};

const familyId = "adam-fatihah";
const firebaseEnabled = true;
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, familyId, firebaseEnabled };
