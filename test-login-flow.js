import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, deleteUser } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
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
const auth = getAuth(app);
const db = getFirestore(app, env.VITE_FIREBASE_DATABASE_ID);

async function run() {
  const email = `test${Date.now()}@example.com`;
  const password = "password123";
  const nome = "Test User";
  const salaoNome = "Test Salon";

  console.log("Creating user...", email);
  let userCred;
  try {
    userCred = await createUserWithEmailAndPassword(auth, email, password);
    console.log("User created:", userCred.user.uid);
  } catch (e) {
    console.error("Failed to create user:", e.message);
    process.exit(1);
  }

  const salaoId = `salao_${Date.now()}`;
  
  const newUser = {
    uid: userCred.user.uid,
    nome,
    email,
    role: 'admin',
    salaoId,
    ativo: true
  };

  try {
    console.log("Setting user doc...");
    await setDoc(doc(db, 'usuarios', userCred.user.uid), newUser);
    console.log("User doc set.");
  } catch (e) {
    console.error("Failed to set user doc:", e.message);
  }

  try {
    console.log("Setting configuracoes...");
    await setDoc(doc(db, 'configuracoes', salaoId), {
      salaoId,
      nomeSalao: salaoNome,
      theme: 'light',
    });
    console.log("Configuracoes set.");
  } catch (e) {
    console.error("Failed to set configuracoes:", e.message);
  }

  // Cleanup
  try {
    await deleteDoc(doc(db, 'configuracoes', salaoId));
    await deleteDoc(doc(db, 'usuarios', userCred.user.uid));
    await deleteUser(userCred.user);
    console.log("Cleanup done.");
  } catch(e) {
    console.log("Cleanup failed:", e.message);
  }

  process.exit(0);
}

run();
