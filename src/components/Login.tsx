import React, { useState } from 'react';
import { auth, db } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Sparkles } from 'lucide-react';
import { Usuario } from '../types';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  
  // Registration extras
  const [nome, setNome] = useState('');
  const [salaoNome, setSalaoNome] = useState('');


  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Check if user doc exists
      const { getDoc } = await import('firebase/firestore');
      const userDocRef = doc(db, 'usuarios', result.user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        const empresaId = `empresa_${Date.now()}`;
        const salaoId = `salao_${Date.now()}`;
        
        const newUser: Omit<Usuario, 'id'> = {
          uid: result.user.uid,
          nome: result.user.displayName || 'Usuário Google',
          email: result.user.email || '',
          role: 'admin',
          salaoId,
          empresaId,
          ativo: true
        };
        await setDoc(userDocRef, newUser);
        
        await setDoc(doc(db, 'configuracoes', salaoId), {
          salaoId,
          empresaId,
          nomeSalao: 'Meu Salão',
          theme: 'light',
          primaryColor: '#D8B780',
          secondaryColor: '#1F2937',
          accentColor: '#FBBF24',
          endereco: '',
          telefone: ''
        });
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro no login com Google');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        if (!nome || !salaoNome) {
          throw new Error('Preencha todos os campos.');
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const empresaId = `empresa_${Date.now()}`;
        const salaoId = `salao_${Date.now()}`;
        
        // Crate user doc
        const newUser: Omit<Usuario, 'id'> = {
          uid: userCredential.user.uid,
          nome,
          email,
          role: 'admin',
          salaoId,
          empresaId,
          ativo: true
        };
        await setDoc(doc(db, 'usuarios', userCredential.user.uid), newUser);
        
        // Initialize default configuracao
        await setDoc(doc(db, 'configuracoes', salaoId), {
          salaoId,
          empresaId,
          nomeSalao: salaoNome,
          theme: 'light',
          primaryColor: '#D8B780',
          secondaryColor: '#1F2937',
          accentColor: '#FBBF24',
          endereco: '',
          telefone: ''
        });
        
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError('O login por E-mail/Senha não está ativado no Firebase. Por favor, ative-o no console do Firebase Authentication.');
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('E-mail ou senha incorretos.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Este e-mail já está cadastrado.');
      } else {
        setError(err.message || 'Erro de autenticação');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F6] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-gold-100">
        <div className="p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-gold-400 to-gold-600 text-white flex items-center justify-center shadow-lg mb-4">
              <Sparkles className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-gray-900 text-center">StudioFlow</h1>
            <p className="text-sm text-gray-500 uppercase tracking-widest mt-1">Gestão Inteligente</p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Seu Nome</label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full bg-gold-50/10 border border-gold-100 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-gold-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Nome do Salão</label>
                  <input
                    type="text"
                    required
                    value={salaoNome}
                    onChange={(e) => setSalaoNome(e.target.value)}
                    className="w-full bg-gold-50/10 border border-gold-100 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-gold-300"
                  />
                </div>
              </>
            )}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gold-50/10 border border-gold-100 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-gold-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Senha</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gold-50/10 border border-gold-100 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-gold-300"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-shadow mt-4"
            >
              {loading ? 'Aguarde...' : (isRegister ? 'Criar Conta' : 'Entrar')}
            </button>
          </form>


          <div className="mt-6 flex flex-col gap-3">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative bg-white px-4 text-xs text-gray-400 uppercase tracking-widest font-semibold">
                Ou
              </div>
            </div>
            
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
                <path fill="none" d="M1 1h22v22H1z" />
              </svg>
              Entrar com Google
            </button>
          </div>
          <div className="mt-6 text-center">
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-sm text-gold-600 font-medium hover:text-gold-700 transition-colors"
            >
              {isRegister ? 'Já tenho uma conta. Fazer login' : 'Não tem uma conta? Cadastre-se'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
