import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc, collection, getDocs } from "firebase/firestore";
import fs from "fs";

const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...rest] = line.trim().split('=');
  const val = rest.join('=');
  if (key) acc[key] = val;
  return acc;
}, {});

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, env.VITE_FIREBASE_DATABASE_ID);

async function check() {
  const usersSnap = await getDocs(collection(db, "usuarios"));
  console.log("Users:", usersSnap.docs.map(d => ({id: d.id, ...d.data()})));
  process.exit(0);
}
check();
