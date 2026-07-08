import fs from "fs";

let content = fs.readFileSync("src/types.ts", "utf8");

const newTypes = `
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
`;

content = content + newTypes;

// Let's also update Agendamento to support pagamentos mistos
content = content.replace(/formaPagamento\?: 'Dinheiro' \| 'PIX' \| 'Cartão' \| 'Débito' \| 'Crédito' \| 'Fiado' \| 'Vale';/, "formaPagamento?: FormaPagamento;\n  pagamentos?: PagamentoMisto[];");

// And CaixaTransacao to support FormaPagamento
content = content.replace(/formaPagamento: 'Dinheiro' \| 'PIX' \| 'Cartão' \| 'Débito' \| 'Crédito' \| 'Fiado' \| 'Vale';/, "formaPagamento: FormaPagamento;");

fs.writeFileSync("src/types.ts", content);
