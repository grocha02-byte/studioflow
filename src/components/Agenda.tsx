/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Search, 
  Clock, 
  User, 
  Scissors, 
  Check, 
  X, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  DollarSign,
  Coffee,
  HelpCircle,
  TrendingDown,
  Printer,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShoppingBag,
  FileText,
  Lock,
  Unlock
} from 'lucide-react';
import { Agendamento, Cliente, Profissional, Servico, StatusAgendamento, CaixaTransacao, CaixaStatus, Produto, Configuracao } from '../types';

interface AgendaProps {
  agendamentos: Agendamento[];
  clientes: Cliente[];
  profissionais: Profissional[];
  servicos: Servico[];
  produtos: Produto[];
  caixaTransacoes: CaixaTransacao[];
  caixaStatus: CaixaStatus;
  configuracao: Configuracao;
  selectedAgendamentoFromDashboard: Agendamento | null;
  onClearDashboardSelection: () => void;
  onAddAgendamento: (a: Omit<Agendamento, 'id'>) => void;
  onEditAgendamento: (a: Agendamento) => void;
  onDeleteAgendamento: (id: string) => void;
  onNavigateToClientes: () => void;
  onAddCaixaTransacao: (tx: Omit<CaixaTransacao, 'id' | 'data' | 'hora'>) => void;
  onDeleteCaixaTransacao: (id: string) => void;
  onUpdateCaixaStatus: (status: CaixaStatus) => void;
  onVendaProduto: (produtoId: string, quantidade: number, formaPagamento: 'Dinheiro' | 'PIX' | 'Cartão' | 'Fiado', valorCustomizado?: number) => void;
}

const WORKING_HOURS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
];

