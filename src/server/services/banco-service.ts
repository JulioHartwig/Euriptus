import {
  arredondarValor,
  calcularLimiteEmprestimo,
  calcularTotalDevido,
  calcularValorResgate,
  FATOR_RENDIMENTO_JUROS,
  LIMITE_EMPRESTIMO_MULTIPLICADOR,
} from "@/lib/banco";
import { formatCurrency } from "@/lib/utils";
import {
  criarEmprestimoComCredito,
  criarInvestimentoComDebito,
  findInvestimentoAtivo,
  findSaldoEmpresa,
  findTaxaJurosMensal,
  listEmprestimosDaEmpresa,
  listInvestimentosDaEmpresa,
  resgatarInvestimentoComCredito,
  somarEmprestimosAtivos,
  somarInvestimentosAtivos,
} from "@/server/repositories/banco-repository";
import { getRodadaAbertaId } from "@/server/services/rodada-service";

/** Erro de negócio do Banco, com mensagem pronta para a interface. */
export class BancoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BancoError";
  }
}

export type TaxasBanco = {
  jurosMensal: number;
  rendimentoMensal: number;
};

async function getTaxaJurosMensal() {
  const parametro = await findTaxaJurosMensal();

  if (!parametro) {
    throw new BancoError(
      "O parâmetro econômico JUROS_MENSAL não está configurado. Rode o seed do banco.",
    );
  }

  return Number(parametro.valor);
}

/**
 * Taxas vigentes para exibição. Retorna `null` quando o parâmetro não existe,
 * permitindo que a página mostre um aviso em vez de quebrar.
 */
export async function getTaxasBanco(): Promise<TaxasBanco | null> {
  const parametro = await findTaxaJurosMensal();

  if (!parametro) {
    return null;
  }

  const jurosMensal = Number(parametro.valor);

  return {
    jurosMensal,
    rendimentoMensal: jurosMensal * FATOR_RENDIMENTO_JUROS,
  };
}

export async function getResumoBanco(empresaId: string) {
  const [emprestimos, investimentos] = await Promise.all([
    somarEmprestimosAtivos(empresaId),
    somarInvestimentosAtivos(empresaId),
  ]);

  return {
    dividaTotal: emprestimos.totalDevido,
    emprestimosAtivos: emprestimos.quantidade,
    totalAplicado: investimentos.totalAplicado,
    investimentosAtivos: investimentos.quantidade,
  };
}

/** Dívida ativa total, usada no indicador do painel. */
export async function getDividaTotal(empresaId: string) {
  return somarEmprestimosAtivos(empresaId);
}

export function getEmprestimos(empresaId: string) {
  return listEmprestimosDaEmpresa(empresaId);
}

export function getInvestimentos(empresaId: string) {
  return listInvestimentosDaEmpresa(empresaId);
}

/**
 * Solicita um empréstimo de até 3× o saldo atual.
 * O principal é creditado imediatamente; a dívida total já inclui um mês de
 * juros. A quitação será processada nas rodadas (Etapa 7).
 */
export async function solicitarEmprestimo({
  empresaId,
  userId,
  valor,
}: {
  empresaId: string;
  userId: string;
  valor: number;
}) {
  const valorPrincipal = arredondarValor(valor);

  if (valorPrincipal <= 0) {
    throw new BancoError("O valor do empréstimo deve ser maior que zero.");
  }

  const [taxaJurosMensal, empresa] = await Promise.all([
    getTaxaJurosMensal(),
    findSaldoEmpresa(empresaId),
  ]);

  if (!empresa) {
    throw new BancoError("Empresa não encontrada.");
  }

  const limite = calcularLimiteEmprestimo(Number(empresa.saldo));

  if (valorPrincipal > limite) {
    throw new BancoError(
      `O limite para empréstimo é ${formatCurrency(limite)} (${LIMITE_EMPRESTIMO_MULTIPLICADOR}× o saldo atual).`,
    );
  }

  const totalDevido = calcularTotalDevido(valorPrincipal, taxaJurosMensal);

  const rodadaId = await getRodadaAbertaId();
  const { emprestimo, saldo } = await criarEmprestimoComCredito({
    empresaId,
    userId,
    valorPrincipal,
    taxaJurosMensal,
    totalDevido,
    rodadaId,
  });

  return { emprestimo, saldo, totalDevido, taxaJurosMensal };
}

/** Aplica parte do saldo em um investimento com rendimento mensal fixo. */
export async function aplicarInvestimento({
  empresaId,
  userId,
  valor,
}: {
  empresaId: string;
  userId: string;
  valor: number;
}) {
  const valorAplicado = arredondarValor(valor);

  if (valorAplicado <= 0) {
    throw new BancoError("O valor da aplicação deve ser maior que zero.");
  }

  const [taxaJurosMensal, empresa] = await Promise.all([
    getTaxaJurosMensal(),
    findSaldoEmpresa(empresaId),
  ]);

  if (!empresa) {
    throw new BancoError("Empresa não encontrada.");
  }

  const saldo = Number(empresa.saldo);

  if (valorAplicado > saldo) {
    throw new BancoError(
      `Saldo insuficiente. O saldo disponível é ${formatCurrency(saldo)}.`,
    );
  }

  const taxaRendimentoMensal = taxaJurosMensal * FATOR_RENDIMENTO_JUROS;

  const rodadaId = await getRodadaAbertaId();
  const resultado = await criarInvestimentoComDebito({
    empresaId,
    userId,
    valorAplicado,
    taxaRendimentoMensal,
    rodadaId,
  });

  if (!resultado) {
    throw new BancoError(
      "O saldo mudou durante a operação. Recarregue a página e tente novamente.",
    );
  }

  return {
    investimento: resultado.investimento,
    saldo: resultado.saldo,
    taxaRendimentoMensal,
    valorResgatePrevisto: calcularValorResgate(
      valorAplicado,
      taxaRendimentoMensal,
    ),
  };
}

/**
 * Resgata uma aplicação ativa pagando principal + rendimento de um mês.
 * O valor é fixado pela taxa gravada no contrato, não pela taxa atual.
 */
export async function resgatarInvestimento({
  empresaId,
  userId,
  investimentoId,
}: {
  empresaId: string;
  userId: string;
  investimentoId: string;
}) {
  const investimento = await findInvestimentoAtivo(empresaId, investimentoId);

  if (!investimento) {
    throw new BancoError("Investimento não encontrado ou já resgatado.");
  }

  const valorResgate = calcularValorResgate(
    Number(investimento.valorAplicado),
    Number(investimento.taxaRendimentoMensal),
  );

  const rodadaId = await getRodadaAbertaId();
  const resultado = await resgatarInvestimentoComCredito({
    empresaId,
    userId,
    investimentoId,
    valorResgate,
    resgatadoEm: new Date(),
    rodadaId,
  });

  if (!resultado) {
    throw new BancoError("Este investimento já foi resgatado.");
  }

  return { valorResgate, saldo: resultado.saldo };
}
