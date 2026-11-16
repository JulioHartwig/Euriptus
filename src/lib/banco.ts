import type { StatusEmprestimo, StatusInvestimento } from "@prisma/client";

/**
 * Regras do módulo Banco.
 *
 * O empréstimo é limitado a 3× o saldo atual da empresa e cobra juros simples
 * de um mês (`JUROS_MENSAL`). O investimento rende metade da taxa de juros ao
 * mês. As duas taxas são gravadas no contrato no momento da operação, então
 * mudanças futuras em `ParametroEconomico` não alteram contratos já firmados.
 */
export const LIMITE_EMPRESTIMO_MULTIPLICADOR = 3;

/** O rendimento do investimento é metade da taxa de juros mensal. */
export const FATOR_RENDIMENTO_JUROS = 0.5;

export const STATUS_EMPRESTIMO_LABEL: Record<StatusEmprestimo, string> = {
  ATIVO: "Ativo",
  QUITADO: "Quitado",
};

export const STATUS_EMPRESTIMO_BADGE: Record<
  StatusEmprestimo,
  "default" | "secondary"
> = {
  ATIVO: "default",
  QUITADO: "secondary",
};

export const STATUS_INVESTIMENTO_LABEL: Record<StatusInvestimento, string> = {
  ATIVO: "Ativo",
  RESGATADO: "Resgatado",
};

export const STATUS_INVESTIMENTO_BADGE: Record<
  StatusInvestimento,
  "default" | "secondary"
> = {
  ATIVO: "default",
  RESGATADO: "secondary",
};

/** Arredonda para centavos, evitando artefatos de ponto flutuante. */
export function arredondarValor(valor: number) {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

export function calcularLimiteEmprestimo(saldo: number) {
  return arredondarValor(Math.max(saldo, 0) * LIMITE_EMPRESTIMO_MULTIPLICADOR);
}

export function calcularTotalDevido(principal: number, taxaJurosMensal: number) {
  return arredondarValor(principal * (1 + taxaJurosMensal));
}

export function calcularValorResgate(
  valorAplicado: number,
  taxaRendimentoMensal: number,
) {
  return arredondarValor(valorAplicado * (1 + taxaRendimentoMensal));
}

export function formatarTaxa(taxa: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(taxa);
}

/**
 * Estado compartilhado entre os formulários do Banco e as Server Actions.
 * `submittedAt` garante que o toast dispare a cada novo envio, mesmo quando a
 * mensagem é idêntica à anterior.
 */
export type BancoActionState =
  | { status: "idle" }
  | { status: "success"; message: string; submittedAt: number }
  | {
      status: "error";
      message: string;
      fieldErrors?: { valor?: string[] | undefined };
      submittedAt: number;
    };
