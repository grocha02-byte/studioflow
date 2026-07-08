import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, setDoc, getDoc, doc, deleteDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function runTest() {
  try {
    const email = "master@studioflow.com";
    const password = "admin123";
    let userCredential;

    console.log("Authenticating with Email/Password...");
    try {
      userCredential = await signInWithEmailAndPassword(auth, email, password);
    } catch(e) {
      if (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential' || e.code === 'auth/invalid-login-credentials') {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log("User created.");
      } else {
        throw e;
      }
    }

    const uid = userCredential.user.uid;
    console.log("Authenticated with UID:", uid);

    console.log("Creating user document...");
    const salaoId = "salao_master_1";
    const userRef = doc(db, 'usuarios', uid);
    await setDoc(userRef, {
      uid: uid,
      nome: "Master Admin",
      email: email,
      role: "admin",
      perfil: "admin",
      salaoId: salaoId,
      ativo: true
    });
    console.log("User doc created.");

    console.log("Testing Firestore Write...");
    const docRef = await addDoc(collection(db, 'clientes'), {
      salaoId: salaoId,
      nome: 'Cliente Teste Integração',
      telefone: '11999999999',
      dataCadastro: new Date().toISOString()
    });
    console.log("Doc created with ID:", docRef.id);

    console.log("Testing Firestore Read...");
    const snap = await getDoc(docRef);
    console.log("Read success:", snap.data());

    console.log("Testing Firestore Delete...");
    await deleteDoc(docRef);
    console.log("Delete success!");

    process.exit(0);
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  }
}
runTest();
