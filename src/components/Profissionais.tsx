/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  User, 
  Phone, 
  Percent, 
  X, 
  AlertCircle,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { Profissional, Agendamento } from '../types';

interface ProfissionaisProps {
  profissionais: Profissional[];
  agendamentos: Agendamento[];
  onAddProfissional: (p: Omit<Profissional, 'id'>) => void;
  onEditProfissional: (p: Profissional) => void;
  onDeleteProfissional: (id: string) => void;
}

export default function Profissionais({
  profissionais,
  agendamentos,
  onAddProfissional,
  onEditProfissional,
  onDeleteProfissional
}: ProfissionaisProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Estado do formulário
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProfissional, setEditingProfissional] = useState<Profissional | null>(null);

  // Campos do formulário
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [comissao, setComissao] = useState(40); // 40% padrão
  const [ativo, setAtivo] = useState(true);
  const [formError, setFormError] = useState('');

  // Filtrar profissionais pela busca
  const profissionaisFiltrados = profissionais.filter(p => 
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.telefone.includes(searchTerm)
  );

  // Abrir form para novo profissional
  const handleNewProfissional = () => {
    setEditingProfissional(null);
    setNome('');
    setTelefone('');
    setComissao(40);
    setAtivo(true);
    setFormError('');
    setIsFormOpen(true);
  };

  // Abrir form para editar profissional
  const handleEditClick = (p: Profissional) => {
    setEditingProfissional(p);
    setNome(p.nome);
    setTelefone(p.telefone);
    setComissao(p.comissao);
    setAtivo(p.ativo);
    setFormError('');
    setIsFormOpen(true);
  };

  // Salvar profissional
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setFormError('O campo Nome é obrigatório.');
      return;
    }
    if (!telefone.trim()) {
      setFormError('O campo Telefone é obrigatório.');
      return;
    }
    if (comissao < 0 || comissao > 100) {
      setFormError('A comissão deve ser um valor entre 0% e 100%.');
      return;
    }

    if (editingProfissional) {
      onEditProfissional({
        ...editingProfissional,
        nome,
        telefone,
        comissao,
        ativo
      });
    } else {
      onAddProfissional({
        nome,
        telefone,
        comissao,
        ativo
      });
    }

    setIsFormOpen(false);
    setEditingProfissional(null);
    setNome('');
    setTelefone('');
    setComissao(40);
    setAtivo(true);
  };

  // Confirmar e excluir profissional
  const handleDeleteClick = (p: Profissional) => {
    const totalAgendamentosDoProfissional = agendamentos.filter(a => a.profissionalId === p.id).length;
    let confirmMsg = `Tem certeza que deseja excluir o(a) profissional "${p.nome}"?`;
    if (totalAgendamentosDoProfissional > 0) {
      confirmMsg += `\nAVISO: Este(a) profissional possui ${totalAgendamentosDoProfissional} atendimento(s) vinculados. Seus registros não serão excluídos para manter a precisão dos faturamentos passados, mas ele(a) será removido(a) da lista de profissionais ativos para futuros agendamentos.`;
    }
    if (window.confirm(confirmMsg)) {
      onDeleteProfissional(p.id);
    }
  };

  // Alternar rapidamente status ativo/inativo
  const handleToggleStatus = (p: Profissional) => {
    onEditProfissional({
      ...p,
      ativo: !p.ativo
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-semibold text-gray-800">Profissionais</h2>
          <p className="text-sm text-gray-500">Cadastre a equipe do salão, defina suas comissões personalizadas e controle o status operacional.</p>
        </div>
        <button
          onClick={handleNewProfissional}
          className="bg-gold-500 hover:bg-gold-600 text-white font-medium px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-xs hover:shadow-md transition-all shrink-0"
        >
          <Plus className="w-5 h-5" />
          <span>Novo Profissional</span>
        </button>
      </div>

      {/* Tabela e Busca */}
      <div className="bg-white rounded-2xl border border-gold-100 shadow-xs overflow-hidden">
        
        {/* Busca */}
        <div className="p-5 border-b border-gold-50 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar profissional por nome ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gold-50/30 border border-gold-100 rounded-xl py-2.5 pl-10 pr-4 text-sm text-gray-800 placeholder-gray-400 focus:outline-hidden focus:border-gold-300 focus:bg-white transition-all"
            />
          </div>
        </div>

        {profissionaisFiltrados.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <User className="w-12 h-12 text-gold-200 mb-2" />
            <p className="text-base font-semibold text-gray-700">Nenhum profissional cadastrado</p>
            <p className="text-sm text-gray-400 mt-1">Cadastre profissionais para poder agendar serviços.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gold-50 bg-gold-50/20 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="p-4 pl-6">Profissional</th>
                  <th className="p-4">Telefone</th>
                  <th className="p-4">Comissão Padrão</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold-50/50">
                {profissionaisFiltrados.map((p) => (
                  <tr key={p.id} className={`text-sm hover:bg-gold-50/10 transition-colors ${!p.ativo ? 'opacity-65' : ''}`}>
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                          p.ativo ? 'bg-gold-100 text-gold-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {p.nome.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{p.nome}</p>
                          <p className="text-xs text-gray-400">ID: {p.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="flex items-center gap-1.5 text-xs text-gray-700">
                        <Phone className="w-3.5 h-3.5 text-gold-500" />
                        {p.telefone}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 bg-gold-50 text-gold-700 px-2.5 py-1 rounded-lg text-xs font-bold">
                        <Percent className="w-3 h-3 text-gold-500" />
                        {p.comissao}%
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleToggleStatus(p)}
                        className={`flex items-center gap-1.5 text-xs font-semibold rounded-full px-3 py-1 transition-all ${
                          p.ativo 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        title={p.ativo ? 'Clique para desativar' : 'Clique para ativar'}
                      >
                        {p.ativo ? (
                          <>
                            <ToggleRight className="w-4 h-4 text-green-600" />
                            <span>Ativo</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-4 h-4 text-gray-400" />
                            <span>Inativo</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditClick(p)}
                          title="Editar Profissional"
                          className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(p)}
                          title="Excluir Profissional"
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-gold-100 shadow-xl max-w-md w-full overflow-hidden animate-slide-up">
            
            {/* Header Form */}
            <div className="p-5 border-b border-gold-50 flex items-center justify-between">
              <h3 className="font-serif font-semibold text-lg text-gray-800">
                {editingProfissional ? 'Editar Profissional' : 'Novo Profissional'}
              </h3>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="p-6 space-y-4">
              
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Nome */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nome Completo *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: Amanda de Souza Oliveira"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full bg-gold-50/10 border border-gold-100 rounded-xl py-2 pl-9 pr-4 text-sm text-gray-800 focus:outline-hidden focus:border-gold-300 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Telefone */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Telefone *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: (11) 98888-8888"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    className="w-full bg-gold-50/10 border border-gold-100 rounded-xl py-2 pl-9 pr-4 text-sm text-gray-800 focus:outline-hidden focus:border-gold-300 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Comissão (%) */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Comissão (%) *</label>
                <div className="relative">
                  <Percent className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    required
                    min={0}
                    max={100}
                    placeholder="Ex: 40"
                    value={comissao}
                    onChange={(e) => setComissao(Number(e.target.value))}
                    className="w-full bg-gold-50/10 border border-gold-100 rounded-xl py-2 pl-9 pr-4 text-sm text-gray-800 focus:outline-hidden focus:border-gold-300 focus:bg-white transition-all"
                  />
                </div>
                <p className="text-[10px] text-gray-400">Porcentagem padrão que este profissional recebe sobre os serviços realizados.</p>
              </div>

              {/* Status Ativo / Inativo */}
              <div className="flex items-center justify-between p-3 bg-gold-50/30 rounded-xl border border-gold-50">
                <div>
                  <p className="text-xs font-semibold text-gray-700">Profissional Ativo(a)</p>
                  <p className="text-[10px] text-gray-400">Determina se pode receber novos agendamentos.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAtivo(!ativo)}
                  className="p-1 focus:outline-hidden"
                >
                  {ativo ? (
                    <ToggleRight className="w-8 h-8 text-gold-500" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-gray-300" />
                  )}
                </button>
              </div>

              {/* Ações do Form */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gold-50">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 font-semibold text-sm rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gold-500 hover:bg-gold-600 text-white font-semibold text-sm rounded-xl shadow-xs hover:shadow-md transition-all"
                >
                  Salvar Cadastro
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
