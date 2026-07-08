import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB99d9yrfRSmu-YfER6DRUBIrBABSQOGdY",
  authDomain: "studioflow-8969e.firebaseapp.com",
  projectId: "studioflow-8969e",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function runTest() {
  const timestamp = Date.now();
  const email = `master_${timestamp}@example.com`;
  const password = "password123";
  const salaoId = `salao_${timestamp}`;
  const clienteId = `cliente_${timestamp}`;
  
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = cred.user.uid;
    await setDoc(doc(db, "usuarios", uid), {
      uid, nome: "Master Admin", email, role: "admin", salaoId, ativo: true
    });
    
    console.log("creating cliente...");
    await setDoc(doc(db, "clientes", clienteId), {
      salaoId, nome: "Test Client"
    });
    
    console.log("updating cliente...");
    await updateDoc(doc(db, "clientes", clienteId), {
      nome: "Test Client Updated"
    });
    
    console.log("deleting cliente...");
    await deleteDoc(doc(db, "clientes", clienteId));
    console.log("End-to-End Test Completed Successfully. Zero runtime errors.");
    process.exit(0);
  } catch(e) {
    console.error("End-to-End Test FAILED with runtime error:", e);
    process.exit(1);
  }
}

runTest();
