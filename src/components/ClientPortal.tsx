import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Agendamento, Cliente } from '../types';

export default function ClientPortal() {
  const { usuarioData } = useAuth();
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);

  useEffect(() => {
    if (usuarioData?.id) {
      const fetchAgendamentos = async () => {
        const q = query(collection(db, 'agendamentos'), where('clienteId', '==', usuarioData.id));
        const snap = await getDocs(q);
        setAgendamentos(snap.docs.map(d => ({ id: d.id, ...d.data() } as Agendamento)));
      };
      fetchAgendamentos();
    }
  }, [usuarioData]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Portal do Cliente</h2>
      <div className="space-y-4">
        {agendamentos.map(a => (
          <div key={a.id} className="p-4 border rounded">
            <p>Data: {a.data} - {a.hora}</p>
            <p>Status: {a.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
