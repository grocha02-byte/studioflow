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
  Package, 
  ArrowUpRight, 
  ArrowDownLeft, 
  AlertTriangle, 
  FileText, 
  X, 
  AlertCircle,
  Tag,
  Warehouse,
  Coins,
  TrendingUp,
  History
} from 'lucide-react';
import { Produto, MovimentacaoEstoque } from '../types';

interface EstoqueProps {
  produtos: Produto[];
  movimentacoes: MovimentacaoEstoque[];
  onAddProduto: (p: Omit<Produto, 'id'>) => void;
  onEditProduto: (p: Produto) => void;
  onDeleteProduto: (id: string) => void;
  onAddMovimentacao: (m: Omit<MovimentacaoEstoque, 'id' | 'data'>) => void;
}

export default function Estoque({
  produtos,
  movimentacoes,
  onAddProduto,
  onEditProduto,
  onDeleteProduto,
  onAddMovimentacao
}: EstoqueProps) {
  
  // Controle de Tabs locais: "estoque" (produtos) e "historico" (movimentações)
  const [activeTab, setActiveTab] = useState<'estoque' | 'historico'>('estoque');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todos');

  // Modais de controle
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [isMovementFormOpen, setIsMovementFormOpen] = useState(false);

  // Campos do formulário do Produto
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null);
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('Cabelo');
  const [marca, setMarca] = useState('');
  const [quantidade, setQuantidade] = useState(0);
  const [estoqueMinimo, setEstoqueMinimo] = useState(3);
  const [valorCusto, setValorCusto] = useState(0);
  const [valorVenda, setValorVenda] = useState(0);
  const [fornecedor, setFornecedor] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [productFormError, setProductFormError] = useState('');

  // Campos do formulário de Movimentação
  const [selectedProductId, setSelectedProductId] = useState('');
  const [movementTipo, setMovementTipo] = useState<'Entrada' | 'Saída' | 'Ajuste'>('Entrada');
  const [movementQuantidade, setMovementQuantidade] = useState(1);
  const [movementObservacoes, setMovementObservacoes] = useState('');
  const [movementFormError, setMovementFormError] = useState('');

  // Categorias exclusivas para filtro
  const categorias = ['Todos', ...Array.from(new Set(produtos.map(p => p.categoria)))];

  // Filtrar produtos
  const produtosFiltrados = produtos.filter(p => {
    const matchesSearch = p.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.fornecedor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'Todos' || p.categoria === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Filtrar e ordenar movimentações (decrescente por data/id)
  const movimentacoesOrdenadas = [...movimentacoes].reverse();

  // Abrir form para novo produto
  const handleNewProduct = () => {
    setEditingProduto(null);
    setNome('');
    setCategoria('Cabelo');
    setMarca('');
    setQuantidade(0);
    setEstoqueMinimo(3);
    setValorCusto(0);
    setValorVenda(0);
    setFornecedor('');
    setObservacoes('');
    setProductFormError('');
    setIsProductFormOpen(true);
  };

  // Abrir form para editar produto
  const handleEditProduct = (p: Produto) => {
    setEditingProduto(p);
    setNome(p.nome);
    setCategoria(p.categoria);
    setMarca(p.marca);
    setQuantidade(p.quantidade);
    setEstoqueMinimo(p.estoqueMinimo);
    setValorCusto(p.valorCusto);
    setValorVenda(p.valorVenda);
    setFornecedor(p.fornecedor);
    setObservacoes(p.observacoes);
    setProductFormError('');
    setIsProductFormOpen(true);
  };

  // Salvar produto
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setProductFormError('O nome do produto é obrigatório.');
      return;
    }
    if (!marca.trim()) {
      setProductFormError('A marca do produto é obrigatória.');
      return;
    }
    if (quantidade < 0) {
      setProductFormError('A quantidade inicial não pode ser menor que zero.');
      return;
    }
    if (estoqueMinimo < 0) {
      setProductFormError('O estoque mínimo não pode ser menor que zero.');
      return;
    }
    if (valorCusto < 0 || valorVenda < 0) {
      setProductFormError('Os valores não podem ser negativos.');
      return;
    }

    if (editingProduto) {
      onEditProduto({
        ...editingProduto,
        nome,
        categoria,
        marca,
        quantidade,
        estoqueMinimo,
        valorCusto,
        valorVenda,
        fornecedor,
        observacoes
      });
    } else {
      onAddProduto({
        nome,
        categoria,
        marca,
        quantidade,
        estoqueMinimo,
        valorCusto,
        valorVenda,
        fornecedor,
        observacoes
      });
    }

    setIsProductFormOpen(false);
    setEditingProduto(null);
  };

  // Excluir produto
  const handleDeleteProduct = (p: Produto) => {
    if (window.confirm(`Tem certeza que deseja excluir o produto "${p.nome}" do estoque? Esta ação removerá o registro.`)) {
      onDeleteProduto(p.id);
    }
  };

  // Abrir formulário de movimentação rápida
  const handleOpenMovement = (prodId?: string) => {
    setSelectedProductId(prodId || produtos[0]?.id || '');
    setMovementTipo('Entrada');
    setMovementQuantidade(1);
    setMovementObservacoes('');
    setMovementFormError('');
    setIsMovementFormOpen(true);
  };

  // Salvar movimentação e ajustar estoque
  const handleSaveMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      setMovementFormError('Selecione um produto.');
      return;
    }
    if (movementQuantidade <= 0) {
      setMovementFormError('A quantidade de movimentação deve ser maior que zero.');
      return;
    }

    const prod = produtos.find(p => p.id === selectedProductId);
    if (!prod) {
      setMovementFormError('Produto não encontrado.');
      return;
    }

    // Validação de Saída
    if (movementTipo === 'Saída' && prod.quantidade < movementQuantidade) {
      setMovementFormError(`Estoque insuficiente. Quantidade atual disponível: ${prod.quantidade} unidades.`);
      return;
    }

    // Registrar movimentação
    onAddMovimentacao({
      produtoId: selectedProductId,
      tipo: movementTipo,
      quantidade: movementQuantidade,
      observacoes: movementObservacoes || `${movementTipo} registrada manualmente.`
    });

    // Ajustar quantidade do produto correspondente
    let novaQuantidade = prod.quantidade;
    if (movementTipo === 'Entrada') {
      novaQuantidade += movementQuantidade;
    } else if (movementTipo === 'Saída') {
      novaQuantidade -= movementQuantidade;
    } else if (movementTipo === 'Ajuste') {
      // Ajuste é um override ou mudança manual. 
      // Para fins intuitivos, faremos o Ajuste somar ou subtrair o valor positivo/negativo digitado, 
      // ou se o usuário escolheu ajuste, consideraremos que o valor digitado substitui o estoque anterior se for informado, 
      // mas para manter consistência faremos um ajuste aditivo: positivo aumenta, negativo diminui, 
      // ou simplesmente solicitaremos no form para recalcular. 
      // Vamos criar um input direto de override ou somar. Faremos somar/subtrair para ser simples.
      // Vamos assumir que a quantidade digitada substitui o estoque antigo (Ajuste direto para X qtd).
      novaQuantidade = movementQuantidade;
    }

    onEditProduto({
      ...prod,
      quantidade: novaQuantidade
    });

    setIsMovementFormOpen(false);
  };

  const getProdutoNome = (id: string) => {
    const p = produtos.find(item => item.id === id);
    return p ? p.nome : 'Produto Desconhecido';
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-semibold text-gray-800">Estoque de Produtos</h2>
          <p className="text-sm text-gray-500">Monitore mercadorias para revenda e uso interno, registre entradas/saídas e veja os alertas de estoque.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => handleOpenMovement()}
            className="bg-white hover:bg-gold-50 text-gold-700 border border-gold-200 font-semibold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs"
          >
            <Coins className="w-4 h-4 text-gold-500" />
            <span>Movimentar Estoque</span>
          </button>
          <button
            onClick={handleNewProduct}
            className="bg-gold-500 hover:bg-gold-600 text-white font-semibold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-xs hover:shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Produto</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gold-100 gap-1">
        <button
          onClick={() => setActiveTab('estoque')}
          className={`px-5 py-2.5 font-semibold text-sm transition-all border-b-2 cursor-pointer ${
            activeTab === 'estoque' 
              ? 'border-gold-500 text-gold-700 bg-white rounded-t-xl font-bold' 
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <span className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Produtos em Estoque
          </span>
        </button>
        <button
          onClick={() => setActiveTab('historico')}
          className={`px-5 py-2.5 font-semibold text-sm transition-all border-b-2 cursor-pointer ${
            activeTab === 'historico' 
              ? 'border-gold-500 text-gold-700 bg-white rounded-t-xl font-bold' 
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <span className="flex items-center gap-2">
            <History className="w-4 h-4" />
            Histórico de Movimentações
          </span>
        </button>
      </div>

      {activeTab === 'estoque' ? (
        /* TAB PRODUTOS */
        <div className="bg-white rounded-2xl border border-gold-100 shadow-xs overflow-hidden">
          
          {/* Barra de Filtros */}
          <div className="p-5 border-b border-gold-50 flex flex-col md:flex-row gap-3 items-stretch md:items-center">
            
            {/* Busca */}
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nome do produto, marca, fornecedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gold-50/30 border border-gold-100 rounded-xl py-2 pl-10 pr-4 text-sm text-gray-800 placeholder-gray-400 focus:outline-hidden focus:border-gold-300 focus:bg-white"
              />
            </div>

            {/* Categorias */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:inline">Categoria:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-gold-50/30 border border-gold-100 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-hidden focus:border-gold-300"
              >
                {categorias.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

          </div>

          {produtosFiltrados.length === 0 ? (
            <div className="p-16 text-center flex flex-col items-center justify-center">
              <Package className="w-12 h-12 text-gold-200 mb-2" />
              <p className="text-base font-semibold text-gray-700">Nenhum produto correspondente</p>
              <p className="text-sm text-gray-400 mt-1">Sua busca não retornou resultados ou o estoque está vazio.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gold-50 bg-gold-50/20 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="p-4 pl-6">Produto</th>
                    <th className="p-4">Marca & Categoria</th>
                    <th className="p-4">Preço de Custo</th>
                    <th className="p-4">Preço de Venda</th>
                    <th className="p-4 text-center">Disponível</th>
                    <th className="p-4 text-center">Status Estoque</th>
                    <th className="p-4 pr-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gold-50/50">
                  {produtosFiltrados.map((p) => {
                    const isLowStock = p.quantidade <= p.estoqueMinimo;
                    return (
                      <tr key={p.id} className="text-sm hover:bg-gold-50/10 transition-colors">
                        
                        {/* Nome / ID / Fornecedor */}
                        <td className="p-4 pl-6 max-w-xs">
                          <div>
                            <p className="font-semibold text-gray-800 break-words">{p.nome}</p>
                            <p className="text-[11px] text-gray-400">Forn: <span className="font-medium">{p.fornecedor || 'Não cadastrado'}</span></p>
                          </div>
                        </td>

                        {/* Marca / Categoria */}
                        <td className="p-4">
                          <div className="space-y-1">
                            <span className="inline-block bg-pink-50 text-pink-700 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider">
                              {p.categoria}
                            </span>
                            <p className="text-xs text-gray-500 font-medium">{p.marca}</p>
                          </div>
                        </td>

                        {/* Preço de Custo */}
                        <td className="p-4 font-mono text-xs text-gray-600">
                          {formatCurrency(p.valorCusto)}
                        </td>

                        {/* Preço de Venda */}
                        <td className="p-4">
                          <span className="font-bold text-gold-600 font-mono text-sm">
                            {formatCurrency(p.valorVenda)}
                          </span>
                        </td>

                        {/* Quantidade */}
                        <td className="p-4 text-center font-bold">
                          <span className={`inline-block font-mono text-sm px-2.5 py-1 rounded-lg ${
                            isLowStock ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                          }`}>
                            {p.quantidade} un
                          </span>
                        </td>

                        {/* Status Alerta */}
                        <td className="p-4 text-center">
                          {isLowStock ? (
                            <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                              <AlertTriangle className="w-3 h-3" />
                              Repor Estoque
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                              Suficiente
                            </span>
                          )}
                        </td>

                        {/* Ações */}
                        <td className="p-4 pr-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenMovement(p.id)}
                              title="Registrar Movimento Rápido"
                              className="p-1.5 text-gold-600 hover:bg-gold-50 rounded-lg transition-colors"
                            >
                              <History className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEditProduct(p)}
                              title="Editar Produto"
                              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p)}
                              title="Excluir Produto"
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* TAB HISTÓRICO DE MOVIMENTAÇÕES */
        <div className="bg-white rounded-2xl border border-gold-100 shadow-xs overflow-hidden">
          
          <div className="p-5 border-b border-gold-50">
            <h3 className="font-serif font-semibold text-lg text-gray-800">Histórico Completo de Auditoria</h3>
            <p className="text-xs text-gray-400">Rastreabilidade total das mercadorias de bancada e revendas do salão.</p>
          </div>

          {movimentacoesOrdenadas.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <Warehouse className="w-12 h-12 text-gold-200 mb-2" />
              <p className="text-base font-semibold text-gray-700">Sem movimentações registradas</p>
              <p className="text-sm text-gray-400 mt-1">Qualquer reposição ou consumo manual aparecerá documentado aqui.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gold-50 bg-gold-50/20 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="p-4 pl-6">Data / Hora</th>
                    <th className="p-4">Produto</th>
                    <th className="p-4">Tipo</th>
                    <th className="p-4 text-center">Quantidade</th>
                    <th className="p-4 pr-6">Justificativa / Observações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gold-50/50">
                  {movimentacoesOrdenadas.map((m) => {
                    const isEntrada = m.tipo === 'Entrada';
                    const isSaida = m.tipo === 'Saída';
                    return (
                      <tr key={m.id} className="text-sm hover:bg-gold-50/10 transition-colors">
                        
                        <td className="p-4 pl-6 text-xs font-medium text-gray-500">
                          {m.data}
                        </td>

                        <td className="p-4 font-semibold text-gray-800">
                          {getProdutoNome(m.produtoId)}
                        </td>

                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                            isEntrada 
                              ? 'bg-green-100 text-green-700' 
                              : isSaida 
                              ? 'bg-red-100 text-red-700' 
                              : 'bg-gold-100 text-gold-700'
                          }`}>
                            {isEntrada ? <ArrowUpRight className="w-3 h-3" /> : isSaida ? <ArrowDownLeft className="w-3 h-3" /> : null}
                            {m.tipo}
                          </span>
                        </td>

                        <td className="p-4 text-center font-bold">
                          <span className={isEntrada ? 'text-green-600' : isSaida ? 'text-red-600' : 'text-gold-600'}>
                            {isEntrada ? '+' : isSaida ? '-' : ''} {m.quantidade} un
                          </span>
                        </td>

                        <td className="p-4 pr-6 text-xs text-gray-500 italic max-w-sm">
                          {m.observacoes}
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}

      {/* MODAL: Formulário de Produto (CRUD) */}
      {isProductFormOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-gold-100 shadow-xl max-w-lg w-full overflow-hidden animate-slide-up">
            
            <div className="p-5 border-b border-gold-50 flex items-center justify-between bg-gold-50/20">
              <h3 className="font-serif font-semibold text-lg text-gray-800">
                {editingProduto ? 'Editar Produto' : 'Cadastrar Novo Produto'}
              </h3>
              <button 
                onClick={() => setIsProductFormOpen(false)}
                className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
              
              {productFormError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{productFormError}</span>
                </div>
              )}

              {/* Nome */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nome do Produto *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Condicionador Redken Extreme 1000ml"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full bg-gold-50/10 border border-gold-100 rounded-xl py-2 px-3 text-sm text-gray-800 focus:outline-hidden focus:border-gold-300"
                />
              </div>

              {/* Categoria / Marca */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Categoria *</label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full bg-gold-50/10 border border-gold-100 rounded-xl py-2 px-3 text-sm text-gray-800 focus:outline-hidden focus:border-gold-300"
                  >
                    <option value="Cabelo">Cabelo</option>
                    <option value="Unhas">Unhas</option>
                    <option value="Tratamento">Tratamento</option>
                    <option value="Maquiagem">Maquiagem</option>
                    <option value="Estética">Estética</option>
                    <option value="Acessórios">Acessórios</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Marca *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Redken"
                    value={marca}
                    onChange={(e) => setMarca(e.target.value)}
                    className="w-full bg-gold-50/10 border border-gold-100 rounded-xl py-2 px-3 text-sm text-gray-800 focus:outline-hidden focus:border-gold-300"
                  />
                </div>
              </div>

              {/* Qtd Inicial / Estoque Mínimo */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Quantidade Inicial *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    disabled={editingProduto !== null} // Bloqueia edição direta de quantidade em edit para forçar uso da movimentação (auditoria!)
                    placeholder="Ex: 10"
                    value={quantidade}
                    onChange={(e) => setQuantidade(Number(e.target.value))}
                    className="w-full bg-gold-50/10 border border-gold-100 rounded-xl py-2 px-3 text-sm text-gray-800 focus:outline-hidden focus:border-gold-300 disabled:opacity-50"
                  />
                  {editingProduto && <p className="text-[9px] text-gray-400">Para alterar estoque, use o botão de Movimentação.</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Estoque Mínimo (Alerta) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    placeholder="Ex: 3"
                    value={estoqueMinimo}
                    onChange={(e) => setEstoqueMinimo(Number(e.target.value))}
                    className="w-full bg-gold-50/10 border border-gold-100 rounded-xl py-2 px-3 text-sm text-gray-800 focus:outline-hidden focus:border-gold-300"
                  />
                </div>
              </div>

              {/* Custos / Vendas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Preço de Custo (R$) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={0.01}
                    placeholder="Ex: 110.00"
                    value={valorCusto}
                    onChange={(e) => setValorCusto(Number(e.target.value))}
                    className="w-full bg-gold-50/10 border border-gold-100 rounded-xl py-2 px-3 text-sm text-gray-800 focus:outline-hidden focus:border-gold-300"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Preço de Venda (R$) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={0.01}
                    placeholder="Ex: 180.00"
                    value={valorVenda}
                    onChange={(e) => setValorVenda(Number(e.target.value))}
                    className="w-full bg-gold-50/10 border border-gold-100 rounded-xl py-2 px-3 text-sm text-gray-800 focus:outline-hidden focus:border-gold-300"
                  />
                </div>
              </div>

              {/* Fornecedor */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Fornecedor</label>
                <input
                  type="text"
                  placeholder="Ex: L'Oréal Brasil S/A"
                  value={fornecedor}
                  onChange={(e) => setFornecedor(e.target.value)}
                  className="w-full bg-gold-50/10 border border-gold-100 rounded-xl py-2 px-3 text-sm text-gray-800 focus:outline-hidden focus:border-gold-300"
                />
              </div>

              {/* Observações */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Observações / Detalhes</label>
                <textarea
                  rows={2}
                  placeholder="Nicho no estoque, data de vencimento se aplicável, etc."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="w-full bg-gold-50/10 border border-gold-100 rounded-xl py-2 px-3 text-sm text-gray-800 focus:outline-hidden focus:border-gold-300 resize-none"
                />
              </div>

              {/* Botões Form */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gold-50">
                <button
                  type="button"
                  onClick={() => setIsProductFormOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 text-xs font-semibold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gold-500 hover:bg-gold-600 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Salvar Produto
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL: Registros de Movimentação (Entrada/Saída/Ajuste) */}
      {isMovementFormOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-gold-100 shadow-xl max-w-md w-full overflow-hidden animate-slide-up">
            
            <div className="p-5 border-b border-gold-50 flex items-center justify-between bg-gold-50/20">
              <h3 className="font-serif font-semibold text-lg text-gray-800">
                Movimentação Manual de Estoque
              </h3>
              <button 
                onClick={() => setIsMovementFormOpen(false)}
                className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMovement} className="p-6 space-y-4">
              
              {movementFormError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{movementFormError}</span>
                </div>
              )}

              {/* Produto Selecionado */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Produto Alvo *</label>
                <select
                  required
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full bg-gold-50/10 border border-gold-100 rounded-xl py-2 px-3 text-sm text-gray-800 focus:outline-hidden"
                >
                  {produtos.map(p => (
                    <option key={p.id} value={p.id}>{p.nome} (Atual: {p.quantidade} un)</option>
                  ))}
                </select>
              </div>

              {/* Tipo de Movimento */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Tipo de Movimentação *</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Entrada', 'Saída', 'Ajuste'] as const).map((tipo) => {
                    const isSelected = movementTipo === tipo;
                    return (
                      <button
                        key={tipo}
                        type="button"
                        onClick={() => {
                          setMovementTipo(tipo);
                          // Se for Ajuste, puxa a quantidade atual como base para alteração fácil
                          if (tipo === 'Ajuste') {
                            const p = produtos.find(item => item.id === selectedProductId);
                            setMovementQuantidade(p ? p.quantidade : 0);
                          } else {
                            setMovementQuantidade(1);
                          }
                        }}
                        className={`py-2 text-center text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-gold-500 border-gold-500 text-white font-bold' 
                            : 'bg-white border-gold-100 text-gray-600 hover:bg-gold-50/50'
                        }`}
                      >
                        {tipo}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quantidade */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {movementTipo === 'Ajuste' ? 'Nova Quantidade Absoluta *' : 'Quantidade *'}
                </label>
                <input
                  type="number"
                  required
                  min={movementTipo === 'Ajuste' ? 0 : 1}
                  value={movementQuantidade}
                  onChange={(e) => setMovementQuantidade(Number(e.target.value))}
                  className="w-full bg-gold-50/10 border border-gold-100 rounded-xl py-2 px-3 text-sm text-gray-800 focus:outline-hidden focus:border-gold-300"
                />
                <p className="text-[10px] text-gray-400">
                  {movementTipo === 'Entrada' && 'Esta quantidade será SOMADA ao estoque atual.'}
                  {movementTipo === 'Saída' && 'Esta quantidade será SUBTRAÍDA do estoque atual.'}
                  {movementTipo === 'Ajuste' && 'O estoque atual será SUBSTITUÍDO exatamente por esta quantidade.'}
                </p>
              </div>

              {/* Observações / Auditoria */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Justificativa / Motivo *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Ex: Compra de reposição com NF, Uso em bancada por Amanda, Perda de material, etc."
                  value={movementObservacoes}
                  onChange={(e) => setMovementObservacoes(e.target.value)}
                  className="w-full bg-gold-50/10 border border-gold-100 rounded-xl py-2 px-3 text-sm text-gray-800 focus:outline-hidden focus:border-gold-300 resize-none"
                />
              </div>

              {/* Ações */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gold-50">
                <button
                  type="button"
                  onClick={() => setIsMovementFormOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 text-xs font-semibold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gold-500 hover:bg-gold-600 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Confirmar Ajuste
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
