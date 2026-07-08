/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  User, 
  Scissors, 
  Package, 
  CreditCard, 
  ChevronRight, 
  Filter,
  BarChart2,
  FileSpreadsheet,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  Printer,
  TrendingDown,
  Download
} from 'lucide-react';
import { Agendamento, Cliente, Profissional, Servico, Produto, MovimentacaoEstoque, CaixaTransacao, Configuracao } from '../types';

interface RelatoriosProps {
  agendamentos: Agendamento[];
  clientes: Cliente[];
  profissionais: Profissional[];
  servicos: Servico[];
  produtos: Produto[];
  movimentacoes: MovimentacaoEstoque[];
  caixaTransacoes?: CaixaTransacao[];
  configuracao: Configuracao;
}

export default function Relatorios({
  agendamentos,
  clientes,
  profissionais,
  servicos,
  produtos,
  movimentacoes,
  caixaTransacoes = [],
  configuracao
}: RelatoriosProps) {
  // Filtros de período (padrão de 2026-07-01 a 2026-07-07)
  const [startDate, setStartDate] = useState('2026-07-01');
  const [endDate, setEndDate] = useState('2026-07-07');

  // Filtrar agendamentos concluídos no período
  const atendimentosPeriodo = agendamentos.filter(a => {
    if (a.status !== 'Concluído') return false;
    const dataAtendimento = a.data;
    return dataAtendimento >= startDate && dataAtendimento <= endDate;
  });

  // Filtrar lançamentos de caixa no período (para faturamento e despesas completas)
  const transacoesPeriodo = caixaTransacoes.filter(t => {
    return t.data >= startDate && t.data <= endDate;
  });

  // Filtrar movimentações do estoque no período
  const movimentacoesPeriodo = movimentacoes.filter(m => {
    const dataM = m.data.substring(0, 10);
    return dataM >= startDate && dataM <= endDate;
  });

  // AUXILIARES DE CÁLCULO FINANCEIRO INTEGRADO

  // 1. Recebimento Bruto Total no período (serviços + vendas de produtos, excluindo aportes de abertura)
  const faturamentoTotal = transacoesPeriodo
    .filter(t => t.tipo === 'Entrada' && t.descricao !== 'Saldo de Abertura do Caixa')
    .reduce((acc, curr) => acc + curr.valor, 0);

  // 2. Despesas Totais no período (saídas e despesas gerais)
  const despesasTotal = transacoesPeriodo
    .filter(t => t.tipo === 'Saída')
    .reduce((acc, curr) => acc + curr.valor, 0);

  // 3. Comissões Totais do período
  const comissoesTotal = atendimentosPeriodo.reduce((acc, curr) => acc + (curr.comissaoProfissional || 0), 0);

  // 4. Lucro Líquido Real (Faturamento - Despesas - Comissões)
  const lucroReal = Math.max(0, faturamentoTotal - despesasTotal - comissoesTotal);

  // 5. Métricas por Meio de Pagamento
  const pagamentoStats = transacoesPeriodo
    .filter(t => t.tipo === 'Entrada' && t.descricao !== 'Saldo de Abertura do Caixa')
    .reduce((acc, curr) => {
      const metodo = curr.formaPagamento || 'Outro';
      acc[metodo] = (acc[metodo] || 0) + curr.valor;
      return acc;
    }, {} as Record<string, number>);

  const pagamentoContagem = transacoesPeriodo
    .filter(t => t.tipo === 'Entrada' && t.descricao !== 'Saldo de Abertura do Caixa')
    .reduce((acc, curr) => {
      const metodo = curr.formaPagamento || 'Outro';
      acc[metodo] = (acc[metodo] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  // 6. Atendimentos por Profissional (Faturamento, Comissão, Qtd)
  interface ProfissionalReport {
    id: string;
    nome: string;
    quantidade: number;
    faturamento: number;
    comissao: number;
  }

  const profissionalReports: Record<string, ProfissionalReport> = {};
  profissionais.forEach(p => {
    profissionalReports[p.id] = {
      id: p.id,
      nome: p.nome,
      quantidade: 0,
      faturamento: 0,
      comissao: 0
    };
  });

  atendimentosPeriodo.forEach(a => {
    const pId = a.profissionalId;
    if (!profissionalReports[pId]) {
      profissionalReports[pId] = {
        id: pId,
        nome: profissionais.find(p => p.id === pId)?.nome || 'Ex-Profissional',
        quantidade: 0,
        faturamento: 0,
        comissao: 0
      };
    }
    profissionalReports[pId].quantidade += 1;
    profissionalReports[pId].faturamento += (a.valorPago || 0);
    profissionalReports[pId].comissao += (a.comissaoProfissional || 0);
  });

  const profissionalReportList = Object.values(profissionalReports).sort((a, b) => b.faturamento - a.faturamento);

  // 7. Atendimentos por Serviço (Mais Procurados)
  interface ServicoReport {
    id: string;
    nome: string;
    quantidade: number;
    faturamento: number;
  }

  const servicoReports: Record<string, ServicoReport> = {};
  servicos.forEach(s => {
    servicoReports[s.id] = {
      id: s.id,
      nome: s.nome,
      quantidade: 0,
      faturamento: 0
    };
  });

  atendimentosPeriodo.forEach(a => {
    const sId = a.servicoId;
    if (!servicoReports[sId]) {
      servicoReports[sId] = {
        id: sId,
        nome: servicos.find(s => s.id === sId)?.nome || 'Ex-Serviço',
        quantidade: 0,
        faturamento: 0
      };
    }
    servicoReports[sId].quantidade += 1;
    servicoReports[sId].faturamento += (a.valorPago || 0);
  });

  const servicoReportList = Object.values(servicoReports).sort((a, b) => b.quantidade - a.quantidade);

  // 8. Produtos com Estoque Baixo
  const produtosBaixoEstoque = produtos.filter(p => p.quantidade <= p.estoqueMinimo);

  // 9. Entradas e Saídas do Estoque
  let entradasEstoque = 0;
  let saidasEstoque = 0;
  movimentacoesPeriodo.forEach(m => {
    if (m.tipo === 'Entrada') entradasEstoque += m.quantidade;
    if (m.tipo === 'Saída') saidasEstoque += m.quantidade;
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  // ==========================================
  // EXPORTADORES OFFLINE EM FORMATOS PADRÃO
  // ==========================================

  // Exportar Excel (CSV offline)
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += `${configuracao.nomeSalao} - Relatorio Gerencial\r\n`;
    csvContent += `Periodo: ${formatDate(startDate)} ate ${formatDate(endDate)}\r\n\r\n`;

    // Secção 1: Indicadores
    csvContent += 'INDICADOR,VALOR\r\n';
    csvContent += `Faturamento Bruto,${formatCurrency(faturamentoTotal).replace('R$', '').trim()}\r\n`;
    csvContent += `Despesas Operacionais,${formatCurrency(despesasTotal).replace('R$', '').trim()}\r\n`;
    csvContent += `Comissoes Devidas,${formatCurrency(comissoesTotal).replace('R$', '').trim()}\r\n`;
    csvContent += `Lucro Liquido Real,${formatCurrency(lucroReal).replace('R$', '').trim()}\r\n\r\n`;

    // Secção 2: Profissionais
    csvContent += 'PROFISSIONAL,ATENDIMENTOS,FATURAMENTO BRUTO,COMISSAO DEVIDA,REPASSE SALAO\r\n';
    profissionalReportList.forEach(rep => {
      const salaoL = rep.faturamento - rep.comissao;
      csvContent += `"${rep.nome}",${rep.quantidade},${rep.faturamento.toFixed(2)},${rep.comissao.toFixed(2)},${salaoL.toFixed(2)}\r\n`;
    });
    csvContent += '\r\n';

    // Secção 3: Serviços
    csvContent += 'SERVICO,QUANTIDADE,FATURAMENTO TOTAL\r\n';
    servicoReportList.forEach(s => {
      csvContent += `"${s.nome}",${s.quantidade},${s.faturamento.toFixed(2)}\r\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_studioflow_${startDate}_a_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Exportar PDF (Imprimir Tela Otimizada)
  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-fade-in print:p-0">
      
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gold-100 pb-5 print:border-b-0 print:pb-0">
        <div>
          <div className="hidden print:flex items-center gap-3 mb-4">
            {configuracao.logoUrl ? (
               <img src={configuracao.logoUrl} alt="Logo" className="w-12 h-12 object-contain" />
            ) : null}
            <div>
               <h1 className="text-xl font-serif font-bold">{configuracao.nomeSalao}</h1>
               <p className="text-xs text-gray-500">Relatório Operacional e Financeiro</p>
            </div>
          </div>
          <h2 className="text-2xl font-serif font-semibold text-gray-800 flex items-center gap-2 print:hidden">
            <BarChart2 className="w-6 h-6 text-gold-500" />
            <span>Relatórios & Business Intelligence</span>
          </h2>
          <p className="text-sm text-gray-500 print:hidden">Visualização total de lucro líquido, faturamento consolidado de vendas/serviços, comissões e estoque.</p>
          <p className="text-xs text-gray-400 hidden print:block font-mono mt-2 border-b border-gray-200 pb-2">Período Selecionado: {formatDate(startDate)} até {formatDate(endDate)}</p>
        </div>

        {/* Filtros e Exportações - Ocultos em Impressão */}
        <div className="flex flex-wrap items-center gap-3 print:hidden">
          
          {/* Inputs de Período */}
          <div className="bg-white p-3 rounded-xl border border-gold-100 shadow-xs flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-gold-500" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-gold-50/20 border border-gold-100 rounded-lg px-2.5 py-1 text-xs text-gray-700 focus:outline-hidden"
            />
            <span className="text-xs text-gray-400">até</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-gold-50/20 border border-gold-100 rounded-lg px-2.5 py-1 text-xs text-gray-700 focus:outline-hidden"
            />
          </div>

          {/* Botões de Exportação */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="bg-white hover:bg-gold-50 text-gold-700 font-semibold text-xs px-3 py-3 rounded-xl border border-gold-100 shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              title="Exportar Planilha Excel"
            >
              <Download className="w-4 h-4 text-gold-500" />
              <span>Excel (CSV)</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="bg-gold-500 hover:bg-gold-600 text-white font-semibold text-xs px-3 py-3 rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              title="Imprimir Relatório"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir PDF</span>
            </button>
          </div>

        </div>
      </div>

      {/* Grid de KPIs do Período Filtrado */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Faturamento Consolidado */}
        <div className="bg-white p-5 rounded-2xl border border-gold-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Arrecadação Bruta</p>
            <h3 className="text-2xl font-display font-bold text-gray-800">{formatCurrency(faturamentoTotal)}</h3>
            <p className="text-[10px] text-green-600 font-semibold">Serviços + Vendas de balcão</p>
          </div>
          <div className="p-3 bg-green-50 text-green-600 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Despesas Gerais */}
        <div className="bg-white p-5 rounded-2xl border border-gold-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Despesas / Saídas</p>
            <h3 className="text-2xl font-display font-bold text-red-600">{formatCurrency(despesasTotal)}</h3>
            <p className="text-[10px] text-gray-400">Total de saídas de caixa</p>
          </div>
          <div className="p-3 bg-red-50 text-red-500 rounded-xl">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        {/* Comissões pagas */}
        <div className="bg-white p-5 rounded-2xl border border-gold-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Comissões Equipe</p>
            <h3 className="text-2xl font-display font-bold text-gray-800">{formatCurrency(comissoesTotal)}</h3>
            <p className="text-[10px] text-gold-600 font-semibold">{atendimentosPeriodo.length} atendimentos</p>
          </div>
          <div className="p-3 bg-gold-50 text-gold-600 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Lucro Líquido Real */}
        <div className="bg-gradient-to-br from-gold-500 to-gold-600 p-5 rounded-2xl text-white shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gold-100">Resultado Líquido</p>
            <h3 className="text-2xl font-display font-bold">{formatCurrency(lucroReal)}</h3>
            <p className="text-[10px] text-gold-50">Faturamento menos saídas/comissões</p>
          </div>
          <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md">
            <BarChart2 className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Grid Intermediário: Formas de Pagamento e Serviços Procurados */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Formas de Pagamento */}
        <div className="bg-white p-6 rounded-2xl border border-gold-100 shadow-xs space-y-5">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-gold-500" />
            <h4 className="font-serif font-semibold text-base text-gray-800">Meios de Pagamento do Período</h4>
          </div>

          {transacoesPeriodo.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Sem faturamento registrado no período.</p>
          ) : (
            <div className="space-y-4">
              {(['Dinheiro', 'PIX', 'Cartão', 'Fiado'] as const).map((method) => {
                const totalValor = pagamentoStats[method] || 0;
                const contagem = pagamentoContagem[method] || 0;
                const percent = faturamentoTotal > 0 ? Math.round((totalValor / faturamentoTotal) * 100) : 0;
                
                return (
                  <div key={method} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium text-gray-600">
                      <span className="font-semibold text-gray-800">{method} ({contagem}x)</span>
                      <span>{formatCurrency(totalValor)} ({percent}%)</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-gold-50 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          method === 'Dinheiro' ? 'bg-[#4D4030]' :
                          method === 'PIX' ? 'bg-gold-500' :
                          method === 'Cartão' ? 'bg-[#AA8855]' : 'bg-red-500'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Serviços mais procurados */}
        <div className="bg-white p-6 rounded-2xl border border-gold-100 shadow-xs space-y-5">
          <div className="flex items-center gap-2">
            <Scissors className="w-5 h-5 text-gold-500" />
            <h4 className="font-serif font-semibold text-base text-gray-800">Ranking de Serviços (Procedimentos)</h4>
          </div>

          {atendimentosPeriodo.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Sem registros de atendimentos realizados no período.</p>
          ) : (
            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {servicoReportList.filter(s => s.quantidade > 0).map((s, index) => (
                <div key={s.id} className="flex items-center justify-between p-2.5 rounded-xl bg-gold-50/20 border border-gold-50/50">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-gold-100 text-gold-800 flex items-center justify-center text-xs font-bold font-display">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{s.nome}</p>
                      <p className="text-xs text-gray-400">{s.quantidade} atendimento(s) realizado(s)</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-xs text-gold-600 font-mono">{formatCurrency(s.faturamento)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Tabela de Atendimentos por Profissional */}
      <div className="bg-white rounded-2xl border border-gold-100 shadow-xs overflow-hidden">
        
        <div className="p-5 border-b border-gold-50 bg-gold-50/10">
          <h4 className="font-serif font-semibold text-base text-gray-800 flex items-center gap-2">
            <User className="w-5 h-5 text-gold-500" />
            Rendimento por Profissional (Colaborador)
          </h4>
          <p className="text-xs text-gray-400">Repasse financeiro e rateio de comissões profissionais.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gold-50 bg-gold-50/20 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="p-4 pl-6">Profissional</th>
                <th className="p-4 text-center">Atendimentos Realizados</th>
                <th className="p-4">Faturamento Bruto</th>
                <th className="p-4">Comissão a Pagar</th>
                <th className="p-4 pr-6 text-right">Faturamento Líquido Salão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold-50/50">
              {profissionalReportList.map((rep) => {
                const repasseSalao = rep.faturamento - rep.comissao;
                return (
                  <tr key={rep.id} className="text-sm hover:bg-gold-50/10 transition-colors">
                    <td className="p-4 pl-6 font-semibold text-gray-800">
                      {rep.nome}
                    </td>
                    <td className="p-4 text-center font-bold text-gray-600">
                      {rep.quantidade}x
                    </td>
                    <td className="p-4 font-mono text-xs text-gray-700">
                      {formatCurrency(rep.faturamento)}
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-xs bg-gold-50 text-gold-700 px-2.5 py-1 rounded-lg">
                        {formatCurrency(rep.comissao)}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right font-bold text-gray-800 font-mono text-xs">
                      {formatCurrency(repasseSalao)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

      {/* Relatório de Movimentação de Estoque e Baixo Estoque */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Resumo Movimentações de Estoque */}
        <div className="bg-white p-6 rounded-2xl border border-gold-100 shadow-xs lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-gold-500" />
            <h4 className="font-serif font-semibold text-base text-gray-800">Histórico de Movimentação de Mercadorias</h4>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-green-50/40 border border-green-100 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-gray-400 block font-medium">Entradas de Estoque</span>
                <span className="text-2xl font-bold text-green-700 font-display">+{entradasEstoque} <span className="text-xs font-normal">unidades</span></span>
              </div>
              <ArrowUpRight className="w-8 h-8 text-green-500" />
            </div>

            <div className="p-4 bg-red-50/40 border border-red-100 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-gray-400 block font-medium">Saídas / Consumos</span>
                <span className="text-2xl font-bold text-red-700 font-display">-{saidasEstoque} <span className="text-xs font-normal">unidades</span></span>
              </div>
              <ArrowDownLeft className="w-8 h-8 text-red-500" />
            </div>
          </div>

          {movimentacoesPeriodo.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">Nenhuma movimentação registrada neste período.</p>
          ) : (
            <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
              {movimentacoesPeriodo.map((m) => (
                <div key={m.id} className="text-xs p-2.5 border border-gold-50/50 bg-gold-50/10 rounded-lg flex justify-between gap-4">
                  <span className="text-gray-400 shrink-0">{m.data.substring(5, 16)}</span>
                  <span className="font-semibold text-gray-800 truncate flex-1">
                    {produtos.find(p => p.id === m.produtoId)?.nome || 'Produto Desconhecido'}
                  </span>
                  <span className={`font-bold ${m.tipo === 'Entrada' ? 'text-green-600' : 'text-red-600'}`}>
                    {m.tipo === 'Entrada' ? '+' : '-'}{m.quantidade} un
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Produtos Críticos */}
        <div className="bg-white p-6 rounded-2xl border border-gold-100 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h4 className="font-serif font-semibold text-base text-gray-800">Necessidade de Reposição</h4>
          </div>

          {produtosBaixoEstoque.length === 0 ? (
            <div className="text-center py-8 bg-green-50/30 rounded-xl border border-dashed border-green-100">
              <p className="text-sm font-semibold text-green-700">Estoque 100% Equilibrado</p>
              <p className="text-xs text-gray-400 mt-1">Todos os produtos acima do limite mínimo.</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {produtosBaixoEstoque.map(p => (
                <div key={p.id} className="p-3 bg-red-50/40 border border-red-100 rounded-xl flex items-center justify-between text-xs">
                  <div className="truncate pr-2">
                    <p className="font-semibold text-gray-800 truncate">{p.nome}</p>
                    <p className="text-gray-400">Qtd Atual: {p.quantidade} (Mín: {p.estoqueMinimo})</p>
                  </div>
                  <span className="bg-red-100 text-red-700 px-2 py-1 rounded-lg font-bold shrink-0">{p.quantidade} un</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
