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

/** Parâmetros econômicos adicionados para as novas regras de banco. */
export const PARAMETRO_DESCONTO_QUITACAO = "DESCONTO_QUITACAO";
export const PARAMETRO_TAXA_RESGATE = "TAXA_RESGATE_ANTECIPADO";

/** Quantidade máxima de parcelas aceita na contratação. */
export const MAX_PARCELAS_EMPRESTIMO = 12;

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

/**
 * Juros simples por mês. Com parcelamento, a taxa incide sobre cada mês de prazo.
 */
export function calcularTotalDevido(
  principal: number,
  taxaJurosMensal: number,
  numeroParcelas = 1,
) {
  return arredondarValor(
    principal * (1 + taxaJurosMensal * Math.max(numeroParcelas, 1)),
  );
}

export function calcularValorParcela(totalDevido: number, numeroParcelas: number) {
  return arredondarValor(totalDevido / Math.max(numeroParcelas, 1));
}

/**
 * Soma meses a uma data. Quando o mês destino é mais curto, ajusta para o
 * último dia disponível (31/01 + 1 mês = 28/02, não 03/03).
 */
export function adicionarMeses(data: Date, meses: number) {
  const ano = data.getUTCFullYear();
  const mes = data.getUTCMonth() + meses;
  const ultimoDia = new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate();

  return new Date(
    Date.UTC(
      ano,
      mes,
      Math.min(data.getUTCDate(), ultimoDia),
      data.getUTCHours(),
      data.getUTCMinutes(),
      data.getUTCSeconds(),
      data.getUTCMilliseconds(),
    ),
  );
}

export function calcularDescontoQuitacao(saldoDevedor: number, taxaDesconto: number) {
  return arredondarValor(Math.max(saldoDevedor, 0) * Math.max(taxaDesconto, 0));
}

/**
 * Resgate na mesma rodada/mês não rende e sofre a taxa de resgate antecipado.
 * Fora da rodada de aplicação, rende a taxa gravada no contrato.
 */
export function calcularValorResgate(
  valorAplicado: number,
  taxaRendimentoMensal: number,
  mesmaRodada = false,
  taxaResgate = 0,
) {
  if (mesmaRodada) {
    return arredondarValor(valorAplicado * (1 - Math.max(taxaResgate, 0)));
  }

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
      fieldErrors?: { valor?: string[] | undefined; parcelas?: string[] | undefined };
      submittedAt: number;
    };
