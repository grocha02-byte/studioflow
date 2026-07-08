import React, { useState, useEffect } from 'react';
import { Shield, Building, Users, Database, CheckCircle, XCircle } from 'lucide-react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Empresa } from '../types';

export default function AdminPanel() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);

  useEffect(() => {
    const fetchEmpresas = async () => {
      const snap = await getDocs(collection(db, 'configuracoes'));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as any as Empresa));
      setEmpresas(list);
    };
    fetchEmpresas();
  }, []);

  const handleStatus = async (id: string, status: 'ativo' | 'bloqueado') => {
    await updateDoc(doc(db, 'configuracoes', id), { status });
    setEmpresas(prev => prev.map(e => e.id === id ? { ...e, status } : e));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="w-8 h-8 text-gold-600" />
        <h2 className="text-2xl font-serif font-bold text-gray-900">Painel Administrativo (Plataforma)</h2>
      </div>
      
      <div className="bg-white p-6 rounded-2xl border border-gold-100 shadow-xs">
        <h3 className="font-bold text-gray-800 mb-4">Empresas Cadastradas</h3>
        <div className="space-y-4">
          {empresas.map(empresa => (
            <div key={empresa.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-bold">{empresa.nome || 'Salão sem nome'}</p>
                <p className="text-xs text-gray-500">Status: {empresa.status || 'pendente'}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleStatus(empresa.id, 'ativo')} className="p-2 text-green-600"><CheckCircle className="w-5 h-5" /></button>
                <button onClick={() => handleStatus(empresa.id, 'bloqueado')} className="p-2 text-red-600"><XCircle className="w-5 h-5" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
