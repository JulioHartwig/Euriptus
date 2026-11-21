import {
  adicionarMeses,
  arredondarValor,
  calcularDescontoQuitacao,
  calcularLimiteEmprestimo,
  calcularTotalDevido,
  calcularValorParcela,
  calcularValorResgate,
  FATOR_RENDIMENTO_JUROS,
  LIMITE_EMPRESTIMO_MULTIPLICADOR,
  MAX_PARCELAS_EMPRESTIMO,
  PARAMETRO_DESCONTO_QUITACAO,
  PARAMETRO_TAXA_RESGATE,
} from "@/lib/banco";
import { primeiroDiaDoMes } from "@/lib/rodada";
import { formatCurrency } from "@/lib/utils";
import {
  criarEmprestimoComCredito,
  criarInvestimentoComDebito,
  findInvestimentoAtivo,
  findParametro,
  findSaldoEmpresa,
  findTaxaJurosMensal,
  listEmprestimosDaEmpresa,
  listInvestimentosDaEmpresa,
  pagarParcelaComDebito,
  quitarEmprestimoComDesconto,
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
  descontoQuitacao: number;
  taxaResgateAntecipado: number;
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

async function getParametro(nome: string, padrao: number) {
  const parametro = await findParametro(nome);
  return parametro ? Number(parametro.valor) : padrao;
}

/**
 * Taxas vigentes para exibição. Retorna `null` quando o parâmetro principal não
 * existe, permitindo que a página mostre um aviso em vez de quebrar.
 */
export async function getTaxasBanco(): Promise<TaxasBanco | null> {
  const parametro = await findTaxaJurosMensal();

  if (!parametro) {
    return null;
  }

  const jurosMensal = Number(parametro.valor);

  const [descontoQuitacao, taxaResgateAntecipado] = await Promise.all([
    getParametro(PARAMETRO_DESCONTO_QUITACAO, 0.05),
    getParametro(PARAMETRO_TAXA_RESGATE, 0.05),
  ]);

  return {
    jurosMensal,
    rendimentoMensal: jurosMensal * FATOR_RENDIMENTO_JUROS,
    descontoQuitacao,
    taxaResgateAntecipado,
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

/** Dívida ativa total (saldo das parcelas pendentes), usada no painel. */
export async function getDividaTotal(empresaId: string) {
  return somarEmprestimosAtivos(empresaId);
}

export function getEmprestimos(empresaId: string) {
  return listEmprestimosDaEmpresa(empresaId);
}

export function getInvestimentos(empresaId: string) {
  return listInvestimentosDaEmpresa(empresaId);
}

/** Solicita um empréstimo parcelado de até 3× o saldo atual. */
export async function solicitarEmprestimo({
  empresaId,
  userId,
  valor,
  parcelas,
}: {
  empresaId: string;
  userId: string;
  valor: number;
  parcelas: number;
}) {
  const valorPrincipal = arredondarValor(valor);
  const numeroParcelas = Math.trunc(parcelas);

  if (valorPrincipal <= 0) {
    throw new BancoError("O valor do empréstimo deve ser maior que zero.");
  }

  if (
    !Number.isInteger(numeroParcelas) ||
    numeroParcelas < 1 ||
    numeroParcelas > MAX_PARCELAS_EMPRESTIMO
  ) {
    throw new BancoError(`Escolha entre 1 e ${MAX_PARCELAS_EMPRESTIMO} parcelas.`);
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

  const totalDevido = calcularTotalDevido(
    valorPrincipal,
    taxaJurosMensal,
    numeroParcelas,
  );
  const valorParcela = calcularValorParcela(totalDevido, numeroParcelas);
  const agora = new Date();

  // Ajusta a última parcela para que a soma seja exatamente o total devido.
  const parcelasGeradas = Array.from({ length: numeroParcelas }, (_, indice) => {
    const numero = indice + 1;
    const ehUltima = numero === numeroParcelas;
    const valorDaParcela = ehUltima
      ? arredondarValor(totalDevido - valorParcela * (numeroParcelas - 1))
      : valorParcela;

    return {
      numero,
      valor: valorDaParcela,
      vencimento: adicionarMeses(agora, numero),
    };
  });

  const rodadaId = await getRodadaAbertaId();
  const { emprestimo, saldo } = await criarEmprestimoComCredito({
    empresaId,
    userId,
    valorPrincipal,
    taxaJurosMensal,
    totalDevido,
    numeroParcelas,
    valorParcela,
    parcelas: parcelasGeradas,
    rodadaId,
  });

  return {
    emprestimo,
    saldo,
    totalDevido,
    taxaJurosMensal,
    valorParcela,
    numeroParcelas,
  };
}

/** Paga uma parcela pendente usando o saldo da empresa. */
export async function pagarParcela({
  empresaId,
  userId,
  parcelaId,
}: {
  empresaId: string;
  userId: string;
  parcelaId: string;
}) {
  const rodadaId = await getRodadaAbertaId();
  const resultado = await pagarParcelaComDebito({
    empresaId,
    userId,
    parcelaId,
    rodadaId,
  });

  if (!resultado.ok) {
    throw new BancoError(
      resultado.motivo === "SALDO_INSUFICIENTE"
        ? "Saldo insuficiente para pagar esta parcela."
        : "Parcela não encontrada ou já paga.",
    );
  }

  return resultado;
}

/** Quita o contrato com desconto sobre as parcelas ainda não vencidas. */
export async function quitarEmprestimo({
  empresaId,
  userId,
  emprestimoId,
}: {
  empresaId: string;
  userId: string;
  emprestimoId: string;
}) {
  const emprestimo = await listEmprestimosDaEmpresa(empresaId).then((lista) =>
    lista.find((item) => item.id === emprestimoId && item.status === "ATIVO"),
  );

  if (!emprestimo) {
    throw new BancoError("Empréstimo não encontrado ou já quitado.");
  }

  const pendentes = emprestimo.parcelas.filter((parcela) => parcela.status === "PENDENTE");

  if (pendentes.length === 0) {
    throw new BancoError("Este empréstimo já está quitado.");
  }

  const saldoDevedor = arredondarValor(
    pendentes.reduce((total, parcela) => total + Number(parcela.valor), 0),
  );
  const taxaDesconto = await getParametro(PARAMETRO_DESCONTO_QUITACAO, 0.05);
  const desconto = calcularDescontoQuitacao(saldoDevedor, taxaDesconto);
  const valorPago = arredondarValor(saldoDevedor - desconto);

  const fator = saldoDevedor > 0 ? valorPago / saldoDevedor : 1;
  const rodadaId = await getRodadaAbertaId();

  const resultado = await quitarEmprestimoComDesconto({
    empresaId,
    userId,
    emprestimoId,
    valorPago,
    desconto,
    parcelas: pendentes.map((parcela) => ({
      id: parcela.id,
      valorPago: arredondarValor(Number(parcela.valor) * fator),
    })),
    rodadaId,
  });

  if (!resultado.ok) {
    throw new BancoError(
      resultado.motivo === "SALDO_INSUFICIENTE"
        ? `Saldo insuficiente. Para quitar com desconto você precisa de ${formatCurrency(valorPago)}.`
        : "Empréstimo não encontrado ou já quitado.",
    );
  }

  return { valorPago, desconto, saldoDevedor, saldo: resultado.saldo, taxaDesconto };
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
 * Resgata uma aplicação ativa. Se a aplicação foi feita na mesma rodada/mês,
 * não há rendimento e incide a taxa de resgate antecipado.
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

  const rodadaId = await getRodadaAbertaId();
  const mesmaRodada = investimento.rodadaCriacaoId
    ? Boolean(rodadaId) && investimento.rodadaCriacaoId === rodadaId
    : primeiroDiaDoMes(investimento.criadoEm).getTime() ===
      primeiroDiaDoMes(new Date()).getTime();

  const taxaResgate = mesmaRodada
    ? await getParametro(PARAMETRO_TAXA_RESGATE, 0.05)
    : 0;

  const valorResgate = calcularValorResgate(
    Number(investimento.valorAplicado),
    Number(investimento.taxaRendimentoMensal),
    mesmaRodada,
    taxaResgate,
  );

  const descricao = mesmaRodada
    ? `Resgate na mesma rodada — sem rendimento, taxa de resgate antecipado de ${(taxaResgate * 100).toFixed(2).replace(".", ",")}%`
    : "Resgate de investimento com rendimento";

  const resultado = await resgatarInvestimentoComCredito({
    empresaId,
    userId,
    investimentoId,
    valorResgate,
    taxaResgateAplicada: taxaResgate,
    descricao,
    resgatadoEm: new Date(),
    rodadaId,
  });

  if (!resultado) {
    throw new BancoError("Este investimento já foi resgatado.");
  }

  return { valorResgate, saldo: resultado.saldo, mesmaRodada, taxaResgate };
}
