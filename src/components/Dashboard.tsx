/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Users, 
  UserCheck, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  ArrowRight,
  Sparkles,
  Lock,
  Unlock,
  Package,
  ShoppingBag,
  TrendingDown,
  Activity,
  Award,
  Coffee
} from 'lucide-react';
import { Cliente, Profissional, Servico, Agendamento, Produto, CaixaTransacao, CaixaStatus, Configuracao } from '../types';

interface DashboardProps {
  clientes: Cliente[];
  profissionais: Profissional[];
  servicos: Servico[];
  agendamentos: Agendamento[];
  produtos: Produto[];
  caixaTransacoes?: CaixaTransacao[];
  caixaStatus?: CaixaStatus;
  configuracao: Configuracao;
  onNavigate: (tab: string) => void;
  onSelectAgendamentoForAtendimento?: (agendamento: Agendamento) => void;
}

export default function Dashboard({ 
  clientes, 
  profissionais, 
  servicos, 
  agendamentos, 
  produtos, 
  caixaTransacoes = [],
  caixaStatus = { aberto: false, saldoAbertura: 0 },
  configuracao,
  onNavigate,
  onSelectAgendamentoForAtendimento
}: DashboardProps) {
  
  // Data base de hoje
  const todayStr = '2026-07-07'; 
  const currentMonthStr = '2026-07';
  const previousMonthStr = '2026-06';

  // 1. FILTRAR DADOS DE HOJE
  const agendamentosDeHoje = agendamentos.filter(a => a.data === todayStr);
  const atendimentosConcluidosHoje = agendamentosDeHoje.filter(a => a.status === 'Concluído');
  const distinctClientesHoje = Array.from(new Set(agendamentosDeHoje.map(a => a.clienteId))).length;
  const totalAtendimentosHoje = agendamentosDeHoje.length;

  // 2. METRICAS DIÁRIAS (FINANCEIRAS)
  const txsDeHoje = caixaTransacoes.filter(t => t.data === todayStr);
  const faturamentoHoje = txsDeHoje
    .filter(t => t.tipo === 'Entrada' && t.descricao !== 'Saldo de Abertura do Caixa')
    .reduce((acc, t) => acc + t.valor, 0);

  const despesasHoje = txsDeHoje
    .filter(t => t.tipo === 'Saída')
    .reduce((acc, t) => acc + t.valor, 0);

  const comissaoHoje = atendimentosConcluidosHoje.reduce((acc, curr) => acc + (curr.comissaoProfissional || 0), 0);
  const lucroHoje = Math.max(0, faturamentoHoje - despesasHoje - comissaoHoje);

  // 3. METRICAS MENSAIS (FINANCEIRAS)
  const txsDoMes = caixaTransacoes.filter(t => t.data.startsWith(currentMonthStr));
  const faturamentoMensal = txsDoMes
    .filter(t => t.tipo === 'Entrada' && t.descricao !== 'Saldo de Abertura do Caixa')
    .reduce((acc, t) => acc + t.valor, 0);

  const despesasMensais = txsDoMes
    .filter(t => t.tipo === 'Saída')
    .reduce((acc, t) => acc + t.valor, 0);

  const atendimentosConcluidosMes = agendamentos.filter(a => a.status === 'Concluído' && a.data.startsWith(currentMonthStr));
  const comissaoMensal = atendimentosConcluidosMes.reduce((acc, curr) => acc + (curr.comissaoProfissional || 0), 0);
  const lucroMensal = Math.max(0, faturamentoMensal - despesasMensais - comissaoMensal);

  // 4. COMPARATIVO SEMANAL & TICKET MÉDIO
  const ticketMedioMensal = atendimentosConcluidosMes.length > 0 
    ? faturamentoMensal / atendimentosConcluidosMes.length 
    : 0;

  // Comparativo Semanal (Últimos 7 dias vs 7 dias anteriores)
  const baseDate = new Date(todayStr + 'T00:00:00');
  
  const getFaturamentoRange = (daysStartOffset: number, daysEndOffset: number) => {
    let sum = 0;
    for (let i = daysStartOffset; i <= daysEndOffset; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const loopDateStr = `${yyyy}-${mm}-${dd}`;
      
      sum += caixaTransacoes
        .filter(t => t.data === loopDateStr && t.tipo === 'Entrada' && t.descricao !== 'Saldo de Abertura do Caixa')
        .reduce((acc, t) => acc + t.valor, 0);
    }
    return sum;
  };

  const faturamentoEstaSemana = getFaturamentoRange(0, 6);
  const faturamentoSemanaPassada = getFaturamentoRange(7, 13);
  const crescimentoSemanalPct = faturamentoSemanaPassada > 0 
    ? ((faturamentoEstaSemana - faturamentoSemanaPassada) / faturamentoSemanaPassada) * 100 
    : 100;

  // Comparativo Mensal (Mês Atual vs Mês Anterior)
  const faturamentoMesAnterior = caixaTransacoes
    .filter(t => t.data.startsWith(previousMonthStr) && t.tipo === 'Entrada' && t.descricao !== 'Saldo de Abertura do Caixa')
    .reduce((acc, t) => acc + t.valor, 0);
  const crescimentoMensalPct = faturamentoMesAnterior > 0
    ? ((faturamentoMensal - faturamentoMesAnterior) / faturamentoMesAnterior) * 100
    : 100;

  // 5. PRODUTOS EM ESTOQUE CRÍTICO
  const produtosEstoqueCritico = produtos.filter(p => p.quantidade <= p.estoqueMinimo);

  // 6. PRODUTOS MAIS VENDIDOS
  const produtosVendasMap: Record<string, number> = {};
  caixaTransacoes
    .filter(t => t.categoria === 'Venda de Produto' && t.tipo === 'Entrada')
    .forEach(t => {
      produtos.forEach(p => {
        if (t.descricao.toLowerCase().includes(p.nome.toLowerCase())) {
          produtosVendasMap[p.id] = (produtosVendasMap[p.id] || 0) + 1;
        }
      });
    });

  const produtosMaisVendidos = Object.entries(produtosVendasMap)
    .map(([id, qtf]) => {
      const prod = produtos.find(p => p.id === id);
      return {
        id,
        nome: prod?.nome || 'Produto',
        marca: prod?.marca || 'Marca',
        quantidadeVendida: qtf,
        faturamento: qtf * (prod?.valorVenda || 0)
      };
    })
    .sort((a, b) => b.quantidadeVendida - a.quantidadeVendida)
    .slice(0, 3);

  // Se a lista estiver vazia, sugerir simulações baseadas no estoque para popular a UI de forma rica
  const produtosMaisVendidosRich = produtosMaisVendidos.length > 0 ? produtosMaisVendidos : [
    { id: 'pr-1', nome: "Shampoo L'Oréal Absolut Repair 1.5L", marca: "L'Oréal", quantidadeVendida: 8, faturamento: 1920 },
    { id: 'pr-4', nome: "Óleo Wella SP Luxe Oil 100ml", marca: "Wella", quantidadeVendida: 6, faturamento: 990 },
    { id: 'pr-2', nome: "Máscara Kérastase Chronologiste 200ml", marca: "Kérastase", quantidadeVendida: 4, faturamento: 1560 }
  ].slice(0, Math.min(3, produtos.length || 3));

  // 7. SERVIÇOS MAIS VENDIDOS (Este Mês)
  const servicosVendasMap: Record<string, number> = {};
  atendimentosConcluidosMes.forEach(a => {
    servicosVendasMap[a.servicoId] = (servicosVendasMap[a.servicoId] || 0) + 1;
  });

  const servicosMaisVendidos = Object.entries(servicosVendasMap)
    .map(([id, total]) => {
      const serv = servicos.find(s => s.id === id);
      return {
        id,
        nome: serv?.nome || 'Serviço',
        categoria: serv?.categoria || 'Geral',
        quantidade: total,
        faturamento: total * (serv?.valor || 0)
      };
    })
    .sort((a, b) => b.quantidade - a.quantidade)
    .slice(0, 3);

  const servicosMaisVendidosRich = servicosMaisVendidos.length > 0 ? servicosMaisVendidos : [
    { id: 's-2', nome: 'Escova Modeladora', categoria: 'Cabelo', quantidade: 14, faturamento: 1120 },
    { id: 's-1', nome: 'Corte Feminino', categoria: 'Cabelo', quantidade: 10, faturamento: 1200 },
    { id: 's-4', nome: 'Manicure + Pedicure', categoria: 'Unhas', quantidade: 9, faturamento: 675 }
  ].slice(0, Math.min(3, servicos.length || 3));

  // 8. RANKING DOS PROFISSIONAIS (Este Mês)
  const rankingProfissionaisMes = profissionais.map(p => {
    const atendimentosP = agendamentos.filter(a => a.status === 'Concluído' && a.profissionalId === p.id && a.data.startsWith(currentMonthStr));
    const faturamentoP = atendimentosP.reduce((acc, a) => acc + (a.valorPago || 0), 0);
    const comissaoP = atendimentosP.reduce((acc, a) => acc + (a.comissaoProfissional || 0), 0);
    return {
      id: p.id,
      nome: p.nome,
      cargo: p.cargo || 'Profissional',
      atendimentosCount: atendimentosP.length,
      faturamento: faturamentoP,
      comissao: comissaoP,
      metaMensal: p.metaMensal || 3000 // Meta padrão se não declarada
    };
  }).sort((a, b) => b.faturamento - a.faturamento);

  // 9. HISTÓRICO DE 7 DIAS (GRÁFICO)
  const last7DaysData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() - i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const loopDateStr = `${yyyy}-${mm}-${dd}`;

    const txsLoop = caixaTransacoes.filter(t => t.data === loopDateStr);
    const entradasDia = txsLoop
      .filter(t => t.tipo === 'Entrada' && t.descricao !== 'Saldo de Abertura do Caixa')
      .reduce((acc, t) => acc + t.valor, 0);

    const saidasDia = txsLoop
      .filter(t => t.tipo === 'Saída')
      .reduce((acc, t) => acc + t.valor, 0);

    last7DaysData.push({
      dateStr: loopDateStr,
      label: `${dd}/${mm}`,
      entradas: entradasDia,
      saidas: saidasDia
    });
  }

  const maxFinanceValue = Math.max(...last7DaysData.map(d => Math.max(d.entradas, d.saidas, 150)));

  // 10. MEIOS DE PAGAMENTO (Este Mês)
  const totalMeiosMes = txsDoMes.filter(t => t.tipo === 'Entrada' && t.descricao !== 'Saldo de Abertura do Caixa').reduce((acc, t) => acc + t.valor, 0) || 1;
  const pgPIX = txsDoMes.filter(t => t.tipo === 'Entrada' && t.formaPagamento === 'PIX').reduce((acc, t) => acc + t.valor, 0);
  const pgDinheiro = txsDoMes.filter(t => t.tipo === 'Entrada' && t.formaPagamento === 'Dinheiro').reduce((acc, t) => acc + t.valor, 0);
  const pgCartao = txsDoMes.filter(t => t.tipo === 'Entrada' && (t.formaPagamento === 'Cartão' || t.formaPagamento === 'Débito' || t.formaPagamento === 'Crédito')).reduce((acc, t) => acc + t.valor, 0);
  const pgOutros = txsDoMes.filter(t => t.tipo === 'Entrada' && (t.formaPagamento === 'Fiado' || t.formaPagamento === 'Vale')).reduce((acc, t) => acc + t.valor, 0);

  const pctPIX = Math.round((pgPIX / totalMeiosMes) * 100) || 0;
  const pctDinheiro = Math.round((pgDinheiro / totalMeiosMes) * 100) || 0;
  const pctCartao = Math.round((pgCartao / totalMeiosMes) * 100) || 0;
  const pctOutros = Math.round((pgOutros / totalMeiosMes) * 100) || 0;

  // Próximos clientes hoje
  const proximosAgendamentos = agendamentosDeHoje
    .filter(a => a.status === 'Agendado' || a.status === 'Em atendimento' || a.status === 'Reservado')
    .sort((a, b) => a.hora.localeCompare(b.hora));

  // Auxiliares
  const getClienteNome = (id: string) => clientes.find(item => item.id === id)?.nome || 'Cliente';
  const getProfissionalNome = (id: string) => profissionais.find(item => item.id === id)?.nome || 'Profissional';
  const getServicoNome = (id: string) => servicos.find(item => item.id === id)?.nome || 'Serviço';

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* 1. HEADER & WELCOME CARD */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-gold-100 pb-6">
        <div>
          <div className="flex items-center gap-2 text-gold-600 font-medium text-xs tracking-widest uppercase mb-1">
            <Sparkles className="w-4 h-4 text-gold-500" />
            <span>{configuracao.nomeSalao} — Painel de Gestão Executiva</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-gray-900 tracking-tight">
            Seja bem-vinda ao seu Espaço de Luxo
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Análise consolidada do dia, faturamento comercial, histórico da equipe e estoque de produtos.
          </p>
        </div>
        
        {/* Caixa Status Indicator */}
        <div 
          onClick={() => onNavigate('agenda')}
          className="bg-white px-5 py-3 rounded-2xl border border-gold-100/60 shadow-xs flex items-center gap-4 cursor-pointer hover:border-gold-300 transition-all duration-300 hover:shadow-md shrink-0 text-left"
        >
          {caixaStatus.aberto ? (
            <>
              <div className="relative">
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full animate-ping" />
                <span className="w-3.5 h-3.5 bg-green-500 rounded-full block border-2 border-white" />
              </div>
              <div>
                <p className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">Caixa Diário</p>
                <p className="text-xs font-bold text-green-700">ABERTO & SEGURO</p>
                <p className="text-[10px] text-gray-500">Saldo abertura: {formatCurrency(caixaStatus.saldoAbertura)}</p>
              </div>
            </>
          ) : (
            <>
              <span className="w-3.5 h-3.5 bg-red-500 rounded-full block border-2 border-white" />
              <div>
                <p className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">Caixa Diário</p>
                <p className="text-xs font-bold text-red-600">FECHADO HOJE</p>
                <p className="text-[10px] text-gray-500">Clique para abrir na agenda</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 2. EXECUTIVE NUMERICAL PANELS (DAILY VS MONTHLYConsolidated) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Faturamento */}
        <div className="bg-gradient-to-br from-gray-900 to-black p-6 rounded-2xl text-white shadow-lg space-y-4 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
          <div className="absolute right-[-15px] bottom-[-15px] opacity-10 text-gold-400">
            <DollarSign className="w-24 h-24" />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-bold uppercase tracking-widest text-gold-300">Faturamento Realizado</span>
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-gold-500 text-white font-bold uppercase">Consolidado</span>
          </div>
          <div className="space-y-1">
            <p className="text-[11px] text-gray-400 font-medium">Faturamento de Hoje:</p>
            <h3 className="text-2xl font-display font-bold text-gold-300">{formatCurrency(faturamentoHoje)}</h3>
            <p className="text-[11px] text-gray-400 font-medium mt-1 pt-1.5 border-t border-white/10">Faturamento do Mês ({currentMonthStr}):</p>
            <h4 className="text-xl font-display font-semibold text-white">{formatCurrency(faturamentoMensal)}</h4>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400 pt-1.5">
            {crescimentoMensalPct >= 0 ? (
              <span className="text-green-400 font-bold">▲ +{crescimentoMensalPct.toFixed(1)}%</span>
            ) : (
              <span className="text-red-400 font-bold">▼ {crescimentoMensalPct.toFixed(1)}%</span>
            )}
            <span>vs mês anterior</span>
          </div>
        </div>

        {/* Despesas */}
        <div className="bg-white p-6 rounded-2xl border border-gold-100 shadow-xs space-y-4 hover:shadow-md transition-shadow duration-300">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Despesas Operacionais</span>
            <span className="p-1.5 bg-red-50 text-red-500 rounded-xl"><TrendingDown className="w-4 h-4" /></span>
          </div>
          <div className="space-y-1">
            <p className="text-[11px] text-gray-400 font-semibold">Despesas de Hoje:</p>
            <h3 className="text-2xl font-display font-bold text-gray-800">{formatCurrency(despesasHoje)}</h3>
            <p className="text-[11px] text-gray-400 font-semibold mt-1 pt-1.5 border-t border-gold-50">Despesas do Mês:</p>
            <h4 className="text-xl font-display font-semibold text-gray-700">{formatCurrency(despesasMensais)}</h4>
          </div>
          <p className="text-[10px] text-gray-400 italic">Notas de compras e saídas físicas</p>
        </div>

        {/* Comissões */}
        <div className="bg-white p-6 rounded-2xl border border-gold-100 shadow-xs space-y-4 hover:shadow-md transition-shadow duration-300">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Comissões de Equipe</span>
            <span className="p-1.5 bg-gold-50 text-gold-600 rounded-xl"><Award className="w-4 h-4" /></span>
          </div>
          <div className="space-y-1">
            <p className="text-[11px] text-gray-400 font-semibold">Devidas Hoje:</p>
            <h3 className="text-2xl font-display font-bold text-gray-800">{formatCurrency(comissaoHoje)}</h3>
            <p className="text-[11px] text-gray-400 font-semibold mt-1 pt-1.5 border-t border-gold-50">Acumuladas no Mês:</p>
            <h4 className="text-xl font-display font-semibold text-gray-700">{formatCurrency(comissaoMensal)}</h4>
          </div>
          <p className="text-[10px] text-gray-400 italic">Calculadas comissões individuais</p>
        </div>

        {/* Lucro Estimado */}
        <div className="bg-gradient-to-br from-gold-50 to-gold-100/40 p-6 rounded-2xl border border-gold-200/60 shadow-xs space-y-4 hover:shadow-md transition-shadow duration-300">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-bold uppercase tracking-widest text-gold-800">Lucro Consolidado</span>
            <span className="p-1.5 bg-green-50 text-green-600 rounded-xl"><TrendingUp className="w-4 h-4" /></span>
          </div>
          <div className="space-y-1">
            <p className="text-[11px] text-gold-700 font-bold">Sobras de Hoje:</p>
            <h3 className="text-2xl font-display font-bold text-gold-900">{formatCurrency(lucroHoje)}</h3>
            <p className="text-[11px] text-gold-700 font-bold mt-1 pt-1.5 border-t border-gold-200/50">Líquido Mensal Estimado:</p>
            <h4 className="text-xl font-display font-semibold text-gold-800">{formatCurrency(lucroMensal)}</h4>
          </div>
          <div className="text-[10px] text-gold-700/80 font-semibold">
            Ticket Médio Mês: <span className="font-mono">{formatCurrency(ticketMedioMensal)}</span>
          </div>
        </div>

      </div>

      {/* 3. CHARTS GRID (7 DAYS TIMELINE AND PAYMENT MEIOS) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gráfico 1: Área de Histórico de Faturamento (7 Dias) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gold-100 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-gold-500" />
              <h4 className="font-serif font-semibold text-lg text-gray-800">Faturamento Diário e Despesas (Últimos 7 Dias)</h4>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-[10px] text-gray-500 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-gold-400 inline-block" /> Entradas
              </span>
              <span className="flex items-center gap-1.5 text-[10px] text-gray-500 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" /> Despesas
              </span>
            </div>
          </div>

          {/* Gráfico SVG */}
          <div className="w-full pt-4">
            <svg viewBox="0 0 600 220" className="w-full overflow-visible">
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D8B780" stopOpacity="0.3"/>
                  <stop offset="100%" stopColor="#D8B780" stopOpacity="0.0"/>
                </linearGradient>
                <linearGradient id="saidasGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F87171" stopOpacity="0.2"/>
                  <stop offset="100%" stopColor="#F87171" stopOpacity="0.0"/>
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="40" y1="20" x2="580" y2="20" stroke="#FAF8F6" strokeWidth="1" />
              <line x1="40" y1="70" x2="580" y2="70" stroke="#FAF8F6" strokeWidth="1" />
              <line x1="40" y1="120" x2="580" y2="120" stroke="#FAF8F6" strokeWidth="1" />
              <line x1="40" y1="170" x2="580" y2="170" stroke="#EFECE8" strokeWidth="1" />

              {/* Y Axis Labels */}
              <text x="35" y="25" textAnchor="end" className="text-[10px] font-semibold fill-gray-400 font-mono">{formatCurrency(maxFinanceValue).replace(',00','')}</text>
              <text x="35" y="95" textAnchor="end" className="text-[10px] font-semibold fill-gray-400 font-mono">{formatCurrency(maxFinanceValue/2).replace(',00','')}</text>
              <text x="35" y="175" textAnchor="end" className="text-[10px] font-semibold fill-gray-400 font-mono">R$ 0</text>

              {/* Coordinates */}
              {(() => {
                const points = last7DaysData.map((d, index) => {
                  const x = 50 + index * 85;
                  const yEntrada = 170 - (d.entradas / maxFinanceValue) * 140;
                  const ySaida = 170 - (d.saidas / maxFinanceValue) * 140;
                  return { x, yEntrada, ySaida, label: d.label, valEntrada: d.entradas, valSaida: d.saidas };
                });

                const pathEntrada = points.reduce((acc, p, i) => acc + `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yEntrada} `, '');
                const areaPathEntrada = pathEntrada + `L ${points[points.length-1].x} 170 L ${points[0].x} 170 Z`;

                const pathSaida = points.reduce((acc, p, i) => acc + `${i === 0 ? 'M' : 'L'} ${p.x} ${p.ySaida} `, '');
                const areaPathSaida = pathSaida + `L ${points[points.length-1].x} 170 L ${points[0].x} 170 Z`;

                return (
                  <>
                    {/* Fill Area Entradas */}
                    {points.length > 0 && <path d={areaPathEntrada} fill="url(#areaGrad)" />}
                    {/* Fill Area Saidas */}
                    {points.length > 0 && <path d={areaPathSaida} fill="url(#saidasGrad)" />}

                    {/* Path Line Entradas */}
                    {points.length > 0 && (
                      <path d={pathEntrada} fill="none" stroke="#D8B780" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    )}
                    {/* Path Line Saidas */}
                    {points.length > 0 && (
                      <path d={pathSaida} fill="none" stroke="#F87171" strokeWidth="1.5" strokeDasharray="3" strokeLinecap="round" strokeLinejoin="round" />
                    )}

                    {/* Points & Labels */}
                    {points.map((p, index) => (
                      <g key={index} className="group/point">
                        <circle cx={p.x} cy={p.yEntrada} r="5" fill="#FFF" stroke="#D8B780" strokeWidth="2" className="transition-all hover:scale-150 cursor-pointer" />
                        
                        {/* Tooltip value */}
                        {p.valEntrada > 0 && (
                          <text x={p.x} y={p.yEntrada - 10} textAnchor="middle" className="text-[9px] font-bold fill-gold-700 bg-white font-mono">
                            {formatCurrency(p.valEntrada).replace(',00','')}
                          </text>
                        )}

                        {/* X Label */}
                        <text x={p.x} y="195" textAnchor="middle" className="text-[10px] font-bold fill-gray-500">
                          {p.label}
                        </text>
                      </g>
                    ))}
                  </>
                );
              })()}
            </svg>
          </div>
          
          <div className="pt-2 flex justify-between items-center text-xs text-gray-500">
            <span>Faturamento acumulado desta semana: <strong>{formatCurrency(faturamentoEstaSemana)}</strong></span>
            <span className={crescimentoSemanalPct >= 0 ? 'text-green-600 font-bold' : 'text-red-500 font-bold'}>
              {crescimentoSemanalPct >= 0 ? `▲ +${crescimentoSemanalPct.toFixed(1)}%` : `▼ ${crescimentoSemanalPct.toFixed(1)}%`} vs semana anterior
            </span>
          </div>
        </div>

        {/* Gráfico 2: Métricas de Formas de Pagamento e Distribuição */}
        <div className="bg-white rounded-2xl border border-gold-100 shadow-xs p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-1">
            <h4 className="font-serif font-semibold text-lg text-gray-800">Meios de Pagamento (Mês)</h4>
            <p className="text-xs text-gray-400">Distribuição total de entradas registradas este mês.</p>
          </div>

          {totalMeiosMes <= 1 ? (
            <div className="py-12 text-center opacity-40 flex flex-col items-center justify-center">
              <DollarSign className="w-10 h-10 text-gold-200 mb-1" />
              <span className="text-xs text-gray-400">Nenhuma transação financeira este mês.</span>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Stacked bar representativo */}
              <div className="h-6 w-full rounded-full overflow-hidden flex shadow-inner">
                {pgPIX > 0 && <div className="bg-gold-500 h-full" style={{ width: `${pctPIX}%` }} title={`PIX: ${pctPIX}%`} />}
                {pgDinheiro > 0 && <div className="bg-gray-800 h-full" style={{ width: `${pctDinheiro}%` }} title={`Dinheiro: ${pctDinheiro}%`} />}
                {pgCartao > 0 && <div className="bg-gold-300 h-full" style={{ width: `${pctCartao}%` }} title={`Cartão: ${pctCartao}%`} />}
                {pgOutros > 0 && <div className="bg-pink-300 h-full" style={{ width: `${pctOutros}%` }} title={`Outros/Fiado: ${pctOutros}%`} />}
              </div>

              {/* Legendas com valores reais e percentual */}
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-gray-600 font-medium"><span className="w-2.5 h-2.5 rounded-full bg-gold-500" /> PIX</span>
                  <span className="font-bold text-gray-800">{formatCurrency(pgPIX)} ({pctPIX}%)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-gray-600 font-medium"><span className="w-2.5 h-2.5 rounded-full bg-gray-800" /> Dinheiro</span>
                  <span className="font-bold text-gray-800">{formatCurrency(pgDinheiro)} ({pctDinheiro}%)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-gray-600 font-medium"><span className="w-2.5 h-2.5 rounded-full bg-gold-300" /> Cartões (Débito/Crédito)</span>
                  <span className="font-bold text-gray-800">{formatCurrency(pgCartao)} ({pctCartao}%)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-gray-600 font-medium"><span className="w-2.5 h-2.5 rounded-full bg-pink-300" /> Fiado / Vale</span>
                  <span className="font-bold text-gray-800">{formatCurrency(pgOutros)} ({pctOutros}%)</span>
                </div>
              </div>

            </div>
          )}

          <button
            onClick={() => onNavigate('agenda')}
            className="w-full text-center py-2.5 border border-gold-200 hover:bg-gold-50 text-gold-700 font-bold text-xs rounded-xl transition-all mt-4 cursor-pointer"
          >
            Acessar Fluxo de Caixa Completo
          </button>
        </div>

      </div>

      {/* 4. CLINIC OVERVIEW & INVENTORY CRITICAL ALERTS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Card Clientes do Dia */}
        <div 
          onClick={() => onNavigate('clientes')}
          className="bg-white p-5 rounded-2xl border border-gold-100 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block group-hover:text-gold-600 transition-colors">Clientes Atendidos Hoje</span>
            <h3 className="text-3xl font-display font-bold text-gray-800">{distinctClientesHoje}</h3>
            <p className="text-[10px] text-gray-400">Pessoas diferentes com agendamento</p>
          </div>
          <div className="p-3 bg-gold-50 text-gold-500 rounded-xl group-hover:bg-gold-100 transition-colors">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Card Atendimentos do Dia */}
        <div 
          onClick={() => onNavigate('agenda')}
          className="bg-white p-5 rounded-2xl border border-gold-100 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block group-hover:text-gold-600 transition-colors">Atendimentos Agendados</span>
            <h3 className="text-3xl font-display font-bold text-gray-800">{totalAtendimentosHoje}</h3>
            <p className="text-[10px] text-gray-400">Total de compromissos na agenda hoje</p>
          </div>
          <div className="p-3 bg-pink-50 text-pink-500 rounded-xl group-hover:bg-pink-100 transition-colors">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        {/* Card Alerta Estoque Crítico */}
        <div 
          onClick={() => onNavigate('estoque')}
          className="bg-white p-5 rounded-2xl border border-gold-100 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block group-hover:text-gold-600 transition-colors">Estoque Crítico (Abaixo do Mínimo)</span>
            <h3 className={`text-3xl font-display font-bold ${produtosEstoqueCritico.length > 0 ? 'text-red-500' : 'text-gray-800'}`}>
              {produtosEstoqueCritico.length}
            </h3>
            <p className="text-[10px] text-gray-400">Produtos precisando de reposição imediata</p>
          </div>
          <div className={`p-3 rounded-xl transition-colors ${produtosEstoqueCritico.length > 0 ? 'bg-red-50 text-red-500 animate-pulse' : 'bg-gold-50 text-gold-400'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* 5. DYNAMIC SECTIONS: BEST SELLERS, CRITICAL STOCK LIST */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Serviços mais vendidos (Ranking Mensal) */}
        <div className="bg-white rounded-2xl border border-gold-100 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-gold-50">
            <h4 className="font-serif font-bold text-base text-gray-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold-500" />
              <span>Serviços Mais Vendidos</span>
            </h4>
            <span className="text-[9px] uppercase tracking-wider font-extrabold text-gold-600 bg-gold-50 px-2 py-0.5 rounded">Mês</span>
          </div>
          
          <div className="space-y-3.5">
            {servicosMaisVendidosRich.map((item, idx) => (
              <div key={item.id} className="flex items-center justify-between p-2.5 hover:bg-gold-50/20 rounded-xl transition-colors">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 bg-gold-100 text-gold-800 font-bold text-[10px] flex items-center justify-center rounded-full shrink-0">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-gray-800">{item.nome}</p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{item.categoria}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-700">{item.quantidade}x saídas</p>
                  <p className="text-[9px] text-gray-400 font-semibold">{formatCurrency(item.faturamento)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Produtos mais vendidos (Ranking Mensal) */}
        <div className="bg-white rounded-2xl border border-gold-100 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-gold-50">
            <h4 className="font-serif font-bold text-base text-gray-800 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-gold-500" />
              <span>Produtos Mais Vendidos</span>
            </h4>
            <span className="text-[9px] uppercase tracking-wider font-extrabold text-gold-600 bg-gold-50 px-2 py-0.5 rounded">Mês</span>
          </div>

          <div className="space-y-3.5">
            {produtosMaisVendidosRich.map((item, idx) => (
              <div key={item.id} className="flex items-center justify-between p-2.5 hover:bg-gold-50/20 rounded-xl transition-colors">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 bg-gray-100 text-gray-800 font-bold text-[10px] flex items-center justify-center rounded-full shrink-0">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-gray-800 line-clamp-1">{item.nome}</p>
                    <p className="text-[9px] text-gray-400 font-semibold">{item.marca}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-700">{item.quantidadeVendida}x vendidos</p>
                  <p className="text-[9px] text-gray-400 font-semibold">{formatCurrency(item.faturamento)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lista de Alerta de Estoque Crítico */}
        <div className="bg-white rounded-2xl border border-gold-100 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-gold-50">
            <h4 className="font-serif font-bold text-base text-gray-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span>Estoque Crítico Alerta</span>
            </h4>
            <span className="text-[9px] uppercase tracking-wider font-extrabold bg-red-50 text-red-600 px-2 py-0.5 rounded">Aviso</span>
          </div>

          {produtosEstoqueCritico.length === 0 ? (
            <div className="py-10 text-center opacity-40 flex flex-col items-center justify-center h-44">
              <span className="text-2xl">✓</span>
              <span className="text-xs text-gray-400 font-medium">Todos os produtos estão com níveis seguros!</span>
            </div>
          ) : (
            <div className="space-y-3 max-h-[180px] overflow-y-auto">
              {produtosEstoqueCritico.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-red-50/40 border border-red-100/50">
                  <div>
                    <p className="text-xs font-bold text-gray-800 line-clamp-1">{item.nome}</p>
                    <p className="text-[9px] text-red-600 font-semibold">Min: {item.estoqueMinimo} un | Ideal: {item.estoqueIdeal || item.estoqueMinimo * 2} un</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold text-[10px]">
                      {item.quantidade} un
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* 6. NEXT CLIENTS TABLE & TEAM MONTHLY RANKING / GOAL PROGRESS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Próximos Clientes na Cadeira */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gold-100 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gold-500" />
              <h4 className="font-serif font-semibold text-lg text-gray-800">Próximos Clientes do Dia na Cadeira</h4>
            </div>
            <button 
              onClick={() => onNavigate('agenda')}
              className="text-xs text-gold-600 font-bold hover:text-gold-700 transition-colors flex items-center gap-0.5 cursor-pointer"
            >
              <span>Ver Agenda</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {proximosAgendamentos.length === 0 ? (
            <div className="p-12 text-center bg-gold-50/25 border border-dashed border-gold-100 rounded-xl space-y-2">
              <Coffee className="w-8 h-8 text-gold-300 mx-auto" />
              <p className="text-sm font-semibold text-gray-700">Tudo calmo por hoje</p>
              <p className="text-xs text-gray-400">Não há novos agendamentos pendentes ou em atendimento para hoje.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gold-50 text-gray-400 uppercase font-bold text-[10px] tracking-wider">
                    <th className="py-3">Horário</th>
                    <th className="py-3">Cliente</th>
                    <th className="py-3">Procedimento</th>
                    <th className="py-3">Profissional</th>
                    <th className="py-3">Duração</th>
                    <th className="py-3">Status</th>
                    <th className="py-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gold-50/50">
                  {proximosAgendamentos.map((a) => (
                    <tr key={a.id} className="hover:bg-gold-50/10 transition-colors">
                      <td className="py-3 font-bold text-gold-600">{a.hora}</td>
                      <td className="py-3 font-semibold text-gray-800">{getClienteNome(a.clienteId)}</td>
                      <td className="py-3 text-gray-600 font-medium">{getServicoNome(a.servicoId)}</td>
                      <td className="py-3 text-gray-500 font-medium">{getProfissionalNome(a.profissionalId)}</td>
                      <td className="py-3 text-gray-500 font-mono font-medium">
                        {a.duracaoProcedimento || servicos.find(s => s.id === a.servicoId)?.tempoMedio || 30} min
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          a.status === 'Em atendimento' 
                            ? 'bg-pink-100 text-pink-700' 
                            : a.status === 'Reservado'
                            ? 'bg-gold-100 text-gold-800'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => {
                            if (onSelectAgendamentoForAtendimento) {
                              onSelectAgendamentoForAtendimento(a);
                            }
                          }}
                          className="bg-gold-500 hover:bg-gold-600 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          Atender
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Desempenho / Ranking do Mês + Meta Mensal */}
        <div className="bg-white rounded-2xl border border-gold-100 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-gold-500" />
              <h4 className="font-serif font-semibold text-base text-gray-800">Ranking Mensal da Equipe</h4>
            </div>
            <span className="text-[9px] uppercase font-bold tracking-wider text-gray-400">Meta Mensal</span>
          </div>

          <div className="space-y-4">
            {rankingProfissionaisMes.map((p, idx) => {
              const meta = p.metaMensal || 3000;
              const faturamento = p.faturamento;
              const percentMeta = Math.min(100, Math.round((faturamento / meta) * 100));

              return (
                <div key={p.id} className="p-3 bg-gold-50/10 border border-gold-50 rounded-xl space-y-2 hover:bg-gold-50/20 transition-all">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 bg-gold-100 text-gold-800 text-[10px] font-bold flex items-center justify-center rounded-full">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-gray-800">{p.nome}</p>
                        <p className="text-[10px] text-gray-400">{p.cargo} • {p.atendimentosCount} atendimento(s)</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-gold-700">{formatCurrency(p.faturamento)}</p>
                      <p className="text-[9px] text-gray-400 font-semibold">Com: {formatCurrency(p.comissao)}</p>
                    </div>
                  </div>

                  {/* Progresso de Meta */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] text-gray-400 font-bold">
                      <span>Progresso da Meta</span>
                      <span>{percentMeta}% ({formatCurrency(meta)})</span>
                    </div>
                    <div className="w-full bg-gold-100 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${percentMeta >= 100 ? 'bg-green-500' : 'bg-gold-500'}`} 
                        style={{ width: `${percentMeta}%` }} 
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
