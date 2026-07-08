import React from 'react';
import { ContaReceber, Cliente } from '../types';

interface ContasReceberProps {
  contas: ContaReceber[];
  clientes: Cliente[];
  onUpdateConta: (conta: ContaReceber) => Promise<void>;
  onAddCaixaTransacao: (tx: any) => Promise<void>;
  onNavigateToClient: (clienteId: string) => void;
}

export default function ContasReceberModule({
  contas,
  clientes,
  onUpdateConta,
  onAddCaixaTransacao,
  onNavigateToClient
}: ContasReceberProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-serif font-bold text-gray-900">Contas a Receber</h2>
      <div className="bg-white p-6 rounded-xl border border-gold-100 shadow-sm">
        <p className="text-gray-500">Módulo de Contas a Receber integrado.</p>
      </div>
    </div>
  );
}
