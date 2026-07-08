import React from 'react';
import { Building } from 'lucide-react';

export default function Marketplace() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Marketplace de Salões</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 border rounded-xl shadow-sm bg-white">
          <Building className="w-12 h-12 text-gold-500 mb-4" />
          <h3 className="font-bold text-lg">Salão Exemplo</h3>
          <p className="text-gray-500">Agende seu horário agora.</p>
        </div>
      </div>
    </div>
  );
}
