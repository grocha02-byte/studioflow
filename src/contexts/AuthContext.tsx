import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, getDocFromCache, getDocFromServer, setDoc, onSnapshot } from 'firebase/firestore';
import { Usuario } from '../types';

interface AuthContextType {
  user: FirebaseUser | null;
  usuarioData: Usuario | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

const AuthContext = createContext<AuthContextType>({ user: null, usuarioData: null, loading: true, error: null, retry: () => {} });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [usuarioData, setUsuarioData] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let unsubUserDoc: (() => void) | undefined;
    let isMounted = true;

    const loadUser = async (firebaseUser: FirebaseUser) => {
      try {
        const userDocRef = doc(db, 'usuarios', firebaseUser.uid);
        
        // Tentativa 1: Forçar leitura do servidor
        let userDoc;
        try {
          userDoc = await getDocFromServer(userDocRef);
        } catch (serverErr) {
          console.warn("getDocFromServer failed, falling back to getDoc", serverErr);
          userDoc = await getDoc(userDocRef);
        }

        if (!userDoc.exists()) {
          console.log("Documento do usuário não existe, criando...");
          const salaoId = `salao_${Date.now()}`;
          const newUser = {
            uid: firebaseUser.uid,
            nome: firebaseUser.displayName || 'Proprietário',
            email: firebaseUser.email || '',
            role: 'proprietario',
            salaoId,
            ativo: true
          };
          
          await setDoc(userDocRef, newUser);
          
          await setDoc(doc(db, 'configuracoes', salaoId), {
            salaoId,
            nomeSalao: 'Meu Salão (Auto)',
            theme: 'light',
            primaryColor: '#D8B780',
            secondaryColor: '#1F2937',
            accentColor: '#FBBF24',
            endereco: '',
            telefone: ''
          });
          
          if (isMounted) setUsuarioData({ id: firebaseUser.uid, ...newUser } as Usuario);
        } else {
          if (isMounted) setUsuarioData({ id: userDoc.id, ...userDoc.data() } as Usuario);
        }

        // Configurar listener após garantir que existe
        if (isMounted) {
          unsubUserDoc = onSnapshot(userDocRef, (snap) => {
             if (snap.exists()) {
               setUsuarioData({ id: snap.id, ...snap.data() } as Usuario);
             }
          });
          setLoading(false);
          setError(null);
        }

      } catch (err: any) {
        console.error("Erro crítico ao carregar usuário:", err);
        if (isMounted) {
          setError(err.message || "Erro desconhecido ao carregar dados do usuário.");
          setLoading(false);
        }
      }
    };

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (isMounted) setUser(firebaseUser);
      
      if (unsubUserDoc) {
        unsubUserDoc();
        unsubUserDoc = undefined;
      }

      if (firebaseUser) {
        if (isMounted) {
          setLoading(true);
          setError(null);
        }
        loadUser(firebaseUser);
      } else {
        if (isMounted) {
          setUsuarioData(null);
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribeAuth();
      if (unsubUserDoc) unsubUserDoc();
    };
  }, [retryCount]);

  const retry = () => {
    setLoading(true);
    setError(null);
    setRetryCount(c => c + 1);
  };

  return (
    <AuthContext.Provider value={{ user, usuarioData, loading, error, retry }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
