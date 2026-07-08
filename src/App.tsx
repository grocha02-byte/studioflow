/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Menu, 
  X, 
  BarChart2, 
  Calendar, 
  Users, 
  UserCheck, 
  Scissors, 
  Package, 
  Settings, 
  LayoutDashboard,
  FileText,
  Heart,
  Search,
  ArrowRight,
  LogOut
} from 'lucide-react';

// Tipos e Helpers de Persistência
import { Cliente, Profissional, Servico, Agendamento, Produto, MovimentacaoEstoque, Configuracao, CaixaTransacao, CaixaStatus } from './types';
import { useAuth } from './contexts/AuthContext';
import { useDatabase } from './hooks/useDatabase';
import { requestNotificationPermission } from './lib/firebase';
import Login from './components/Login';
import { signOut } from 'firebase/auth';
import { auth } from './lib/firebase';

// Subcomponentes Modulares
import Dashboard from './components/Dashboard';
import Clientes from './components/Clientes';
import Profissionais from './components/Profissionais';
import Servicos from './components/Servicos';
import Agenda from './components/Agenda';
import Estoque from './components/Estoque';
import Relatorios from './components/Relatorios';
import ContasReceber from './components/ContasReceber';
import Configuracoes from './components/Configuracoes';
import NotificationCenter from './components/NotificationCenter';

