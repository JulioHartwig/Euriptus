import type { TransacaoTipo } from "@prisma/client";

import { formatCurrency } from "@/lib/utils";

export const TRANSACAO_TIPOS: TransacaoTipo[] = [
  "RECEITA",
  "DESPESA",
  "IMPOSTO",
  "SALARIO",
  "JUROS",
  "EMPRESTIMO",
  "INVESTIMENTO",
  "RESGATE",
];

export const TRANSACAO_TIPO_LABEL: Record<TransacaoTipo, string> = {
  RECEITA: "Receita",
  DESPESA: "Despesa",
  IMPOSTO: "Imposto",
  SALARIO: "Salário",
  JUROS: "Juros",
  EMPRESTIMO: "Empréstimo",
  INVESTIMENTO: "Investimento",
  RESGATE: "Resgate",
};

/** Variante visual do Badge no extrato. */
export const TRANSACAO_TIPO_BADGE: Record<
  TransacaoTipo,
  "default" | "secondary" | "outline" | "accent" | "destructive"
> = {
  RECEITA: "default",
  DESPESA: "secondary",
  IMPOSTO: "outline",
  SALARIO: "secondary",
  JUROS: "outline",
  EMPRESTIMO: "accent",
  INVESTIMENTO: "accent",
  RESGATE: "accent",
};

/**
 * Efeito no caixa: +1 entra, -1 sai.
 * Os valores no banco são sempre positivos; o tipo define o sinal.
 */
export const TRANSACAO_SINAL: Record<TransacaoTipo, 1 | -1> = {
  RECEITA: 1,
  DESPESA: -1,
  IMPOSTO: -1,
  SALARIO: -1,
  JUROS: -1,
  EMPRESTIMO: 1,
  INVESTIMENTO: -1,
  RESGATE: 1,
};

export function formatarValorTransacao(tipo: TransacaoTipo, valor: number) {
  const sinal = TRANSACAO_SINAL[tipo] > 0 ? "+" : "−";
  return `${sinal} ${formatCurrency(valor)}`;
}
