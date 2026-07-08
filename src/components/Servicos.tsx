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
  Scissors, 
  DollarSign, 
  Clock, 
  Percent, 
  X, 
  AlertCircle,
  Package,
  PlusCircle,
  Sparkles
} from 'lucide-react';
import { Servico, Agendamento, Produto } from '../types';

interface ServicosProps {
  servicos: Servico[];
  agendamentos: Agendamento[];
  produtos?: Produto[];
  onAddServico: (s: Omit<Servico, 'id'>) => void;
  onEditServico: (s: Servico) => void;
  onDeleteServico: (id: string) => void;
}

export default function Servicos({
  servicos,
  agendamentos,
  produtos = [],
  onAddServico,
  onEditServico,
  onDeleteServico
}: ServicosProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Estado do formulário
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingServico, setEditingServico] = useState<Servico | null>(null);

  // Campos do formulário
  const [nome, setNome] = useState('');
  const [valor, setValor] = useState(100);
  const [tempoMedio, setTempoMedio] = useState(60); 
  const [comissaoPadrao, setComissaoPadrao] = useState(40); 
  const [produtosConsumidos, setProdutosConsumidos] = useState<{ produtoId: string; quantidade: number }[]>([]);
  const [formError, setFormError] = useState('');

  // Campos temporários para adicionar produto ao serviço
  const [tempProdutoId, setTempProdutoId] = useState('');
  const [tempQuantidade, setTempQuantidade] = useState<number>(1);

  // Filtrar serviços pela busca
  const servicosFiltrados = servicos.filter(s => 
    s.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Abrir form para novo serviço
  const handleNewServico = () => {
    setEditingServico(null);
    setNome('');
    setValor(100);
    setTempoMedio(60);
    setComissaoPadrao(40);
    setProdutosConsumidos([]);
    setTempProdutoId('');
    setTempQuantidade(1);
    setFormError('');
    setIsFormOpen(true);
  };

  // Abrir form para editar serviço
  const handleEditClick = (s: Servico) => {
    setEditingServico(s);
    setNome(s.nome);
    setValor(s.valor);
    setTempoMedio(s.tempoMedio);
    setComissaoPadrao(s.comissaoPadrao);
    setProdutosConsumidos(s.produtosConsumidos || []);
    setTempProdutoId('');
    setTempQuantidade(1);
    setFormError('');
    setIsFormOpen(true);
  };

  // Adicionar produto consumido à lista temporária do serviço
  const handleAddTempProduto = () => {
    if (!tempProdutoId) return;
    if (tempQuantidade <= 0) return;

    // Verificar se já existe na lista
    const index = produtosConsumidos.findIndex(p => p.produtoId === tempProdutoId);
    if (index !== -1) {
      // Atualiza quantidade
      const atualizados = [...produtosConsumidos];
      atualizados[index].quantidade += tempQuantidade;
      setProdutosConsumidos(atualizados);
    } else {
      setProdutosConsumidos([...produtosConsumidos, { produtoId: tempProdutoId, quantidade: tempQuantidade }]);
    }

    setTempProdutoId('');
    setTempQuantidade(1);
  };

  // Remover produto consumido da lista do serviço
  const handleRemoveTempProduto = (prodId: string) => {
    setProdutosConsumidos(produtosConsumidos.filter(p => p.produtoId !== prodId));
  };

  // Salvar serviço
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setFormError('O campo Nome do Serviço é obrigatório.');
      return;
    }
    if (valor <= 0) {
      setFormError('O valor cobrado deve ser maior que R$ 0,00.');
      return;
    }
    if (tempoMedio <= 0) {
      setFormError('O tempo médio deve ser maior que 0 minutos.');
      return;
    }
    if (comissaoPadrao < 0 || comissaoPadrao > 100) {
      setFormError('A comissão padrão deve ser um valor entre 0% e 100%.');
      return;
    }

    if (editingServico) {
      onEditServico({
        ...editingServico,
        nome,
        valor,
        tempoMedio,
        comissaoPadrao,
        produtosConsumidos
      });
    } else {
      onAddServico({
        nome,
        valor,
        tempoMedio,
        comissaoPadrao,
        produtosConsumidos
      });
    }

    setIsFormOpen(false);
    setEditingServico(null);
    setNome('');
    setValor(100);
    setTempoMedio(60);
    setComissaoPadrao(40);
    setProdutosConsumidos([]);
  };

  // Confirmar e excluir serviço
  const handleDeleteClick = (s: Servico) => {
    const totalAgendamentosDoServico = agendamentos.filter(a => a.servicoId === s.id).length;
    let confirmMsg = `Tem certeza que deseja excluir o serviço "${s.nome}"?`;
    if (totalAgendamentosDoServico > 0) {
      confirmMsg += `\nAVISO: Este serviço já possui ${totalAgendamentosDoServico} registro(s) de agendamento/atendimento. Excluí-lo removerá o vínculo, mas os relatórios do passado reterão o histórico de faturamento sem o nome do serviço ativo.`;
    }
    if (window.confirm(confirmMsg)) {
      onDeleteServico(s.id);
    }
  };

  const getProdutoNome = (id: string) => {
    return produtos.find(p => p.id === id)?.nome || 'Produto Desconhecido';
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-semibold text-gray-800">Serviços</h2>
          <p className="text-sm text-gray-500">Configure a cartela de serviços com tempos de execução e vincule baixas inteligentes de produtos de estoque.</p>
        </div>
        <button
          onClick={handleNewServico}
          className="bg-gold-500 hover:bg-gold-600 text-white font-medium px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-xs hover:shadow-md transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span>Novo Serviço</span>
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
              placeholder="Buscar serviço por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gold-50/30 border border-gold-100 rounded-xl py-2.5 pl-10 pr-4 text-sm text-gray-800 placeholder-gray-400 focus:outline-hidden focus:border-gold-300 focus:bg-white transition-all"
            />
          </div>
        </div>

        {servicosFiltrados.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <Scissors className="w-12 h-12 text-gold-200 mb-2" />
            <p className="text-base font-semibold text-gray-700">Nenhum serviço cadastrado</p>
            <p className="text-sm text-gray-400 mt-1">Crie serviços como cortes, escovas ou unhas para oferecer na agenda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gold-50 bg-gold-50/20 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="p-4 pl-6">Serviço</th>
                  <th className="p-4">Valor Cobrado</th>
                  <th className="p-4">Tempo Estimado</th>
                  <th className="p-4">Comissão Repasse</th>
                  <th className="p-4">Estoque Vinculado</th>
                  <th className="p-4 pr-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold-50/50">
                {servicosFiltrados.map((s) => (
                  <tr key={s.id} className="text-sm hover:bg-gold-50/10 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center font-bold text-sm shrink-0">
                          <Scissors className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{s.nome}</p>
                          <p className="text-xs text-gray-400">ID: {s.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-gold-600">
                        {formatCurrency(s.valor)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        {s.tempoMedio} min
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 bg-gold-50 text-gold-700 px-2.5 py-1 rounded-lg text-xs font-bold">
                        <Percent className="w-3 h-3 text-gold-500" />
                        {s.comissaoPadrao}%
                      </span>
                    </td>
                    <td className="p-4">
                      {s.produtosConsumidos && s.produtosConsumidos.length > 0 ? (
                        <span className="inline-flex items-center gap-1.5 bg-pink-50 text-pink-700 px-2.5 py-1 rounded-lg text-xs font-bold">
                          <Package className="w-3.5 h-3.5" />
                          {s.produtosConsumidos.length} produto(s)
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 font-medium">Nenhum</span>
                      )}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditClick(s)}
                          title="Editar Serviço"
                          className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(s)}
                          title="Excluir Serviço"
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
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
          <div className="bg-white rounded-2xl border border-gold-100 shadow-xl max-w-lg w-full overflow-hidden animate-slide-up">
            
            {/* Header Form */}
            <div className="p-5 border-b border-gold-50 flex items-center justify-between">
              <h3 className="font-serif font-semibold text-lg text-gray-800">
                {editingServico ? 'Editar Serviço' : 'Novo Serviço'}
              </h3>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
              
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Nome */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nome do Serviço *</label>
                <div className="relative">
                  <Scissors className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: Escova Reconstrutora de Colágeno"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full bg-gold-50/10 border border-gold-100 rounded-xl py-2 pl-9 pr-4 text-sm text-gray-800 focus:outline-hidden focus:border-gold-300 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Valor e Tempo */}
              <div className="grid grid-cols-3 gap-4">
                {/* Valor */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Preço (R$) *</label>
                  <input
                    type="number"
                    required
                    min={0.01}
                    step={0.01}
                    value={valor}
                    onChange={(e) => setValor(Number(e.target.value))}
                    className="w-full bg-gold-50/10 border border-gold-100 rounded-xl py-2 px-3 text-sm text-gray-800 focus:outline-hidden focus:border-gold-300"
                  />
                </div>

                {/* Tempo Estimado */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Duração *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={tempoMedio}
                    onChange={(e) => setTempoMedio(Number(e.target.value))}
                    className="w-full bg-gold-50/10 border border-gold-100 rounded-xl py-2 px-3 text-sm text-gray-800 focus:outline-hidden focus:border-gold-300"
                  />
                </div>

                {/* Comissão (%) */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Comissão % *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={100}
                    value={comissaoPadrao}
                    onChange={(e) => setComissaoPadrao(Number(e.target.value))}
                    className="w-full bg-gold-50/10 border border-gold-100 rounded-xl py-2 px-3 text-sm text-gray-800 focus:outline-hidden focus:border-gold-300"
                  />
                </div>
              </div>

              {/* ASSOCIAÇÃO INTELIGENTE DE PRODUTOS DE CONSUMO */}
              <div className="p-4 bg-gold-50/30 border border-gold-100 rounded-xl space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gold-800 uppercase tracking-wider">
                  <Package className="w-4 h-4 text-gold-500" />
                  <span>Produtos Consumidos pelo Serviço (Estoque Automático)</span>
                </div>
                <p className="text-[10px] text-gray-400">Vincule materiais que são abatidos do estoque toda vez que este atendimento for concluído.</p>

                {/* Seletor do Produto */}
                <div className="flex gap-2 items-end">
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] font-semibold text-gray-500">Selecionar Produto</label>
                    <select
                      value={tempProdutoId}
                      onChange={(e) => setTempProdutoId(e.target.value)}
                      className="w-full bg-white border border-gold-100 rounded-lg p-1.5 text-xs focus:outline-hidden focus:border-gold-300"
                    >
                      <option value="">Selecione...</option>
                      {produtos.map(p => (
                        <option key={p.id} value={p.id}>{p.nome} ({p.marca}) — {p.quantidade} un em est.</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-20 space-y-1">
                    <label className="text-[10px] font-semibold text-gray-500">Qtd Cons.</label>
                    <input
                      type="number"
                      min={1}
                      value={tempQuantidade}
                      onChange={(e) => setTempQuantidade(Number(e.target.value))}
                      className="w-full bg-white border border-gold-100 rounded-lg p-1.5 text-xs text-center"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddTempProduto}
                    className="bg-gold-500 hover:bg-gold-600 text-white p-2 rounded-lg cursor-pointer"
                    title="Vincular Produto"
                  >
                    <PlusCircle className="w-4 h-4" />
                  </button>
                </div>

                {/* Lista de Produtos Vinculados */}
                {produtosConsumidos.length > 0 ? (
                  <div className="pt-2 divide-y divide-gold-50/50 max-h-32 overflow-y-auto">
                    {produtosConsumidos.map(item => (
                      <div key={item.produtoId} className="flex items-center justify-between py-1.5 text-xs">
                        <span className="font-semibold text-gray-700">{getProdutoNome(item.produtoId)}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-gold-700 bg-gold-100/55 px-2 py-0.5 rounded-md">{item.quantidade} un</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTempProduto(item.produtoId)}
                            className="text-red-500 hover:text-red-700 p-0.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-400 italic text-center py-2">Nenhum produto vinculado ainda.</p>
                )}
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
                  className="px-5 py-2 bg-gold-500 hover:bg-gold-600 text-white font-semibold text-sm rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer"
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