export default function App() {
  const { user, loading, usuarioData, error: authError, retry: retryAuth } = useAuth();
  const dbStore = useDatabase();
  const [appTimeoutError, setAppTimeoutError] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (user && !usuarioData && loading) {
      timer = setTimeout(() => {
        setAppTimeoutError(true);
      }, 5000);
    } else {
      setAppTimeoutError(false);
    }
    return () => clearTimeout(timer);
  }, [user, usuarioData, loading]);

  const { clientes, profissionais, servicos, agendamentos, produtos, movimentacoes, caixaTransacoes, caixaStatus, configuracao, addDocData, updateDocData, deleteDocData, setDocData } = dbStore;                    
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [selectedAgendamentoFromDashboard, setSelectedAgendamentoFromDashboard] = useState<Agendamento | null>(null);
  const [globalSearch, setGlobalSearch] = useState('');

  if (loading || (!usuarioData && user && !authError && !appTimeoutError)) {
    return (
      <div className="min-h-screen bg-[#FAF8F6] flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-gold-400 to-gold-600 text-white flex items-center justify-center shadow-lg mb-6 animate-pulse">
          <Sparkles className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-serif font-bold text-gray-900 mb-2 text-center">Preparando seu espaço...</h2>
        <p className="text-sm text-gray-500 text-center max-w-xs mb-8 animate-pulse">
          Aguarde um momento enquanto configuramos o seu painel de gestão.
        </p>
      </div>
    );
  }

  if (authError || appTimeoutError) {
    return (
      <div className="min-h-screen bg-[#FAF8F6] flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center shadow-lg mb-6">
          <X className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-serif font-bold text-gray-900 mb-2 text-center">Falha ao Carregar</h2>
        
        <div className="bg-white text-gray-800 p-4 rounded-xl max-w-md w-full mb-8 text-center text-sm border border-red-100 shadow-sm">
          <p className="font-bold mb-2 text-red-600">Erro de Conexão ou Permissão</p>
          <p className="font-mono text-xs bg-gray-50 p-2 rounded text-left overflow-auto text-red-500">
            {authError ? authError : 'Timeout: O servidor demorou muito para responder.'}
          </p>
        </div>

        <button 
          onClick={retryAuth}
          className="w-full max-w-xs py-3 mb-3 bg-gold-600 text-white font-semibold rounded-xl hover:bg-gold-700 transition-colors shadow-sm"
        >
          Tentar novamente
        </button>

        <button 
          onClick={() => signOut(auth)}
          className="text-xs text-gold-600 font-semibold hover:text-gold-700 transition-colors mt-2"
        >
          Sair da Conta
        </button>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  

const getGlobalSearchResults = () => {
    if (!globalSearch.trim()) return null;
    const term = globalSearch.toLowerCase().trim();

    const matchedClientes = clientes
      .filter(c => c.nome.toLowerCase().includes(term) || c.telefone.includes(term) || c.email.toLowerCase().includes(term))
      .slice(0, 3);

    const matchedProfissionais = profissionais
      .filter(p => p.nome.toLowerCase().includes(term) || (p.especialidades && p.especialidades.some(e => e.toLowerCase().includes(term))))
      .slice(0, 3);

    const matchedServicos = servicos
      .filter(s => s.nome.toLowerCase().includes(term))
      .slice(0, 3);

    const matchedProdutos = produtos
      .filter(p => p.nome.toLowerCase().includes(term) || p.marca.toLowerCase().includes(term))
      .slice(0, 3);

    // Agendamentos
    const matchedAgendamentos = agendamentos
      .filter(a => {
        const cNome = clientes.find(c => c.id === a.clienteId)?.nome || '';
        const sNome = servicos.find(s => s.id === a.servicoId)?.nome || '';
        return cNome.toLowerCase().includes(term) || sNome.toLowerCase().includes(term);
      })
      .slice(0, 3);

    const totalResults = matchedClientes.length + matchedProfissionais.length + matchedServicos.length + matchedProdutos.length + matchedAgendamentos.length;

    return {
      clientes: matchedClientes,
      profissionais: matchedProfissionais,
      servicos: matchedServicos,
      produtos: matchedProdutos,
      agendamentos: matchedAgendamentos,
      totalResults
    };
  };

  const searchResults = getGlobalSearchResults();

  // CALLBACKS DE PERSISTÊNCIA - CLIENTES
  const handleAddCliente = async (novo: Omit<Cliente, 'id'>) => { await addDocData('clientes', { ...novo, dataCadastro: new Date().toISOString().substring(0, 10) }); };

  const handleEditCliente = async (editado: Cliente) => { await updateDocData('clientes', editado.id!, editado); };

  const handleDeleteCliente = async (id: string) => { await deleteDocData('clientes', id); };

  // CALLBACKS DE PERSISTÊNCIA - PROFISSIONAIS
  const handleAddProfissional = async (novo: Omit<Profissional, 'id'>) => { await addDocData('profissionais', novo); };

  const handleEditProfissional = async (editado: Profissional) => { await updateDocData('profissionais', editado.id!, editado); };

  const handleDeleteProfissional = async (id: string) => { await deleteDocData('profissionais', id); };

  // CALLBACKS DE PERSISTÊNCIA - SERVIÇOS
  const handleAddServico = async (novo: Omit<Servico, 'id'>) => { await addDocData('servicos', novo); };

  const handleEditServico = async (editado: Servico) => { await updateDocData('servicos', editado.id!, editado); };

  const handleDeleteServico = async (id: string) => { await deleteDocData('servicos', id); };

  // CALLBACKS DE PERSISTÊNCIA - AGENDAMENTOS (AGENDA & ATENDIMENTOS) WITH INTEGRATED CASH & STOCK DEDUCTION
  const handleAddAgendamento = async (novo: Omit<Agendamento, 'id'>) => { await addDocData('agendamentos', novo); };

  const handleEditAgendamento = async (editado: Agendamento) => { await updateDocData('agendamentos', editado.id!, editado); };

  const handleDeleteAgendamento = async (id: string) => { await deleteDocData('agendamentos', id); };

  // CALLBACKS DE PERSISTÊNCIA - PRODUTOS (ESTOQUE)
  const handleAddProduto = async (novo: Omit<Produto, 'id'>) => { await addDocData('produtos', novo); };

  const handleEditProduto = async (editado: Produto) => { await updateDocData('produtos', editado.id!, editado); };

  const handleDeleteProduto = async (id: string) => { await deleteDocData('produtos', id); };

  // CALLBACKS DE PERSISTÊNCIA - MOVIMENTAÇÕES DE ESTOQUE
  const handleAddMovimentacao = async (nova: Omit<MovimentacaoEstoque, 'id'>) => {
    await addDocData('movimentacoes', nova);
    const prod = produtos.find(p => p.id === nova.produtoId);
    if(prod) {
      await updateDocData('produtos', prod.id!, { quantidade: nova.tipo === 'Entrada' ? prod.quantidade + nova.quantidade : prod.quantidade - nova.quantidade });
    }
  };

  // CALLBACKS DE CONFIGURAÇÃO
  const handleSaveConfiguracao = async (nova: Configuracao) => {
    if (!dbStore.configuracao.salaoId) return;
    await setDocData('configuracoes', dbStore.configuracao.salaoId, nova);
  };

  // CALLBACKS DE FLUXO DE CAIXA E VENDA DE PRODUTOS
  const handleAddCaixaTransacao = async (nova: Omit<CaixaTransacao, 'id'>) => {
    await addDocData('caixa_transacoes', nova);
    const value = nova.tipo === 'Entrada' ? nova.valor : -nova.valor;
    if (caixaStatus?.aberto) {
      await updateDocData('caixa_status', dbStore.configuracao.salaoId!, {
        saldoAcumulado: (caixaStatus.saldoAcumulado || 0) + value
      });
    }
  };

  const handleDeleteCaixaTransacao = async (id: string) => {
    await deleteDocData('caixa_transacoes', id);
  };

  const handleUpdateCaixaStatus = async (status: CaixaStatus) => {
    await updateDocData('caixa_status', dbStore.configuracao.salaoId!, status);
  };

  const handleVendaProduto = async (produtoId: string, quantidade: number, formaPagamento: 'PIX' | 'Cartão' | 'Dinheiro', valorCustomizado?: number) => {
    const produto = produtos.find(p => p.id === produtoId);
    if (!produto || produto.quantidade < quantidade) return;
    
    await updateDocData('produtos', produtoId, { quantidade: produto.quantidade - quantidade });
    
    const mov: Omit<MovimentacaoEstoque, 'id'> = {
      produtoId,
      tipo: 'Saída',
      quantidade,
      data: new Date().toISOString().substring(0, 10),
      observacoes: 'Venda avulsa PDV'
    };
    await addDocData('movimentacoes', mov);
    
    if (caixaStatus?.aberto) {
      const total = valorCustomizado !== undefined ? valorCustomizado : produto.precoVenda * quantidade;
      const trans: Omit<CaixaTransacao, 'id'> = {
        data: new Date().toISOString().substring(0, 10),
        hora: new Date().toTimeString().substring(0, 5),
        tipo: 'Entrada',
        valor: total,
        descricao: `Venda: ${quantidade}x ${produto.nome}`,
        categoria: 'Venda de Produto',
        formaPagamento: formaPagamento
      };
      await addDocData('caixa_transacoes', trans);
      await updateDocData('caixa_status', dbStore.configuracao.salaoId!, {
        saldoAcumulado: (caixaStatus.saldoAcumulado || 0) + total
      });
    }
  };

  // REDEFINIR BANCO DE DADOS
  const handleResetDatabase = async () => {
    if (confirm('Atenção: Deseja sair da conta?')) {
      await signOut(auth);
    }
  };

  // Navegar para atendimento vindo do Dashboard
  const handleSelectAgendamentoForAtendimento = (a: Agendamento) => {
    setSelectedAgendamentoFromDashboard(a);
    setActiveTab('agenda');
  };

  // Lista dos itens de Menu
  const role = usuarioData?.role || 'admin';
  const isAdminOrProp = role === 'admin' || role === 'proprietario';
  const isGerente = role === 'gerente';
  const isRecepcao = role === 'recepcionista';
  const isProfissional = role === 'profissional';

  const ALL_MENU_ITEMS = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'agenda', label: 'Agenda & Caixa', icon: Calendar },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'profissionais', label: 'Profissionais', icon: UserCheck },
    { id: 'servicos', label: 'Serviços', icon: Scissors },
    { id: 'estoque', label: 'Estoque', icon: Package },
    { id: 'contas_receber', label: 'A Receber', icon: FileText },
    { id: 'relatorios', label: 'Relatórios', icon: BarChart2 },
    { id: 'configuracoes', label: 'Configurações', icon: Settings },
  ];

  const MENU_ITEMS = ALL_MENU_ITEMS.filter(item => {
    if (isAdminOrProp) return true;
    if (isGerente) return item.id !== 'configuracoes';
    if (isRecepcao) return ['dashboard', 'agenda', 'clientes', 'profissionais', 'servicos', 'estoque', 'contas_receber'].includes(item.id);
    if (isProfissional) return ['dashboard', 'agenda', 'clientes', 'servicos'].includes(item.id);
    return false;
  });

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            clientes={clientes}
            profissionais={profissionais}
            servicos={servicos}
            agendamentos={agendamentos}
            produtos={produtos}
            contasReceber={dbStore.contasReceber || []}
            caixaTransacoes={caixaTransacoes}
            caixaStatus={caixaStatus}
            configuracao={configuracao}
            onNavigate={setActiveTab}
            onSelectAgendamentoForAtendimento={handleSelectAgendamentoForAtendimento}
          />
        );
      case 'clientes':
        return (
          <Clientes 
            clientes={clientes}
            agendamentos={agendamentos}
            profissionais={profissionais}
            servicos={servicos}
            onAddCliente={handleAddCliente}
            onEditCliente={handleEditCliente}
            onDeleteCliente={handleDeleteCliente}
          />
        );
      case 'profissionais':
        return (
          <Profissionais 
            profissionais={profissionais}
            agendamentos={agendamentos}
            onAddProfissional={handleAddProfissional}
            onEditProfissional={handleEditProfissional}
            onDeleteProfissional={handleDeleteProfissional}
          />
        );
      case 'servicos':
        return (
          <Servicos 
            servicos={servicos}
            agendamentos={agendamentos}
            produtos={produtos}
            onAddServico={handleAddServico}
            onEditServico={handleEditServico}
            onDeleteServico={handleDeleteServico}
          />
        );
      case 'agenda':
        return (
          <Agenda 
            agendamentos={agendamentos}
            clientes={clientes}
            profissionais={profissionais}
            servicos={servicos}
            produtos={produtos}
            caixaTransacoes={caixaTransacoes}
            caixaStatus={caixaStatus}
            configuracao={configuracao}
            selectedAgendamentoFromDashboard={selectedAgendamentoFromDashboard}
            onClearDashboardSelection={() => setSelectedAgendamentoFromDashboard(null)}
            onAddAgendamento={handleAddAgendamento}
            onEditAgendamento={handleEditAgendamento}
            onDeleteAgendamento={handleDeleteAgendamento}
            onNavigateToClientes={() => setActiveTab('clientes')}
            onAddCaixaTransacao={handleAddCaixaTransacao}
            onDeleteCaixaTransacao={handleDeleteCaixaTransacao}
            onUpdateCaixaStatus={handleUpdateCaixaStatus}
            onVendaProduto={handleVendaProduto}
          />
        );
      case 'estoque':
        return (
          <Estoque 
            produtos={produtos}
            movimentacoes={movimentacoes}
            onAddProduto={handleAddProduto}
            onEditProduto={handleEditProduto}
            onDeleteProduto={handleDeleteProduto}
            onAddMovimentacao={handleAddMovimentacao}
          />
        );
      case 'contas_receber':
        return (
          <ContasReceber
            contas={dbStore.contasReceber || []}
            clientes={clientes}
            onUpdateConta={async (conta) => {
              await updateDocData('contas_receber', conta.id, conta);
            }}
            onAddCaixaTransacao={handleAddCaixaTransacao}
            onNavigateToClient={(clienteId) => {
              setGlobalSearch(clienteId);
              setActiveTab('clientes');
            }}
          />
        );
      case 'relatorios':
        return (
          <Relatorios 
            agendamentos={agendamentos}
            clientes={clientes}
            profissionais={profissionais}
            servicos={servicos}
            produtos={produtos}
            movimentacoes={movimentacoes}
            caixaTransacoes={caixaTransacoes}
            configuracao={configuracao}
          />
        );
      case 'configuracoes':
        return (
          <Configuracoes 
            configuracao={configuracao}
            onSaveConfiguracao={handleSaveConfiguracao}
            onResetData={handleResetDatabase}
          />
        );
      default:
        return <div className="text-center py-10">Componente não encontrado</div>;
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col md:flex-row font-sans text-gray-800 selection:bg-gold-200 selection:text-gold-900 animate-fade-in"
      style={{
        backgroundColor: configuracao.theme === 'dark' ? '#111827' : '#FAF8F6',
        color: configuracao.theme === 'dark' ? '#F9FAFB' : '#1F2937'
      }}
    >
      
      {/* 1. TOP HEADER MOBILE */}
      <header className="md:hidden bg-white border-b border-gold-100 px-5 py-4 flex items-center justify-between sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-2">
          {configuracao.logoUrl ? (
            <img src={configuracao.logoUrl} alt="Logo" className="w-8 h-8 object-contain" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gold-400 to-gold-500 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
          )}
          <div>
            <h1 className="font-serif font-bold text-sm tracking-tight text-gray-900 line-clamp-1">
              {configuracao.nomeSalao}
            </h1>
            <p className="text-[10px] text-gold-600 font-semibold uppercase tracking-wider">Painel Operacional</p>
          </div>
        </div>

        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-1.5 text-gold-700 hover:bg-gold-50 rounded-lg border border-gold-100 transition-colors"
          title="Menu Lateral"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* 2. MENU SIDEBAR DRAWER (MOBILE OVERLAY) */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-xs z-30 transition-all"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <aside 
            className="w-72 bg-white h-full border-r border-gold-100 shadow-2xl flex flex-col justify-between py-6 px-4 animate-slide-right"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-6">
              {/* Logo */}
              <div className="flex items-center gap-3 pb-5 border-b border-gold-50">
                {configuracao.logoUrl ? (
                  <img src={configuracao.logoUrl} alt="Logo" className="w-10 h-10 object-contain" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gold-400 to-gold-600 text-white flex items-center justify-center shadow-xs">
                    <Sparkles className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <h2 className="font-serif font-bold text-sm text-gray-900 leading-tight">
                    {configuracao.nomeSalao}
                  </h2>
                  <p className="text-[10px] text-gold-600 font-bold uppercase tracking-widest">Painel Administrativo</p>
                </div>
              </div>

              {/* Links de navegação */}
              <nav className="space-y-1">
                {MENU_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                        isActive 
                          ? 'bg-gold-500 text-white shadow-sm font-bold' 
                          : 'text-gray-500 hover:text-gold-700 hover:bg-gold-50/50'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            
            {/* Informações do Usuário */}
            <div className="pt-4 border-t border-gold-50 mt-4">
              <div className="flex items-center gap-3 px-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-gold-100 text-gold-700 flex items-center justify-center shrink-0 font-bold text-sm">
                  {usuarioData?.nome?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-900 truncate">{usuarioData?.nome}</p>
                  <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
                  <p className="text-[9px] text-gold-600 font-semibold uppercase mt-0.5">{usuarioData?.role}</p>
                </div>
              </div>
              <button
                onClick={() => signOut(auth)}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>Sair do Sistema</span>
              </button>
            </div>

            {/* Rodapé do Menu */}
            <div className="pt-4 border-t border-gold-50 text-center">
              <p className="text-[10px] text-gray-400 font-medium">Powered by StudioFlow®</p>
              <p className="text-[9px] text-gray-400 font-medium mt-0.5">Versão 1.0</p>
            </div>
          </aside>
        </div>
      )}

      {/* 3. PERMANENT LEFT SIDEBAR (DESKTOP) */}
      <aside className="hidden md:flex w-64 bg-white border-r border-gold-100 flex-col justify-between py-8 px-5 sticky top-0 h-screen shrink-0">
        
        <div className="space-y-8">
          {/* Logo e Nome */}
          <div className="flex items-center gap-3.5 pb-6 border-b border-gold-100/50">
            {configuracao.logoUrl ? (
              <img src={configuracao.logoUrl} alt="Logo" className="w-11 h-11 object-contain shrink-0" />
            ) : (
              <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-gold-400 to-gold-600 text-white flex items-center justify-center shadow-xs shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
            )}
            <div>
              <h2 className="font-serif font-bold text-sm text-gray-900 leading-tight">
                {configuracao.nomeSalao}
              </h2>
              <p className="text-[10px] text-gold-600 font-bold uppercase tracking-widest mt-0.5">Gestão de Beleza</p>
            </div>
          </div>

          {/* Links de navegação */}
          <nav className="space-y-1">
            {MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-gold-500 text-white shadow-xs font-bold' 
                      : 'text-gray-500 hover:text-gold-600 hover:bg-gold-50/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gold-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        
        {/* Informações do Usuário */}
        <div className="pt-4 border-t border-gold-100 mt-4">
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-gold-100 text-gold-700 flex items-center justify-center shrink-0 font-bold text-sm">
              {usuarioData?.nome?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-900 truncate">{usuarioData?.nome}</p>
              <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
              <p className="text-[9px] text-gold-600 font-semibold uppercase mt-0.5">{usuarioData?.role}</p>
            </div>
          </div>
          <button
            onClick={() => signOut(auth)}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Sair do Sistema</span>
          </button>
        </div>

        {/* Rodapé do Menu */}
        <div className="pt-4 border-t border-gold-100 text-center">
          <p className="text-[10px] text-gray-400 font-medium">Powered by StudioFlow®</p>
          <p className="text-[9px] text-gray-400 font-medium mt-1">Versão 1.0</p>
        </div>

      </aside>

      {/* 4. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        
        {/* HEADER / TOP-BAR COM PESQUISA GLOBAL INTEGRADORA */}
        <div className="bg-white border-b border-gold-100/50 py-3.5 px-6 md:px-10 sticky top-0 z-20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          
          {/* BARRA DE PESQUISA */}
          <div className="relative flex-1 max-w-lg">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gold-600/70" />
              <input
                type="text"
                placeholder="Pesquisa rápida global (Clientes, Serviços, Produtos...)"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="w-full bg-gold-50/20 hover:bg-gold-50/40 focus:bg-white border border-gold-100 focus:border-gold-300 rounded-full py-2.5 pl-10 pr-10 text-xs text-gray-800 placeholder-gray-400 focus:outline-hidden transition-all shadow-xs"
              />
              {globalSearch && (
                <button 
                  type="button"
                  onClick={() => setGlobalSearch('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] bg-gold-100 hover:bg-gold-200 text-gold-800 px-2 py-0.5 rounded-full font-bold transition-colors cursor-pointer"
                >
                  Limpar
                </button>
              )}
            </div>

            {/* FLOATING GROUPED SEARCH RESULTS OVERLAY */}
            {searchResults && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gold-100 rounded-2xl shadow-xl z-50 p-4 max-h-[380px] overflow-y-auto animate-slide-up">
                <div className="flex items-center justify-between pb-2 border-b border-gold-50 mb-3">
                  <span className="text-[10px] font-bold text-gold-600 uppercase tracking-wider">Resultados da Pesquisa ({searchResults.totalResults})</span>
                  <button 
                    type="button"
                    onClick={() => setGlobalSearch('')} 
                    className="text-[10px] text-gray-400 hover:text-gray-600 font-bold uppercase cursor-pointer"
                  >
                    Fechar
                  </button>
                </div>

                {searchResults.totalResults === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4 italic">Nenhum registro encontrado para "{globalSearch}"</p>
                ) : (
                  <div className="space-y-4 text-left">
                    
                    {/* Clientes Group */}
                    {searchResults.clientes.length > 0 && (
                      <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 border-b border-gold-50 pb-0.5">Clientes</p>
                        <div className="space-y-1">
                          {searchResults.clientes.map(c => (
                            <button
                              type="button"
                              key={c.id}
                              onClick={() => {
                                setActiveTab('clientes');
                                setGlobalSearch('');
                              }}
                              className="w-full text-left text-xs p-2 rounded-lg hover:bg-gold-50/50 flex items-center justify-between transition-colors cursor-pointer"
                            >
                              <div>
                                <span className="font-semibold text-gray-800">{c.nome}</span>
                                <span className="text-gray-400 text-[10px] ml-2">{c.telefone}</span>
                              </div>
                              <ArrowRight className="w-3.5 h-3.5 text-gold-500" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Profissionais Group */}
                    {searchResults.profissionais.length > 0 && (
                      <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 border-b border-gold-50 pb-0.5">Profissionais</p>
                        <div className="space-y-1">
                          {searchResults.profissionais.map(p => (
                            <button
                              type="button"
                              key={p.id}
                              onClick={() => {
                                setActiveTab('profissionais');
                                setGlobalSearch('');
                              }}
                              className="w-full text-left text-xs p-2 rounded-lg hover:bg-gold-50/50 flex items-center justify-between transition-colors cursor-pointer"
                            >
                              <div>
                                <span className="font-semibold text-gray-800">{p.nome}</span>
                                <span className="text-gray-400 text-[10px] ml-2">Comissão: {p.comisaoCustomizada || p.comissaoPadrao}%</span>
                              </div>
                              <ArrowRight className="w-3.5 h-3.5 text-gold-500" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Serviços Group */}
                    {searchResults.servicos.length > 0 && (
                      <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 border-b border-gold-50 pb-0.5">Serviços</p>
                        <div className="space-y-1">
                          {searchResults.servicos.map(s => (
                            <button
                              type="button"
                              key={s.id}
                              onClick={() => {
                                setActiveTab('servicos');
                                setGlobalSearch('');
                              }}
                              className="w-full text-left text-xs p-2 rounded-lg hover:bg-gold-50/50 flex items-center justify-between transition-colors cursor-pointer"
                            >
                              <div>
                                <span className="font-semibold text-gray-800">{s.nome}</span>
                                <span className="text-gold-600 text-[10px] font-bold ml-2">R$ {s.valor}</span>
                              </div>
                              <ArrowRight className="w-3.5 h-3.5 text-gold-500" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Estoque Group */}
                    {searchResults.produtos.length > 0 && (
                      <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 border-b border-gold-50 pb-0.5">Estoque de Produtos</p>
                        <div className="space-y-1">
                          {searchResults.produtos.map(p => (
                            <button
                              type="button"
                              key={p.id}
                              onClick={() => {
                                setActiveTab('estoque');
                                setGlobalSearch('');
                              }}
                              className="w-full text-left text-xs p-2 rounded-lg hover:bg-gold-50/50 flex items-center justify-between transition-colors cursor-pointer"
                            >
                              <div>
                                <span className="font-semibold text-gray-800">{p.nome}</span>
                                <span className={`text-[10px] ml-2 font-bold ${p.quantidade <= p.estoqueMinimo ? 'text-red-500' : 'text-gray-400'}`}>
                                  {p.quantidade} un em estoque
                                </span>
                              </div>
                              <ArrowRight className="w-3.5 h-3.5 text-gold-500" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Agendamentos Group */}
                    {searchResults.agendamentos.length > 0 && (
                      <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 border-b border-gold-50 pb-0.5">Agendamentos</p>
                        <div className="space-y-1">
                          {searchResults.agendamentos.map(a => {
                            const cNome = clientes.find(c => c.id === a.clienteId)?.nome || 'Cliente';
                            const sNome = servicos.find(s => s.id === a.servicoId)?.nome || 'Serviço';
                            return (
                              <button
                                type="button"
                                key={a.id}
                                onClick={() => {
                                  setActiveTab('agenda');
                                  setGlobalSearch('');
                                }}
                                className="w-full text-left text-xs p-2 rounded-lg hover:bg-gold-50/50 flex items-center justify-between transition-colors cursor-pointer"
                              >
                                <div>
                                  <span className="font-semibold text-gray-800">{cNome} — {sNome}</span>
                                  <span className="text-gray-400 text-[10px] ml-2">{a.data} às {a.hora}</span>
                                </div>
                                <ArrowRight className="w-3.5 h-3.5 text-gold-500" />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>
            )}
          </div>

          {/* INDICADOR DE REDE LOCAL / OFFLINE-FIRST */}
          <div className="flex items-center gap-2.5 text-[11px] font-bold text-gray-400 shrink-0 self-center">
            <NotificationCenter />
            <span className="text-gold-200">|</span>
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="tracking-wider uppercase hidden sm:inline">Nuvem Sincronizada</span>
            <span className="text-gold-200 hidden sm:inline">|</span>
            <span className="font-serif italic font-medium text-gold-600 tracking-wide text-xs">{configuracao.nomeSalao}</span>
          </div>

        </div>

        {/* ÁREA REAL DE CONTEÚDO */}
        <main className="flex-1 p-4 sm:p-8 md:p-10 max-w-7xl mx-auto w-full">
          {renderActiveComponent()}
        </main>
      </div>

    </div>
  );
}
