/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ProntuarioTecnico {
  id: string;
  data: string; // YYYY-MM-DD
  fotosAntes?: string[]; // base64 strings or placeholders
  fotosDepois?: string[]; // base64 strings or placeholders
  formulaUtilizada?: string;
  coloracao?: string;
  produtosUtilizados?: string[]; // array of product IDs or names
  tempoPausa?: number; // em minutos
  observacoesProfissional?: string;
}

export interface Cliente {
  salaoId?: string;
  id: string;
  nome: string;
  telefone: string;
  email: string;
  observacoes: string;
  dataCadastro: string;
  foto?: string; // base64 ou URL
  whatsapp?: string;
  cpf?: string;
  dataNascimento?: string; // YYYY-MM-DD
  endereco?: string;
  prontuarios?: ProntuarioTecnico[];
}

export interface Profissional {
  salaoId?: string;
  id: string;
  nome: string;
  comissao: number; // Porcentagem (ex: 30 para 30%)
  telefone: string;
  ativo: boolean;
  foto?: string;
  cargo?: string; // ex: Cabeleireira, Barbeiro, Manicure
  especialidade?: string;
  especialidades?: string[];
  metaMensal?: number;
  comisaoCustomizada?: number; // Para compatibilidade
}

export interface Servico {
  salaoId?: string;
  id: string;
  nome: string;
  valor: number;
  tempoMedio: number; // Em minutos
  comissaoPadrao: number; // Porcentagem (ex: 30 para 30%)
  produtosConsumidos?: { produtoId: string; quantidade: number }[];
  categoria?: string; // ex: Cabelo, Unhas, Estética
  imagem?: string;
}

export type StatusAgendamento = 'Livre' | 'Reservado' | 'Em atendimento' | 'Concluído' | 'Cancelado' | 'Agendado';

export interface Agendamento {
  salaoId?: string;
  id: string;
  clienteId: string;
  profissionalId: string;
  servicoId: string;
  data: string; // YYYY-MM-DD
  hora: string; // HH:MM
  status: StatusAgendamento;
  observacoes?: string;
  duracaoProcedimento?: number; // Em minutos
  horarioFinalPrevisto?: string; // HH:MM
  // Registrados ao finalizar
  formaPagamento?: FormaPagamento;
  pagamentos?: PagamentoMisto[];
  valorPago?: number;
  comissaoProfissional?: number;
  dataFinalizacao?: string;
}

export interface Produto {
  salaoId?: string;
  id: string;
  nome: string;
  categoria: string;
  marca: string;
  quantidade: number;
  estoqueMinimo: number;
  valorCusto: number;
  valorVenda: number;
  fornecedor: string;
  observacoes: string;
  codigo?: string;
  codigoBarras?: string;
  lote?: string;
  validade?: string; // YYYY-MM-DD
  estoqueIdeal?: number;
}

export interface MovimentacaoEstoque {
  salaoId?: string;
  id: string;
  produtoId: string;
  tipo: 'Entrada' | 'Saída' | 'Ajuste' | 'Inventário';
  quantidade: number;
  data: string; // YYYY-MM-DD HH:MM
  observacoes: string;
}

export interface CaixaTransacao {
  salaoId?: string;
  id: string;
  tipo: 'Entrada' | 'Saída';
  descricao: string;
  valor: number;
  data: string; // YYYY-MM-DD
  hora: string; // HH:MM
  categoria: 'Serviço' | 'Venda de Produto' | 'Despesa' | 'Aporte' | 'Sangria' | 'Suprimento' | 'Fechamento';
  formaPagamento: FormaPagamento;
}

export interface CaixaStatus {
  id?: string;
  salaoId?: string;
  aberto: boolean;
  saldoAbertura: number;
  dataAbertura?: string;
  saldoAcumulado?: number;
}

export type TipoNotificacao = 'agendamento' | 'lembrete' | 'atraso' | 'sistema';

export interface Notificacao {
  id?: string;
  salaoId?: string;
  tipo: TipoNotificacao;
  mensagem: string;
  dataHora: string;
  lida: boolean;
  destinatarioId?: string;
  agendamentoId?: string;
}

export type SegmentoNegocio = 'Salão de Beleza' | 'Barbearia' | 'Clínica de Estética' | 'Nail Designer' | 'Spa' | 'Podologia' | 'Depilação' | 'Harmonização Facial';

export type UserRole = 'admin' | 'recepcionista' | 'profissional' | 'gerente';

export interface Usuario {
  id: string;
  uid: string;
  nome: string;
  email: string;
  role: UserRole;
  salaoId: string;
  ativo: boolean;
  profissionalId?: string; // se for um profissional, linka com o cadastro dele
}


export interface HorarioDia {
  dia: string;
  aberto: boolean;
  abertura: string;
  fechamento: string;
  intervaloInicio: string;
  intervaloFim: string;
}

export interface Configuracao {
  id?: string;
  salaoId?: string;
  nomeSalao: string; // Nome fantasia
  razaoSocial?: string;
  cnpj?: string;
  segmento?: SegmentoNegocio;
  endereco: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  telefone: string;
  whatsapp?: string;
  instagram?: string;
  facebook?: string;
  email?: string;
  site?: string;
  horarioFuncionamento?: HorarioDia[];
  logoUrl?: string; // Base64 da logo ou placeholder
  theme?: 'light' | 'dark';
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
}

export type FormaPagamento = 'Dinheiro' | 'PIX' | 'Cartão de Débito' | 'Cartão de Crédito' | 'Transferência Bancária' | 'Voucher' | 'Convênio' | 'Fiado' | 'Cartão' | 'Débito' | 'Crédito' | 'Vale';

export type StatusParcela = 'Em Aberto' | 'Pago' | 'Vencido' | 'Cancelado' | 'Renegociado';

export interface Parcela {
  id: string;
  numero: number;
  valor: number;
  vencimento: string; // YYYY-MM-DD
  status: StatusParcela;
  dataPagamento?: string; // YYYY-MM-DD
  formaPagamento?: FormaPagamento;
  valorRecebido?: number;
  desconto?: number;
  juros?: number;
  multa?: number;
  observacao?: string;
}

export interface ContaReceber {
  salaoId?: string;
  id: string;
  clienteId: string;
  dataEmissao: string; // YYYY-MM-DD
  valorTotal: number;
  valorEntrada?: number;
  saldoDevedor: number;
  origem: 'Agendamento' | 'Venda' | 'Lançamento Manual';
  origemId?: string;
  parcelas: Parcela[];
  status: 'Aberto' | 'Pago' | 'Vencido' | 'Parcial' | 'Cancelado';
  observacoes?: string;
}

export interface PagamentoMisto {
  forma: FormaPagamento;
  valor: number;
}