const WEEK_DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export default function Agenda({
  agendamentos,
  clientes,
  profissionais,
  servicos,
  produtos,
  caixaTransacoes,
  caixaStatus,
  configuracao,
  selectedAgendamentoFromDashboard,
  onClearDashboardSelection,
  onAddAgendamento,
  onEditAgendamento,
  onDeleteAgendamento,
  onNavigateToClientes,
  onAddCaixaTransacao,
  onDeleteCaixaTransacao,
  onUpdateCaixaStatus,
  onVendaProduto
}: AgendaProps) {
  // Abas superiores: "calendario" ou "caixa"
  const [activeSubTab, setActiveSubTab] = useState<'calendario' | 'caixa'>('calendario');

  // Modos de visualização do calendário: 'mensal' | 'semanal' | 'diario'
  const [calendarMode, setCalendarMode] = useState<'mensal' | 'semanal' | 'diario'>('diario');

  // Data base selecionada para navegação (padrão '2026-07-07')
  const [currentDate, setCurrentDate] = useState(() => {
    // Se hoje for 2026-07-07, usamos essa. Caso contrário usamos a data atual no formato YYYY-MM-DD
    const todayStr = new Date().toISOString().split('T')[0];
    return todayStr.startsWith('2026') ? todayStr : '2026-07-07';
  });

  const getWorkingHoursForDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00Z');
    const dayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const dayName = dayNames[d.getUTCDay()];
    
    let baseHours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];
    
    if (configuracao && Array.isArray(configuracao.horarioFuncionamento)) {
      const h = configuracao.horarioFuncionamento.find((x: any) => x.dia === dayName);
      if (h && !h.aberto) return []; // Fechado
      
      if (h && h.aberto && h.abertura && h.fechamento) {
        const slots = [];
        let [hStart, mStart] = h.abertura.split(':').map(Number);
        let [hEnd, mEnd] = h.fechamento.split(':').map(Number);
        
        let [hBreakStart, mBreakStart] = h.intervaloInicio ? h.intervaloInicio.split(':').map(Number) : [-1, -1];
        let [hBreakEnd, mBreakEnd] = h.intervaloFim ? h.intervaloFim.split(':').map(Number) : [-1, -1];

        let currH = hStart;
        let currM = mStart;
        
        while (currH < hEnd || (currH === hEnd && currM <= mEnd)) {
          const timeStr = `${currH.toString().padStart(2, '0')}:${currM.toString().padStart(2, '0')}`;
          
          let isBreak = false;
          if (hBreakStart !== -1) {
             const currMins = currH * 60 + currM;
             const breakStartMins = hBreakStart * 60 + mBreakStart;
             const breakEndMins = hBreakEnd * 60 + mBreakEnd;
             if (currMins >= breakStartMins && currMins < breakEndMins) {
               isBreak = true;
             }
          }
          
          if (!isBreak && (currH < hEnd || currM < mEnd)) {
            slots.push(timeStr);
          }
          
          currM += 30;
          if (currM >= 60) {
            currH += 1;
            currM -= 60;
          }
        }
        return slots;
      }
    }
    return baseHours;
  };

  const currentWorkingHours = getWorkingHoursForDate(currentDate);

  // Controle de Modais
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCaixaFormOpen, setIsCaixaFormOpen] = useState(false);
  const [isVendaFormOpen, setIsVendaFormOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isCaixaResetConfirmOpen, setIsCaixaResetConfirmOpen] = useState(false);

  // Seleções para checkout / recibo
  const [selectedAgendamento, setSelectedAgendamento] = useState<Agendamento | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<Agendamento | null>(null);

  // Campos do formulário de agendamento (Novo / Editar)
  const [editingAgendamento, setEditingAgendamento] = useState<Agendamento | null>(null);
  const [clienteId, setClienteId] = useState('');
  const [profissionalId, setProfissionalId] = useState('');
  const [servicoId, setServicoId] = useState('');
  const [dataForm, setDataForm] = useState('2026-07-07');
  const [horaForm, setHoraForm] = useState('09:00');
  const [statusForm, setStatusForm] = useState<StatusAgendamento>('Agendado');
  const [observacoesForm, setObservacoesForm] = useState('');
  const [formError, setFormError] = useState('');

  // Campos do formulário de finalização/checkout (Atendimento)
  const [checkoutFormaPagamento, setCheckoutFormaPagamento] = useState<'Dinheiro' | 'PIX' | 'Cartão' | 'Fiado'>('PIX');
  const [checkoutValorReal, setCheckoutValorReal] = useState<number>(0);
  const [checkoutComissaoValor, setCheckoutComissaoValor] = useState<number>(0);
  const [checkoutObservacoes, setCheckoutObservacoes] = useState('');

  // Campos de abertura/fechamento do caixa
  const [caixaOpeningVal, setCaixaOpeningVal] = useState<number>(150);

  // Campos do formulário de lançamentos manuais do caixa
  const [caixaTxTipo, setCaixaTxTipo] = useState<'Entrada' | 'Saída'>('Saída');
  const [caixaTxDesc, setCaixaTxDesc] = useState('');
  const [caixaTxVal, setCaixaTxVal] = useState<number>(0);
  const [caixaTxCat, setCaixaTxCat] = useState<'Despesa' | 'Aporte' | 'Sangria'>('Despesa');
  const [caixaTxPag, setCaixaTxPag] = useState<'Dinheiro' | 'PIX' | 'Cartão' | 'Fiado'>('Dinheiro');

  // Campos do formulário de venda de produtos
  const [vendaProdutoId, setVendaProdutoId] = useState('');
  const [vendaQuantidade, setVendaQuantidade] = useState<number>(1);
  const [vendaFormaPagamento, setVendaFormaPagamento] = useState<'Dinheiro' | 'PIX' | 'Cartão' | 'Fiado'>('PIX');
  const [vendaValorPersonalizado, setVendaValorPersonalizado] = useState<string>('');
  const [vendaError, setVendaError] = useState('');

  // Processamento automático se houver seleção vinda do Dashboard
  useEffect(() => {
    if (selectedAgendamentoFromDashboard) {
      setCurrentDate(selectedAgendamentoFromDashboard.data);
      handleOpenCheckout(selectedAgendamentoFromDashboard);
      onClearDashboardSelection();
    }
  }, [selectedAgendamentoFromDashboard]);

  // Auxiliares de consulta
  const getCliente = (id: string) => clientes.find(c => c.id === id);
  const getProfissional = (id: string) => profissionais.find(p => p.id === id);
  const getServico = (id: string) => servicos.find(s => s.id === id);
  const getProduto = (id: string) => produtos.find(p => p.id === id);

  // Formatar Moeda
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // Obter nome legível do dia da semana
  const getWeekDayName = (dateStr: string) => {
    const parts = dateStr.split('-');
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return WEEK_DAYS[d.getDay()];
  };

  // Formatar data para exibição pt-BR (DD/MM/AAAA)
  const formatDateBR = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  // Navegação de Datas
  const handleNavigateDate = (direction: 'prev' | 'next' | 'today') => {
    const d = new Date(currentDate + 'T00:00:00');
    if (direction === 'today') {
      setCurrentDate('2026-07-07');
      return;
    }

    if (calendarMode === 'diario') {
      d.setDate(d.getDate() + (direction === 'next' ? 1 : -1));
    } else if (calendarMode === 'semanal') {
      d.setDate(d.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      d.setMonth(d.getMonth() + (direction === 'next' ? 1 : -1));
    }

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setCurrentDate(`${yyyy}-${mm}-${dd}`);
  };

  // ==========================================
  // LOGICA DO CALENDARIO MENSAL
  // ==========================================
  const getMonthWeeks = () => {
    const parts = currentDate.split('-');
    const year = Number(parts[0]);
    const month = Number(parts[1]) - 1; // 0-indexed

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startDayOfWeek = firstDayOfMonth.getDay();
    const totalDays = lastDayOfMonth.getDate();

    const calendarGrid = [];
    
    // Fill previous month days (empty placeholders)
    for (let i = 0; i < startDayOfWeek; i++) {
      calendarGrid.push(null);
    }

    // Fill current month days
    for (let day = 1; day <= totalDays; day++) {
      const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      calendarGrid.push({ day, dateStr: dStr });
    }

    // Split into weeks (rows of 7 elements)
    const weeks = [];
    while (calendarGrid.length > 0) {
      weeks.push(calendarGrid.splice(0, 7));
    }
    return weeks;
  };

  // ==========================================
  // LOGICA DO CALENDARIO SEMANAL
  // ==========================================
  const getWeekDays = () => {
    const parts = currentDate.split('-');
    const base = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    const dayOfWeek = base.getDay(); // 0 (Dom) a 6 (Sáb)
    
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() - dayOfWeek + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      weekDays.push(`${yyyy}-${mm}-${dd}`);
    }
    return weekDays;
  };

  // ==========================================
  // CONTROLADORES DE MODAIS DE AGENDAMENTO
  // ==========================================
  const handleNewAgendamento = (hour?: string, date?: string) => {
    setEditingAgendamento(null);
    setClienteId(clientes[0]?.id || '');
    const primeiroAtivo = profissionais.find(p => p.ativo);
    setProfissionalId(primeiroAtivo?.id || profissionais[0]?.id || '');
    setServicoId(servicos[0]?.id || '');
    setDataForm(date || currentDate);
    setHoraForm(hour || '09:00');
    setStatusForm('Agendado');
    setObservacoesForm('');
    setFormError('');
    setIsFormOpen(true);
  };

  const handleEditClick = (e: React.MouseEvent, a: Agendamento) => {
    e.stopPropagation();
    setEditingAgendamento(a);
    setClienteId(a.clienteId);
    setProfissionalId(a.profissionalId);
    setServicoId(a.servicoId);
    setDataForm(a.data);
    setHoraForm(a.hora);
    setStatusForm(a.status);
    setObservacoesForm(a.observacoes || '');
    setFormError('');
    setIsFormOpen(true);
  };

  const handleSaveAgendamento = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteId) return setFormError('Selecione uma cliente.');
    if (!profissionalId) return setFormError('Selecione um profissional.');
    if (!servicoId) return setFormError('Selecione um serviço.');
    if (!dataForm) return setFormError('Defina a data.');
    if (!horaForm) return setFormError('Defina o horário.');
    
    const validHours = getWorkingHoursForDate(dataForm);
    if (validHours.length === 0) {
      return setFormError('O salão está fechado nesta data.');
    }
    if (!validHours.includes(horaForm)) {
      return setFormError(`O horário ${horaForm} está fora do horário de funcionamento ou em horário de pausa.`);
    }

    if (editingAgendamento) {
      onEditAgendamento({
        ...editingAgendamento,
        clienteId,
        profissionalId,
        servicoId,
        data: dataForm,
        hora: horaForm,
        status: statusForm,
        observacoes: observacoesForm
      });
    } else {
      onAddAgendamento({
        clienteId,
        profissionalId,
        servicoId,
        data: dataForm,
        hora: horaForm,
        status: statusForm,
        observacoes: observacoesForm
      });
    }
    setIsFormOpen(false);
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Excluir este agendamento estornará a comissão e retornará os produtos vinculados ao estoque. Confirmar?')) {
      onDeleteAgendamento(id);
      setIsCheckoutOpen(false);
      setSelectedAgendamento(null);
    }
  };

  const handleOpenCheckout = (a: Agendamento) => {
    setSelectedAgendamento(a);
    const s = getServico(a.servicoId);
    const p = getProfissional(a.profissionalId);
    const valorBase = s ? s.valor : 0;
    const comissaoPct = p ? p.comissao : (s ? s.comissaoPadrao : 40);

    setCheckoutValorReal(valorBase);
    setCheckoutComissaoValor((valorBase * comissaoPct) / 100);
    setCheckoutFormaPagamento('PIX');
    setCheckoutObservacoes(a.observacoes || '');
    setIsCheckoutOpen(true);
  };

  const handleCheckoutValorChange = (val: number) => {
    setCheckoutValorReal(val);
    if (selectedAgendamento) {
      const s = getServico(selectedAgendamento.servicoId);
      const p = getProfissional(selectedAgendamento.profissionalId);
      const comissaoPct = p ? p.comissao : (s ? s.comissaoPadrao : 40);
      setCheckoutComissaoValor((val * comissaoPct) / 100);
    }
  };

  const handleFinalizeAtendimento = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgendamento) return;

    onEditAgendamento({
      ...selectedAgendamento,
      status: 'Concluído',
      formaPagamento: checkoutFormaPagamento,
      valorPago: checkoutValorReal,
      comissaoProfissional: checkoutComissaoValor,
      observacoes: checkoutObservacoes,
      dataFinalizacao: selectedAgendamento.data
    });

    setIsCheckoutOpen(false);
    // Oferecer emissão imediata do recibo ao finalizar
    setSelectedReceipt({
      ...selectedAgendamento,
      status: 'Concluído',
      formaPagamento: checkoutFormaPagamento,
      valorPago: checkoutValorReal,
      comissaoProfissional: checkoutComissaoValor,
      observacoes: checkoutObservacoes,
      dataFinalizacao: selectedAgendamento.data
    });
    setIsReceiptOpen(true);
    setSelectedAgendamento(null);
  };

  const handleQuickStatusChange = (a: Agendamento, newStatus: StatusAgendamento) => {
    onEditAgendamento({
      ...a,
      status: newStatus
    });
    setSelectedAgendamento(null);
    setIsCheckoutOpen(false);
  };

  // ==========================================
  // CAIXA DIÁRIO - CONTROLADORES
  // ==========================================
  const handleOpenCaixa = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateCaixaStatus({
      aberto: true,
      saldoAbertura: caixaOpeningVal,
      dataAbertura: currentDate
    });
    // Adicionar transação de abertura no histórico do caixa
    onAddCaixaTransacao({
      tipo: 'Entrada',
      descricao: 'Saldo de Abertura do Caixa',
      valor: caixaOpeningVal,
      categoria: 'Aporte',
      formaPagamento: 'Dinheiro'
    });
  };

  const handleCloseCaixa = () => {
    if (window.confirm('Deseja realmente FECHAR o caixa do dia de hoje? Isso imprimirá o relatório de fechamento.')) {
      onUpdateCaixaStatus({
        aberto: false,
        saldoAbertura: 0,
        dataAbertura: undefined
      });
      // Abrir impressão do relatório de fechamento
      window.print();
    }
  };

  const handleSaveCaixaTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caixaTxDesc.trim()) return;
    if (caixaTxVal <= 0) return;

    onAddCaixaTransacao({
      tipo: caixaTxTipo,
      descricao: caixaTxDesc,
      valor: caixaTxVal,
      categoria: caixaTxTipo === 'Entrada' ? 'Aporte' : (caixaTxCat as any),
      formaPagamento: caixaTxPag
    });

    setIsCaixaFormOpen(false);
    setCaixaTxDesc('');
    setCaixaTxVal(0);
  };

  const handleSaveVenda = (e: React.FormEvent) => {
    e.preventDefault();
    setVendaError('');
    if (!vendaProdutoId) return setVendaError('Selecione um produto.');
    if (vendaQuantidade <= 0) return setVendaError('Defina uma quantidade válida.');

    const p = getProduto(vendaProdutoId);
    if (!p) return setVendaError('Produto não encontrado.');
    if (p.quantidade < vendaQuantidade) {
      return setVendaError(`Estoque insuficiente! Estoque atual: ${p.quantidade} un.`);
    }

    const valorFinal = vendaValorPersonalizado.trim() !== '' 
      ? Number(vendaValorPersonalizado) 
      : p.valorVenda * vendaQuantidade;

    onVendaProduto(vendaProdutoId, vendaQuantidade, vendaFormaPagamento, valorFinal);

    setIsVendaFormOpen(false);
    setVendaProdutoId('');
    setVendaQuantidade(1);
    setVendaValorPersonalizado('');
  };

  // ==========================================
  // METRICAS DO CAIXA DIÁRIO (PARA EXIBIÇÃO)
  // ==========================================
  const txsFiltradas = caixaTransacoes.filter(t => t.data === currentDate);
  const totalEntradas = txsFiltradas.filter(t => t.tipo === 'Entrada').reduce((acc, t) => acc + t.valor, 0);
  const totalSaidas = txsFiltradas.filter(t => t.tipo === 'Saída').reduce((acc, t) => acc + t.valor, 0);
  const saldoCaixa = (caixaStatus.dataAbertura === currentDate ? caixaStatus.saldoAbertura : 0) + totalEntradas - totalSaidas;

  const entradasDinheiro = txsFiltradas.filter(t => t.tipo === 'Entrada' && t.formaPagamento === 'Dinheiro').reduce((acc, t) => acc + t.valor, 0);
  const entradasPIX = txsFiltradas.filter(t => t.tipo === 'Entrada' && t.formaPagamento === 'PIX').reduce((acc, t) => acc + t.valor, 0);
  const entradasCartao = txsFiltradas.filter(t => t.tipo === 'Entrada' && t.formaPagamento === 'Cartão').reduce((acc, t) => acc + t.valor, 0);
  const entradasFiado = txsFiltradas.filter(t => t.tipo === 'Entrada' && t.formaPagamento === 'Fiado').reduce((acc, t) => acc + t.valor, 0);

  // Impressão rápida
  const triggerPrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in print:p-0">
      
      {/* 1. SELETOR DE SUBABAS (AGENDA vs CAIXA) - DESIGN PREMIUM */}
      <div className="flex border-b border-gold-100 pb-px print:hidden">
        <button
          onClick={() => setActiveSubTab('calendario')}
          className={`px-6 py-3 font-serif font-semibold text-base transition-all border-b-2 cursor-pointer ${
            activeSubTab === 'calendario'
              ? 'border-gold-500 text-gold-800 font-bold'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Calendário de Agendamentos
        </button>
        <button
          onClick={() => setActiveSubTab('caixa')}
          className={`px-6 py-3 font-serif font-semibold text-base transition-all border-b-2 cursor-pointer ${
            activeSubTab === 'caixa'
              ? 'border-gold-500 text-gold-800 font-bold'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Caixa Diário & Vendas
        </button>
      </div>

      {/* ========================================================== */}
      {/* ABBA 1: CALENDÁRIO & AGENDAMENTOS */}
      {/* ========================================================== */}
      {activeSubTab === 'calendario' && (
        <div className="space-y-6 print:hidden">
          
          {/* Header Calendário */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-serif font-semibold text-gray-800">Agenda Interativa</h2>
              <p className="text-sm text-gray-500">Alterne entre visualização mensal, semanal ou diária para controle absoluto de horários.</p>
            </div>
            
            {/* Controles de Modo do Calendário */}
            <div className="flex items-center gap-2 self-start lg:self-center">
              <div className="bg-gold-50/50 p-1 rounded-xl border border-gold-100 flex gap-1">
                {(['mensal', 'semanal', 'diario'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setCalendarMode(mode)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all cursor-pointer ${
                      calendarMode === mode
                        ? 'bg-gold-500 text-white font-bold shadow-xs'
                        : 'text-gray-500 hover:text-gold-700'
                    }`}
                  >
                    {mode === 'diario' ? 'Dia' : mode === 'semanal' ? 'Semana' : 'Mês'}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handleNewAgendamento()}
                className="bg-gold-500 hover:bg-gold-600 text-white font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition-all text-xs shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Agendamento</span>
              </button>
            </div>
          </div>

          {/* Navegador de Data Base */}
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gold-100 shadow-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleNavigateDate('prev')}
                className="p-2 text-gray-500 hover:bg-gold-50 hover:text-gold-700 rounded-lg border border-gold-50 transition-colors"
                title="Voltar"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleNavigateDate('today')}
                className="px-3 py-1.5 text-xs font-semibold text-gold-700 hover:bg-gold-50 border border-gold-100 rounded-lg transition-all"
              >
                Voltar para Hoje
              </button>
              <button
                onClick={() => handleNavigateDate('next')}
                className="p-2 text-gray-500 hover:bg-gold-50 hover:text-gold-700 rounded-lg border border-gold-50 transition-colors"
                title="Avançar"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Label da Data Ativa */}
            <h3 className="font-serif font-bold text-base sm:text-lg text-gray-800 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-gold-500" />
              {calendarMode === 'diario' && (
                <span>{formatDateBR(currentDate)} <span className="text-xs text-gold-600 font-sans font-bold capitalize">({getWeekDayName(currentDate)})</span></span>
              )}
              {calendarMode === 'semanal' && (
                <span className="text-sm sm:text-base">
                  Semana de {formatDateBR(getWeekDays()[0])} a {formatDateBR(getWeekDays()[6])}
                </span>
              )}
              {calendarMode === 'mensal' && (
                <span>
                  {new Date(currentDate + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()}
                </span>
              )}
            </h3>

            {/* Input Manual Picker */}
            <input
              type="date"
              value={currentDate}
              onChange={(e) => setCurrentDate(e.target.value)}
              className="bg-gold-50/20 border border-gold-100 rounded-lg px-2.5 py-1 text-xs text-gray-700 font-medium focus:outline-hidden focus:bg-white"
            />
          </div>

          {/* ========================================= */}
          {/* VISUALIZAÇÃO 1: MENSAL */}
          {/* ========================================= */}
          {calendarMode === 'mensal' && (
            <div className="bg-white rounded-2xl border border-gold-100 shadow-xs overflow-hidden p-5 space-y-4">
              <div className="grid grid-cols-7 text-center font-serif font-bold text-xs text-gold-700 uppercase tracking-wider pb-2 border-b border-gold-100/50">
                <div>Dom</div><div>Seg</div><div>Ter</div><div>Qua</div><div>Qui</div><div>Sex</div><div>Sáb</div>
              </div>
              
              <div className="grid grid-cols-7 gap-2">
                {getMonthWeeks().map((week, wIdx) => (
                  <React.Fragment key={wIdx}>
                    {week.map((dayObj, dIdx) => {
                      if (!dayObj) {
                        return <div key={`empty-${dIdx}`} className="bg-gray-50/30 rounded-xl min-h-[95px] border border-gray-100/20" />;
                      }

                      const agsDia = agendamentos.filter(a => a.data === dayObj.dateStr);
                      const isToday = dayObj.dateStr === '2026-07-07';
                      const isSelected = dayObj.dateStr === currentDate;

                      return (
                        <div
                          key={dayObj.dateStr}
                          onClick={() => {
                            setCurrentDate(dayObj.dateStr);
                            setCalendarMode('diario');
                          }}
                          className={`p-2 rounded-xl min-h-[100px] border flex flex-col justify-between transition-all cursor-pointer hover:border-gold-300 hover:shadow-xs group ${
                            isSelected 
                              ? 'bg-gold-50/20 border-gold-400 ring-1 ring-gold-400'
                              : isToday 
                              ? 'bg-pink-50/40 border-pink-200' 
                              : 'bg-white border-gold-50'
                          }`}
                        >
                          {/* Topo do dia */}
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-bold font-display w-6 h-6 flex items-center justify-center rounded-full ${
                              isToday ? 'bg-pink-500 text-white' : 'text-gray-700 group-hover:text-gold-600'
                            }`}>
                              {dayObj.day}
                            </span>
                            {agsDia.length > 0 && (
                              <span className="text-[10px] bg-gold-100 text-gold-800 px-1.5 py-0.5 rounded-md font-bold">
                                {agsDia.length} at.
                              </span>
                            )}
                          </div>

                          {/* Chips dos Atendimentos */}
                          <div className="space-y-1 mt-2">
                            {agsDia.slice(0, 3).map((a) => {
                              const cName = getCliente(a.clienteId)?.nome.split(' ')[0] || 'Cliente';
                              const statusColor = a.status === 'Concluído' 
                                ? 'bg-green-100 text-green-700 border-green-200' 
                                : a.status === 'Cancelado'
                                ? 'bg-red-100 text-red-700 border-red-200'
                                : a.status === 'Em atendimento'
                                ? 'bg-pink-100 text-pink-700 border-pink-200'
                                : 'bg-blue-100 text-blue-700 border-blue-200';
                              return (
                                <div 
                                  key={a.id} 
                                  className={`text-[9px] px-1.5 py-0.5 rounded border truncate ${statusColor}`}
                                  title={`${a.hora} - ${cName}`}
                                >
                                  {a.hora} {cName}
                                </div>
                              );
                            })}
                            {agsDia.length > 3 && (
                              <p className="text-[8px] text-gray-400 text-center font-bold font-sans">+ {agsDia.length - 3} mais</p>
                            )}
                          </div>

                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {/* ========================================= */}
          {/* VISUALIZAÇÃO 2: SEMANAL */}
          {/* ========================================= */}
          {calendarMode === 'semanal' && (
            <div className="bg-white rounded-2xl border border-gold-100 shadow-xs overflow-hidden p-5 overflow-x-auto">
              <div className="min-w-[850px] grid grid-cols-7 gap-3">
                {getWeekDays().map((dayStr) => {
                  const agsDia = agendamentos.filter(a => a.data === dayStr).sort((a,b) => a.hora.localeCompare(b.hora));
                  const isToday = dayStr === '2026-07-07';
                  const isSelected = dayStr === currentDate;

                  return (
                    <div 
                      key={dayStr}
                      className={`rounded-xl border flex flex-col min-h-[350px] p-3 transition-all ${
                        isSelected 
                          ? 'bg-gold-50/10 border-gold-300 ring-1 ring-gold-200' 
                          : isToday 
                          ? 'bg-pink-50/10 border-pink-100'
                          : 'bg-gold-50/5 border-gold-50/40'
                      }`}
                    >
                      {/* Top Header Dia */}
                      <div className="border-b border-gold-100 pb-2 text-center space-y-0.5">
                        <p className="text-[10px] text-gold-600 font-bold uppercase tracking-widest">{getWeekDayName(dayStr).substring(0, 3)}</p>
                        <p className={`text-base font-display font-bold w-7 h-7 flex items-center justify-center mx-auto rounded-full ${
                          isToday ? 'bg-pink-500 text-white' : 'text-gray-800'
                        }`}>
                          {dayStr.split('-')[2]}
                        </p>
                      </div>

                      {/* Lista de Atendimentos */}
                      <div className="mt-3 space-y-2 flex-1">
                        {agsDia.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center py-8 opacity-40">
                            <Coffee className="w-6 h-6 text-gold-300 mb-1" />
                            <span className="text-[10px] text-gray-400">Livre</span>
                          </div>
                        ) : (
                          agsDia.map((a) => {
                            const c = getCliente(a.clienteId);
                            const s = getServico(a.servicoId);
                            return (
                              <div
                                key={a.id}
                                onClick={() => handleOpenCheckout(a)}
                                className={`p-2 rounded-lg border text-left transition-all hover:shadow-xs cursor-pointer ${
                                  a.status === 'Concluído' 
                                    ? 'bg-green-50/30 border-green-100' 
                                    : a.status === 'Cancelado' 
                                    ? 'bg-red-50/30 border-red-100'
                                    : a.status === 'Em atendimento' 
                                    ? 'bg-pink-50/30 border-pink-100'
                                    : 'bg-blue-50/30 border-blue-100'
                                }`}
                              >
                                <div className="flex items-center justify-between text-[10px] font-bold">
                                  <span className="text-gold-600 flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{a.hora}</span>
                                  <span className={a.status === 'Concluído' ? 'text-green-700' : 'text-gray-500'}>{a.status}</span>
                                </div>
                                <p className="text-[11px] font-semibold text-gray-800 mt-1 truncate">{c?.nome}</p>
                                <p className="text-[9px] text-gray-500 truncate font-medium">{s?.nome}</p>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Botão de Agendamento Rápido no Dia */}
                      <button
                        onClick={() => handleNewAgendamento(undefined, dayStr)}
                        className="mt-2 w-full py-1 bg-white hover:bg-gold-50 border border-dashed border-gold-200 hover:border-gold-400 rounded-lg text-[10px] font-bold text-gold-700 transition-colors cursor-pointer"
                      >
                        + Agendar
                      </button>

                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================= */}
          {/* VISUALIZAÇÃO 3: DIÁRIO (COMPLETO) */}
          {/* ========================================= */}
          {calendarMode === 'diario' && (
            <div className="bg-white rounded-2xl border border-gold-100 shadow-xs overflow-hidden">
              
              <div className="p-4 border-b border-gold-50 bg-gold-50/20">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Cronograma do Dia</p>
              </div>

              <div className="divide-y divide-gold-50/40">
                {currentWorkingHours.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 font-medium bg-gray-50 m-4 rounded-xl border border-gray-100">
                    O salão está fechado nesta data.
                  </div>
                ) : (
                  currentWorkingHours.map((hour) => {
                  const matchingAgs = agendamentos
                    .filter(a => a.data === currentDate && a.hora === hour);

                  const isOccupied = matchingAgs.length > 0;

                  return (
                    <div key={hour} className="flex min-h-[75px] transition-colors hover:bg-gold-50/10">
                      
                      {/* Lado Esquerdo: Hora */}
                      <div className="w-20 sm:w-28 border-r border-gold-50 flex items-center justify-center shrink-0">
                        <span className="font-display font-bold text-gray-700 text-sm sm:text-base flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-gold-400 shrink-0" />
                          {hour}
                        </span>
                      </div>

                      {/* Lado Direito: Slots/Atendimentos */}
                      <div className="flex-1 p-3 flex flex-col gap-2 justify-center">
                        {!isOccupied ? (
                          // Slot Livre
                          <div className="flex items-center justify-between border border-dashed border-gold-100 hover:border-gold-300 rounded-xl p-3 bg-gold-50/5 hover:bg-gold-50/20 transition-all group">
                            <span className="text-xs text-gray-400 font-medium italic flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-gold-200" /> Horário Livre para Atendimento
                            </span>
                            <button
                              onClick={() => handleNewAgendamento(hour)}
                              className="opacity-0 group-hover:opacity-100 bg-gold-400 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-xs transition-all cursor-pointer hover:bg-gold-500"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Reservar</span>
                            </button>
                          </div>
                        ) : (
                          // Slots Ocupados
                          matchingAgs.map((a) => {
                            const c = getCliente(a.clienteId);
                            const p = getProfissional(a.profissionalId);
                            const s = getServico(a.servicoId);

                            let cardColor = 'bg-blue-50/50 border-blue-200 hover:bg-blue-50';
                            let iconColor = 'text-blue-500';
                            if (a.status === 'Concluído') {
                              cardColor = 'bg-green-50/30 border-green-200 hover:bg-green-50/50';
                              iconColor = 'text-green-500';
                            } else if (a.status === 'Em atendimento') {
                              cardColor = 'bg-pink-50/40 border-pink-200 hover:bg-pink-50/60';
                              iconColor = 'text-pink-500';
                            } else if (a.status === 'Cancelado') {
                              cardColor = 'bg-red-50/30 border-red-200 hover:bg-red-50/50';
                              iconColor = 'text-red-500';
                            }

                            return (
                              <div
                                key={a.id}
                                onClick={() => handleOpenCheckout(a)}
                                className={`border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all cursor-pointer ${cardColor}`}
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-semibold text-gray-800 text-sm">
                                      {c ? c.nome : 'Cliente Desconhecida'}
                                    </h4>
                                    <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded-full border tracking-wide uppercase ${
                                      a.status === 'Concluído' ? 'bg-green-100 text-green-700 border-green-200' :
                                      a.status === 'Em atendimento' ? 'bg-pink-100 text-pink-700 border-pink-200' :
                                      a.status === 'Cancelado' ? 'bg-red-100 text-red-700 border-red-200' :
                                      'bg-blue-100 text-blue-700 border-blue-200'
                                    }`}>
                                      {a.status}
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 font-medium">
                                    <span className="flex items-center gap-1">
                                      <Scissors className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                                      {s ? s.nome : 'Serviço'}
                                    </span>
                                    <span className="text-gray-300">|</span>
                                    <span>Colaborador: <span className="font-semibold text-gray-700">{p ? p.nome : '—'}</span></span>
                                    <span className="text-gray-300">|</span>
                                    <span className="text-gold-600 font-bold">{s ? formatCurrency(s.valor) : '—'}</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 self-end sm:self-center">
                                  {a.status === 'Concluído' && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedReceipt(a);
                                        setIsReceiptOpen(true);
                                      }}
                                      title="Imprimir Cupom/Recibo"
                                      className="p-1.5 text-gray-500 hover:text-gold-600 hover:bg-white rounded-lg border border-gold-100/50 transition-colors"
                                    >
                                      <Printer className="w-4 h-4" />
                                    </button>
                                  )}
                                  <button
                                    onClick={(e) => handleEditClick(e, a)}
                                    title="Editar"
                                    className="p-1.5 text-gray-500 hover:text-gold-600 hover:bg-white rounded-lg border border-gold-100/50 transition-colors"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={(e) => handleDeleteClick(e, a.id)}
                                    title="Excluir"
                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                    </div>
                  );
                })
                )}
              </div>

            </div>
          )}

        </div>
      )}

      {/* ========================================================== */}
      {/* ABBA 2: FLUXO DE CAIXA DIÁRIO & PRODUTOS */}
      {/* ========================================================== */}
      {activeSubTab === 'caixa' && (
        <div className="space-y-6 print:hidden">
          
          {/* Top Info Caixa */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-serif font-semibold text-gray-800">Controle de Faturamento & Caixa</h2>
              <p className="text-sm text-gray-500">Monitore as entradas e saídas físicas do caixa e realize a venda direta de produtos.</p>
            </div>

            {/* Ações Rápidas de Caixa */}
            {caixaStatus.aberto && caixaStatus.dataAbertura === currentDate ? (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setIsVendaFormOpen(true)}
                  className="bg-pink-600 hover:bg-pink-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-xs transition-all"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Vender Produto</span>
                </button>
                <button
                  onClick={() => setIsCaixaFormOpen(true)}
                  className="bg-gold-500 hover:bg-gold-600 text-white font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-xs transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Lançamento</span>
                </button>
                <button
                  onClick={handleCloseCaixa}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-xs transition-all"
                >
                  <Lock className="w-4 h-4" />
                  <span>Fechar Caixa</span>
                </button>
              </div>
            ) : (
              <span className="text-xs bg-red-100 text-red-700 font-bold px-3 py-1.5 rounded-lg border border-red-200">
                O Caixa deve estar aberto nesta data para lançar movimentações.
              </span>
            )}
          </div>

          {/* Estado de Caixa Fechado - Form de Abertura */}
          {(!caixaStatus.aberto || caixaStatus.dataAbertura !== currentDate) && (
            <div className="bg-white rounded-2xl border border-gold-100 shadow-xs p-8 max-w-md mx-auto text-center space-y-5 animate-fade-in">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
                <Lock className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif font-bold text-lg text-gray-800">O Caixa de {formatDateBR(currentDate)} está Fechado</h3>
                <p className="text-sm text-gray-400">É necessário abrir o caixa do dia informando um saldo inicial (troco) de abertura para começar.</p>
              </div>

              <form onSubmit={handleOpenCaixa} className="space-y-4 pt-3">
                <div className="space-y-1 text-left">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Saldo Inicial de Abertura (R$)</label>
                  <div className="relative">
                    <DollarSign className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      required
                      min={0}
                      step={0.01}
                      value={caixaOpeningVal}
                      onChange={(e) => setCaixaOpeningVal(Number(e.target.value))}
                      className="w-full bg-gold-50/10 border border-gold-100 rounded-xl py-3 pl-10 pr-4 text-base font-bold text-gray-800 focus:outline-hidden focus:border-gold-300 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs hover:shadow-md transition-all cursor-pointer"
                >
                  <Unlock className="w-5 h-5" />
                  <span>Abrir Caixa do Dia</span>
                </button>
              </form>
            </div>
          )}

          {/* Caixa Aberto - Visualização de Métricas & Lançamentos */}
          {caixaStatus.aberto && caixaStatus.dataAbertura === currentDate && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Painel de Métricas Rápidas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Saldo de Abertura */}
                <div className="bg-white rounded-2xl border border-gold-100 p-5 flex items-center gap-4 shadow-xs">
                  <div className="w-12 h-12 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center shrink-0">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Troco de Abertura</span>
                    <span className="text-lg font-bold text-gray-800">{formatCurrency(caixaStatus.saldoAbertura)}</span>
                  </div>
                </div>

                {/* Entradas */}
                <div className="bg-white rounded-2xl border border-gold-100 p-5 flex items-center gap-4 shadow-xs">
                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center shrink-0">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Total Entradas</span>
                    <span className="text-lg font-bold text-green-700">{formatCurrency(totalEntradas)}</span>
                  </div>
                </div>

                {/* Saídas */}
                <div className="bg-white rounded-2xl border border-gold-100 p-5 flex items-center gap-4 shadow-xs">
                  <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center shrink-0">
                    <TrendingDown className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Total Saídas</span>
                    <span className="text-lg font-bold text-red-700">{formatCurrency(totalSaidas)}</span>
                  </div>
                </div>

                {/* Saldo Atual em Caixa */}
                <div className="bg-gold-50/40 rounded-2xl border border-gold-200/60 p-5 flex items-center gap-4 shadow-sm">
                  <div className="w-12 h-12 bg-gold-500 text-white rounded-full flex items-center justify-center shrink-0">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-gold-800 font-bold uppercase tracking-wider block">Saldo do Caixa</span>
                    <span className="text-lg font-bold text-gold-900">{formatCurrency(saldoCaixa)}</span>
                  </div>
                </div>

              </div>

              {/* Grid Detalhado de Formas de Pagamento e Tabela de Movimentos */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Lado Esquerdo: Resumo por Pagamento */}
                <div className="bg-white rounded-2xl border border-gold-100 shadow-xs p-5 space-y-4">
                  <h4 className="font-serif font-semibold text-base text-gray-800 pb-2 border-b border-gold-50">Resumo por Forma de Pagamento</h4>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between py-1 border-b border-gold-50/50">
                      <span className="text-gray-500 font-medium">Dinheiro</span>
                      <span className="font-bold text-gray-800">{formatCurrency(entradasDinheiro)}</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-gold-50/50">
                      <span className="text-gray-500 font-medium">PIX</span>
                      <span className="font-bold text-gray-800">{formatCurrency(entradasPIX)}</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-gold-50/50">
                      <span className="text-gray-500 font-medium">Cartão</span>
                      <span className="font-bold text-gray-800">{formatCurrency(entradasCartao)}</span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-gray-500 font-medium">Fiado / Pendente</span>
                      <span className="font-bold text-red-600">{formatCurrency(entradasFiado)}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gold-100 text-center">
                    <button
                      onClick={triggerPrint}
                      className="text-xs bg-gold-50 hover:bg-gold-100 text-gold-700 font-bold px-4 py-2 rounded-xl flex items-center justify-center gap-2 mx-auto border border-gold-200/50 transition-all cursor-pointer w-full"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Imprimir Extrato de Hoje</span>
                    </button>
                  </div>
                </div>

                {/* Lado Direito: Histórico de Transações de Hoje */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gold-100 shadow-xs overflow-hidden">
                  <div className="p-4 border-b border-gold-50 bg-gold-50/10">
                    <h4 className="font-serif font-semibold text-base text-gray-800">Lançamentos de Caixa de Hoje</h4>
                  </div>

                  {txsFiltradas.length === 0 ? (
                    <div className="p-10 text-center opacity-50 flex flex-col items-center justify-center h-48">
                      <TrendingUp className="w-8 h-8 text-gold-300 mb-1" />
                      <span className="text-xs text-gray-400">Nenhum lançamento registrado hoje.</span>
                    </div>
                  ) : (
                    <div className="overflow-x-auto max-h-[350px] overflow-y-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-gold-50 bg-gold-50/20 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            <th className="p-3 pl-5">Hora</th>
                            <th className="p-3">Descrição</th>
                            <th className="p-3">Categoria</th>
                            <th className="p-3">Pagamento</th>
                            <th className="p-3 text-right">Valor</th>
                            <th className="p-3 pr-5 text-right">Ação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gold-50/50 text-xs">
                          {txsFiltradas.sort((a,b) => b.hora.localeCompare(a.hora)).map((t) => (
                            <tr key={t.id} className="hover:bg-gold-50/10">
                              <td className="p-3 pl-5 font-semibold text-gray-500">{t.hora}</td>
                              <td className="p-3 font-semibold text-gray-800 max-w-xs truncate" title={t.descricao}>{t.descricao}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                  t.categoria === 'Serviço' ? 'bg-blue-50 text-blue-700' :
                                  t.categoria === 'Venda de Produto' ? 'bg-pink-50 text-pink-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {t.categoria}
                                </span>
                              </td>
                              <td className="p-3 font-medium text-gray-600">{t.formaPagamento}</td>
                              <td className={`p-3 text-right font-bold ${t.tipo === 'Entrada' ? 'text-green-600' : 'text-red-600'}`}>
                                {t.tipo === 'Entrada' ? '+' : '-'} {formatCurrency(t.valor)}
                              </td>
                              <td className="p-3 pr-5 text-right">
                                <button
                                  onClick={() => onDeleteCaixaTransacao(t.id)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded-md transition-colors"
                                  title="Excluir Lançamento"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                </div>

              </div>

            </div>
          )}

        </div>
      )}

      {/* ========================================================== */}
      {/* 3. LAYOUT DE IMPRESSÃO DO RECIBO / CUPOM FISCAL */}
      {/* ========================================================== */}
      {isReceiptOpen && selectedReceipt && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 print:relative print:bg-white print:inset-auto print:p-0">
          <div className="bg-white rounded-2xl border border-gold-100 shadow-xl max-w-sm w-full overflow-hidden animate-slide-up print:border-0 print:shadow-none print:rounded-none">
            
            {/* Header Recibo - Oculto em Impressão */}
            <div className="p-4 border-b border-gold-50 flex items-center justify-between bg-gold-50/10 print:hidden">
              <span className="font-serif font-bold text-sm text-gray-800 flex items-center gap-1.5"><FileText className="w-4 h-4 text-gold-500" /> Emissão de Recibo</span>
              <button 
                onClick={() => {
                  setIsReceiptOpen(false);
                  setSelectedReceipt(null);
                }}
                className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Recibo Térmico (Thermal Style) */}
            <div className="p-6 bg-amber-50/15 font-mono text-xs text-gray-800 space-y-4 print:bg-white print:text-black">
              
              <div className="text-center space-y-1 pb-4 border-b border-dashed border-gray-300">
                {configuracao.logoUrl ? (
                  <img src={configuracao.logoUrl} alt="Logo" className="w-12 h-12 object-contain mx-auto mb-2 grayscale" />
                ) : null}
                <h3 className="font-serif font-bold text-base tracking-tight uppercase">{configuracao.nomeSalao}</h3>
                <p className="text-[9px]">{configuracao.endereco}</p>
                <p className="text-[9px]">Fone: {configuracao.telefone}</p>
                <p className="text-[10px] font-bold pt-1">*** CUPOM DE ATENDIMENTO ***</p>
              </div>

              <div className="space-y-1 pb-3 border-b border-dashed border-gray-200">
                <p><strong>CUPOM Nº:</strong> {selectedReceipt.id}</p>
                <p><strong>DATA:</strong> {formatDateBR(selectedReceipt.data)} às {selectedReceipt.hora}</p>
                <p><strong>CLIENTE:</strong> {getCliente(selectedReceipt.clienteId)?.nome || 'CONSUMIDOR PADRÃO'}</p>
                <p><strong>ATENDENTE:</strong> {getProfissional(selectedReceipt.profissionalId)?.nome || 'RECEPÇÃO'}</p>
              </div>

              {/* Itens */}
              <div className="space-y-2 pb-3 border-b border-dashed border-gray-200">
                <div className="flex justify-between font-bold">
                  <span>DESCRIÇÃO</span>
                  <span>TOTAL</span>
                </div>
                <div className="flex justify-between">
                  <span>1. {getServico(selectedReceipt.servicoId)?.nome || 'Serviço'}</span>
                  <span>{formatCurrency(selectedReceipt.valorPago || 0)}</span>
                </div>
              </div>

              {/* Totais */}
              <div className="space-y-1 pb-4">
                <div className="flex justify-between font-bold text-sm">
                  <span>VALOR PAGO:</span>
                  <span>{formatCurrency(selectedReceipt.valorPago || 0)}</span>
                </div>
                <p className="text-[10px]"><strong>MEIO DE PAGAMENTO:</strong> {selectedReceipt.formaPagamento || 'PIX'}</p>
              </div>

              <div className="text-center pt-4 border-t border-dashed border-gray-300 space-y-1">
                <p className="font-serif italic font-bold">Obrigado pela preferência!</p>
                <p className="text-[8px] text-gray-400">Powered by StudioFlow® v1.0 - Local Offline Mode</p>
              </div>

            </div>

            {/* Ações Cupom - Oculto em Impressão */}
            <div className="p-4 border-t border-gold-50 flex items-center justify-end gap-2 bg-gold-50/5 print:hidden">
              <button
                type="button"
                onClick={() => {
                  setIsReceiptOpen(false);
                  setSelectedReceipt(null);
                }}
                className="px-4 py-2 border border-gray-200 text-gray-600 text-xs font-semibold rounded-xl"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={triggerPrint}
                className="px-5 py-2 bg-gold-500 hover:bg-gold-600 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Confirmar Impressão</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL LANÇAMENTO MANUAL CAIXA */}
      {/* ========================================================== */}
      {isCaixaFormOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-gold-100 shadow-xl max-w-md w-full overflow-hidden animate-slide-up">
            
            <div className="p-5 border-b border-gold-50 flex items-center justify-between">
              <h3 className="font-serif font-semibold text-lg text-gray-800">Novo Lançamento Financeiro</h3>
              <button onClick={() => setIsCaixaFormOpen(false)} className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCaixaTx} className="p-6 space-y-4">
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Tipo de Lançamento</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setCaixaTxTipo('Saída'); setCaixaTxCat('Despesa'); }}
                    className={`py-2 text-center text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      caixaTxTipo === 'Saída' ? 'bg-red-500 border-red-500 text-white shadow-xs' : 'bg-white border-gold-100 text-gray-600'
                    }`}
                  >
                    Saída / Despesa
                  </button>
                  <button
                    type="button"
                    onClick={() => setCaixaTxTipo('Entrada')}
                    className={`py-2 text-center text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      caixaTxTipo === 'Entrada' ? 'bg-green-500 border-green-500 text-white shadow-xs' : 'bg-white border-gold-100 text-gray-600'
                    }`}
                  >
                    Entrada / Aporte
                  </button>
                </div>
              </div>

              {/* Descrição */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Descrição *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Pagamento da conta de água do salão"
                  value={caixaTxDesc}
                  onChange={(e) => setCaixaTxDesc(e.target.value)}
                  className="w-full bg-gold-50/10 border border-gold-100 rounded-xl py-2 px-3 text-sm text-gray-800 focus:outline-hidden focus:border-gold-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Valor */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Valor do Lançamento (R$)</label>
                  <input
                    type="number"
                    required
                    min={0.01}
                    step={0.01}
                    value={caixaTxVal || ''}
                    onChange={(e) => setCaixaTxVal(Number(e.target.value))}
                    className="w-full bg-gold-50/10 border border-gold-100 rounded-xl py-2 px-3 text-sm text-gray-800 focus:outline-hidden focus:border-gold-300"
                  />
                </div>

                {/* Forma de Pagamento */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Forma Pagamento</label>
                  <select
                    value={caixaTxPag}
                    onChange={(e: any) => setCaixaTxPag(e.target.value)}
                    className="w-full bg-gold-50/10 border border-gold-100 rounded-xl py-2 px-3 text-sm text-gray-800 focus:outline-hidden focus:border-gold-300"
                  >
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="PIX">PIX</option>
                    <option value="Cartão">Cartão</option>
                  </select>
                </div>
              </div>

              {/* Categoria (Se Saída) */}
              {caixaTxTipo === 'Saída' && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Categoria da Despesa</label>
                  <select
                    value={caixaTxCat}
                    onChange={(e: any) => setCaixaTxCat(e.target.value)}
                    className="w-full bg-gold-50/10 border border-gold-100 rounded-xl py-2 px-3 text-sm text-gray-800 focus:outline-hidden focus:border-gold-300"
                  >
                    <option value="Despesa">Despesa Geral / Contas</option>
                    <option value="Sangria">Sangria (Retirada de Dinheiro)</option>
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gold-50">
                <button
                  type="button"
                  onClick={() => setIsCaixaFormOpen(false)}
                  className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 font-semibold text-sm rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gold-500 hover:bg-gold-600 text-white font-semibold text-sm rounded-xl shadow-xs"
                >
                  Registrar Lançamento
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL VENDA DIRETA DE PRODUTOS */}
      {/* ========================================================== */}
      {isVendaFormOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-gold-100 shadow-xl max-w-md w-full overflow-hidden animate-slide-up">
            
            <div className="p-5 border-b border-gold-50 flex items-center justify-between bg-pink-50/10">
              <span className="font-serif font-bold text-sm text-gray-800 flex items-center gap-1.5"><ShoppingBag className="w-5 h-5 text-pink-500" /> Venda Direta de Balcão</span>
              <button onClick={() => setIsVendaFormOpen(false)} className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVenda} className="p-6 space-y-4">
              
              {vendaError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{vendaError}</span>
                </div>
              )}

              {/* Produto */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Produto de Estoque *</label>
                <select
                  required
                  value={vendaProdutoId}
                  onChange={(e) => setVendaProdutoId(e.target.value)}
                  className="w-full bg-gold-50/10 border border-gold-100 rounded-xl py-2 px-3 text-sm text-gray-800 focus:outline-hidden focus:border-gold-300"
                >
                  <option value="" disabled>Selecione o produto para venda...</option>
                  {produtos.map(p => (
                    <option key={p.id} value={p.id} disabled={p.quantidade <= 0}>
                      {p.nome} — Venda: {formatCurrency(p.valorVenda)} (Estoque: {p.quantidade} un)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Quantidade */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Quantidade *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={vendaQuantidade}
                    onChange={(e) => setVendaQuantidade(Number(e.target.value))}
                    className="w-full bg-gold-50/10 border border-gold-100 rounded-xl py-2 px-3 text-sm text-gray-800 focus:outline-hidden focus:border-gold-300"
                  />
                </div>

                {/* Forma de Pagamento */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Forma Pagamento</label>
                  <select
                    value={vendaFormaPagamento}
                    onChange={(e: any) => setVendaFormaPagamento(e.target.value)}
                    className="w-full bg-gold-50/10 border border-gold-100 rounded-xl py-2 px-3 text-sm text-gray-800 focus:outline-hidden focus:border-gold-300"
                  >
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="PIX">PIX</option>
                    <option value="Cartão">Cartão</option>
                    <option value="Fiado">Fiado / Pendente</option>
                  </select>
                </div>
              </div>

              {/* Valor Especial Customizado (Desconto/Acréscimo) */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Valor de Venda Personalizado (R$ - Opcional)</label>
                <input
                  type="number"
                  min={0.01}
                  step={0.01}
                  placeholder="Ex: Deixar em branco para usar valor do produto"
                  value={vendaValorPersonalizado}
                  onChange={(e) => setVendaValorPersonalizado(e.target.value)}
                  className="w-full bg-gold-50/10 border border-gold-100 rounded-xl py-2 px-3 text-sm text-gray-800 focus:outline-hidden focus:border-gold-300"
                />
                <p className="text-[10px] text-gray-400">Pressione Salvar para aplicar a venda e abater automaticamente do estoque físico.</p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gold-50">
                <button
                  type="button"
                  onClick={() => setIsVendaFormOpen(false)}
                  className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 font-semibold text-sm rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-pink-600 hover:bg-pink-700 text-white font-semibold text-sm rounded-xl shadow-xs"
                >
                  Confirmar Venda
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
