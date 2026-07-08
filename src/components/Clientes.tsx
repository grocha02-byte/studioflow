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
  History, 
  User, 
  Phone, 
  Mail, 
  FileText, 
  Calendar, 
  X, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { Cliente, Agendamento, Profissional, Servico } from '../types';

interface ClientesProps {
  clientes: Cliente[];
  agendamentos: Agendamento[];
  profissionais: Profissional[];
  servicos: Servico[];
  onAddCliente: (c: Omit<Cliente, 'id' | 'dataCadastro'>) => void;
  onEditCliente: (c: Cliente) => void;
  onDeleteCliente: (id: string) => void;
}

export default function Clientes({
  clientes,
  agendamentos,
  profissionais,
  servicos,
  onAddCliente,
  onEditCliente,
  onDeleteCliente
}: ClientesProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado para formulário
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  
  // Campos do formulário
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [formError, setFormError] = useState('');

  // Estado para histórico do cliente
  const [viewingHistoricoCliente, setViewingHistoricoCliente] = useState<Cliente | null>(null);

  // Filtrar clientes pela busca
  const clientesFiltrados = clientes.filter(c => 
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.telefone.includes(searchTerm) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Abrir formulário para novo cliente
  const handleNewCliente = () => {
    setEditingCliente(null);
    setNome('');
    setTelefone('');
    setEmail('');
    setObservacoes('');
    setFormError('');
    setIsFormOpen(true);
  };

  // Abrir formulário para editar cliente
  const handleEditClick = (c: Cliente) => {
    setEditingCliente(c);
    setNome(c.nome);
    setTelefone(c.telefone);
    setEmail(c.email);
    setObservacoes(c.observacoes);
    setFormError('');
    setIsFormOpen(true);
  };

  // Salvar cliente (salva ou edita)
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

    if (editingCliente) {
      onEditCliente({
        ...editingCliente,
        nome,
        telefone,
        email,
        observacoes
      });
    } else {
      onAddCliente({
        nome,
        telefone,
        email,
        observacoes
      });
    }

    setIsFormOpen(false);
    setEditingCliente(null);
    setNome('');
    setTelefone('');
    setEmail('');
    setObservacoes('');
  };

  // Confirmar e excluir cliente
  const handleDeleteClick = (c: Cliente) => {
    const totalAgendamentosDoCliente = agendamentos.filter(a => a.clienteId === c.id).length;
    let confirmMsg = `Tem certeza que deseja excluir a cliente "${c.nome}"?`;
    if (totalAgendamentosDoCliente > 0) {
      confirmMsg += `\nAVISO: Esta cliente possui ${totalAgendamentosDoCliente} agendamento(s) cadastrado(s). Os registros associados continuarão no histórico de faturamento mas perderão o vínculo ativo.`;
    }
    if (window.confirm(confirmMsg)) {
      onDeleteCliente(c.id);
    }
  };

  // Obter o histórico de agendamentos de um determinado cliente
  const getClienteAgendamentos = (clienteId: string) => {
    return agendamentos
      .filter(a => a.clienteId === clienteId)
      .sort((a, b) => {
        // Ordenar por data decrescente e hora decrescente
        const dateCompare = b.data.localeCompare(a.data);
        if (dateCompare !== 0) return dateCompare;
        return b.hora.localeCompare(a.hora);
      });
  };

  // Auxiliares para histórico
  const getProfissionalNome = (id: string) => {
    const p = profissionais.find(item => item.id === id);
    return p ? p.nome : 'Profissional Desconhecido';
  };

  const getServicoNome = (id: string) => {
    const s = servicos.find(item => item.id === id);
    return s ? s.nome : 'Serviço Desconhecido';
  };

  const formatCurrency = (val?: number) => {
    if (val === undefined) return '—';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-semibold text-gray-800">Clientes</h2>
          <p className="text-sm text-gray-500">Cadastre e gerencie a carteira de clientes do seu salão de beleza.</p>
        </div>
        <button
          onClick={handleNewCliente}
          className="bg-gold-500 hover:bg-gold-600 text-white font-medium px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-xs hover:shadow-md transition-all shrink-0"
        >
          <Plus className="w-5 h-5" />
          <span>Nova Cliente</span>
        </button>
      </div>

      {/* Barra de Busca e Tabela */}
      <div className="bg-white rounded-2xl border border-gold-100 shadow-xs overflow-hidden">
        
        {/* Busca */}
        <div className="p-5 border-b border-gold-50 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar cliente por nome, telefone ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gold-50/30 border border-gold-100 rounded-xl py-2.5 pl-10 pr-4 text-sm text-gray-800 placeholder-gray-400 focus:outline-hidden focus:border-gold-300 focus:bg-white transition-all"
            />
          </div>
        </div>

        {clientesFiltrados.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <User className="w-12 h-12 text-gold-200 mb-2" />
            <p className="text-base font-semibold text-gray-700">Nenhuma cliente encontrada</p>
            <p className="text-sm text-gray-400 mt-1">Experimente buscar por outros termos ou cadastre uma nova cliente.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gold-50 bg-gold-50/20 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="p-4 pl-6">Cliente</th>
                  <th className="p-4">Contato</th>
                  <th className="p-4">Observações</th>
                  <th className="p-4">Data Cadastro</th>
                  <th className="p-4 pr-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold-50/50">
                {clientesFiltrados.map((c) => (
                  <tr key={c.id} className="text-sm hover:bg-gold-50/10 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center font-bold text-sm shrink-0">
                          {c.nome.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{c.nome}</p>
                          <p className="text-xs text-gray-400">{c.email || 'Sem e-mail'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-0.5 text-xs text-gray-600">
                        <span className="flex items-center gap-1.5 font-medium text-gray-800">
                          <Phone className="w-3.5 h-3.5 text-gold-500 shrink-0" />
                          {c.telefone}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 max-w-xs">
                      <p className="text-xs text-gray-500 truncate" title={c.observacoes}>
                        {c.observacoes || 'Nenhuma observação cadastrada.'}
                      </p>
                    </td>
                    <td className="p-4 text-xs text-gray-500">
                      {formatDate(c.dataCadastro)}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setViewingHistoricoCliente(c)}
                          title="Histórico de Atendimentos"
                          className="p-1.5 text-gold-600 hover:bg-gold-50 rounded-lg transition-colors"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditClick(c)}
                          title="Editar Cadastro"
                          className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(c)}
                          title="Excluir Cliente"
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

      {/* Modal / Overlay do Formulário de Cadastro/Edição */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-gold-100 shadow-xl max-w-lg w-full overflow-hidden animate-slide-up">
            
            {/* Header Form */}
            <div className="p-5 border-b border-gold-50 flex items-center justify-between">
              <h3 className="font-serif font-semibold text-lg text-gray-800">
                {editingCliente ? 'Editar Cliente' : 'Nova Cliente'}
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
                    placeholder="Ex: Maria das Dores Silva"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full bg-gold-50/10 border border-gold-100 rounded-xl py-2 pl-9 pr-4 text-sm text-gray-800 focus:outline-hidden focus:border-gold-300 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Telefone */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Telefone *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="Ex: (11) 99999-9999"
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                      className="w-full bg-gold-50/10 border border-gold-100 rounded-xl py-2 pl-9 pr-4 text-sm text-gray-800 focus:outline-hidden focus:border-gold-300 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">E-mail</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      placeholder="Ex: cliente@provedor.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-gold-50/10 border border-gold-100 rounded-xl py-2 pl-9 pr-4 text-sm text-gray-800 focus:outline-hidden focus:border-gold-300 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Observações */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Observações / Restrições</label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <textarea
                    rows={3}
                    placeholder="Histórico capilar, sensibilidades, químicas utilizadas, alergias, preferências, etc."
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    className="w-full bg-gold-50/10 border border-gold-100 rounded-xl py-2 pl-9 pr-4 text-sm text-gray-800 focus:outline-hidden focus:border-gold-300 focus:bg-white transition-all resize-none"
                  />
                </div>
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

      {/* Modal de Histórico de Atendimentos */}
      {viewingHistoricoCliente && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-gold-100 shadow-xl max-w-2xl w-full overflow-hidden animate-slide-up">
            
            {/* Header Histórico */}
            <div className="p-5 border-b border-gold-50 flex items-center justify-between bg-gold-50/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center font-bold text-sm shrink-0">
                  {viewingHistoricoCliente.nome.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-serif font-semibold text-lg text-gray-800">
                    Histórico de {viewingHistoricoCliente.nome}
                  </h3>
                  <p className="text-xs text-gray-500">Histórico completo de agendamentos e consumos.</p>
                </div>
              </div>
              <button 
                onClick={() => setViewingHistoricoCliente(null)}
                className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo Histórico */}
            <div className="p-6 space-y-4 max-h-[450px] overflow-y-auto">
              
              {getClienteAgendamentos(viewingHistoricoCliente.id).length === 0 ? (
                <div className="p-10 text-center flex flex-col items-center justify-center">
                  <Calendar className="w-10 h-10 text-gold-200 mb-2" />
                  <p className="text-sm font-semibold text-gray-600">Nenhum atendimento registrado</p>
                  <p className="text-xs text-gray-400 mt-1">Essa cliente ainda não possui agendamentos passados ou futuros.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {getClienteAgendamentos(viewingHistoricoCliente.id).map((a) => (
                    <div 
                      key={a.id} 
                      className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between gap-4 transition-all ${
                        a.status === 'Concluído' 
                          ? 'bg-green-50/20 border-green-100' 
                          : a.status === 'Cancelado' 
                          ? 'bg-red-50/20 border-red-100'
                          : 'bg-gold-50/10 border-gold-100/50'
                      }`}
                    >
                      {/* Info Atendimento */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-800">
                            {getServicoNome(a.servicoId)}
                          </span>
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                            a.status === 'Concluído' 
                              ? 'bg-green-100 text-green-700' 
                              : a.status === 'Cancelado' 
                              ? 'bg-red-100 text-red-700'
                              : a.status === 'Em atendimento' 
                              ? 'bg-pink-100 text-pink-700'
                              : 'bg-gold-100 text-gold-700'
                          }`}>
                            {a.status}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
                          <p>
                            <span className="text-gray-400">Profissional:</span> <span className="font-medium text-gray-700">{getProfissionalNome(a.profissionalId)}</span>
                          </p>
                          <p>
                            <span className="text-gray-400">Data/Hora:</span> <span className="font-medium text-gray-700">{formatDate(a.data)} às {a.hora}</span>
                          </p>
                          {a.formaPagamento && (
                            <p>
                              <span className="text-gray-400">Pagamento:</span> <span className="font-semibold text-gray-700">{a.formaPagamento}</span>
                            </p>
                          )}
                          {a.valorPago !== undefined && (
                            <p>
                              <span className="text-gray-400">Valor Pago:</span> <span className="font-bold text-gold-600">{formatCurrency(a.valorPago)}</span>
                            </p>
                          )}
                        </div>

                        {a.observacoes && (
                          <div className="mt-1.5 p-2 bg-white/50 border border-gold-50 rounded-lg text-xs text-gray-500">
                            <span className="font-semibold text-gray-600">Obs:</span> {a.observacoes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>

            {/* Rodapé Histórico */}
            <div className="p-4 border-t border-gold-50 flex justify-end bg-gold-50/10">
              <button
                onClick={() => setViewingHistoricoCliente(null)}
                className="px-5 py-2 bg-gold-500 hover:bg-gold-600 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors"
              >
                Fechar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
