import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

type OperacaoBancoResultado =
  | { ok: true; saldo: number }
  | { ok: false; motivo: "NAO_ENCONTRADO" | "SALDO_INSUFICIENTE" };

/** Parâmetro econômico genérico (taxas, descontos e multas). */
export function findParametro(nome: string) {
  return prisma.parametroEconomico.findUnique({
    where: { nome },
    select: { valor: true },
  });
}

/** Taxa mensal de juros configurada pelo professor (JUROS_MENSAL). */
export function findTaxaJurosMensal() {
  return findParametro("JUROS_MENSAL");
}

/** Saldo atual da empresa, lido antes de validar operações do Banco. */
export function findSaldoEmpresa(empresaId: string) {
  return prisma.empresa.findUnique({
    where: { id: empresaId },
    select: { saldo: true },
  });
}

export async function somarEmprestimosAtivos(empresaId: string) {
  const [parcelas, emprestimos] = await Promise.all([
    prisma.parcelaEmprestimo.aggregate({
      where: { status: "PENDENTE", emprestimo: { empresaId } },
      _sum: { valor: true },
    }),
    prisma.emprestimo.count({ where: { empresaId, status: "ATIVO" } }),
  ]);

  return {
    totalDevido: Number(parcelas._sum.valor ?? 0),
    quantidade: emprestimos,
  };
}

export async function somarInvestimentosAtivos(empresaId: string) {
  const resultado = await prisma.investimento.aggregate({
    where: { empresaId, status: "ATIVO" },
    _sum: { valorAplicado: true },
    _count: { _all: true },
  });

  return {
    totalAplicado: Number(resultado._sum.valorAplicado ?? 0),
    quantidade: resultado._count._all,
  };
}

const parcelaSelect = {
  id: true,
  numero: true,
  valor: true,
  vencimento: true,
  status: true,
  valorPago: true,
  pagaEm: true,
} satisfies Prisma.ParcelaEmprestimoSelect;

const emprestimoSelect = {
  id: true,
  valorPrincipal: true,
  taxaJurosMensal: true,
  totalDevido: true,
  numeroParcelas: true,
  valorParcela: true,
  descontoAplicado: true,
  quitadoEm: true,
  status: true,
  criadoEm: true,
  criadoPor: {
    select: { nome: true },
  },
  parcelas: {
    select: parcelaSelect,
    orderBy: { numero: "asc" },
  },
} satisfies Prisma.EmprestimoSelect;

export type EmprestimoComAutor = Prisma.EmprestimoGetPayload<{
  select: typeof emprestimoSelect;
}>;

/** Contratos da empresa: ativos primeiro, depois os mais recentes. */
export function listEmprestimosDaEmpresa(empresaId: string) {
  return prisma.emprestimo.findMany({
    where: { empresaId },
    select: emprestimoSelect,
    orderBy: [{ status: "asc" }, { criadoEm: "desc" }],
  });
}

const investimentoSelect = {
  id: true,
  valorAplicado: true,
  taxaRendimentoMensal: true,
  valorResgate: true,
  rodadaCriacaoId: true,
  taxaResgateAplicada: true,
  status: true,
  criadoEm: true,
  resgatadoEm: true,
  criadoPor: {
    select: { nome: true },
  },
  resgatadoPor: {
    select: { nome: true },
  },
} satisfies Prisma.InvestimentoSelect;

export type InvestimentoComAutores = Prisma.InvestimentoGetPayload<{
  select: typeof investimentoSelect;
}>;

/** Aplicações da empresa: ativas primeiro, depois as mais recentes. */
export function listInvestimentosDaEmpresa(empresaId: string) {
  return prisma.investimento.findMany({
    where: { empresaId },
    select: investimentoSelect,
    orderBy: [{ status: "asc" }, { criadoEm: "desc" }],
  });
}

export function findInvestimentoAtivo(empresaId: string, investimentoId: string) {
  return prisma.investimento.findFirst({
    where: { id: investimentoId, empresaId, status: "ATIVO" },
    select: {
      id: true,
      valorAplicado: true,
      taxaRendimentoMensal: true,
      rodadaCriacaoId: true,
      criadoEm: true,
    },
  });
}

/**
 * Contrata o empréstimo, credita o principal, cria as parcelas mensais e
 * registra o lançamento — tudo na mesma transação de banco de dados.
 */
export function criarEmprestimoComCredito(dados: {
  empresaId: string;
  userId: string;
  valorPrincipal: number;
  taxaJurosMensal: number;
  totalDevido: number;
  numeroParcelas: number;
  valorParcela: number;
  parcelas: Array<{ numero: number; valor: number; vencimento: Date }>;
  rodadaId?: string | null;
}) {
  return prisma.$transaction(async (tx) => {
    const empresa = await tx.empresa.update({
      where: { id: dados.empresaId },
      data: { saldo: { increment: dados.valorPrincipal } },
      select: { saldo: true },
    });

    const emprestimo = await tx.emprestimo.create({
      data: {
        empresaId: dados.empresaId,
        valorPrincipal: dados.valorPrincipal,
        taxaJurosMensal: dados.taxaJurosMensal,
        totalDevido: dados.totalDevido,
        numeroParcelas: dados.numeroParcelas,
        valorParcela: dados.valorParcela,
        rodadaCriacaoId: dados.rodadaId ?? null,
        criadoPorUserId: dados.userId,
      },
      select: emprestimoSelect,
    });

    await tx.parcelaEmprestimo.createMany({
      data: dados.parcelas.map((parcela) => ({
        emprestimoId: emprestimo.id,
        numero: parcela.numero,
        valor: parcela.valor,
        vencimento: parcela.vencimento,
      })),
    });

    await tx.transacao.create({
      data: {
        empresaId: dados.empresaId,
        tipo: "EMPRESTIMO",
        descricao: "Crédito de empréstimo bancário",
        valor: dados.valorPrincipal,
        criadoPorUserId: dados.userId,
        rodadaId: dados.rodadaId ?? null,
      },
    });

    return { emprestimo, saldo: Number(empresa.saldo) };
  });
}

/** Paga uma parcela pendente com trava de saldo. */
export async function pagarParcelaComDebito(dados: {
  empresaId: string;
  userId: string;
  parcelaId: string;
  rodadaId?: string | null;
}): Promise<OperacaoBancoResultado> {
  return prisma.$transaction(async (tx) => {
    const parcela = await tx.parcelaEmprestimo.findFirst({
      where: {
        id: dados.parcelaId,
        status: "PENDENTE",
        emprestimo: { empresaId: dados.empresaId },
      },
      select: {
        id: true,
        numero: true,
        valor: true,
        emprestimoId: true,
      },
    });

    if (!parcela) return { ok: false, motivo: "NAO_ENCONTRADO" as const };

    const debito = await tx.empresa.updateMany({
      where: { id: dados.empresaId, saldo: { gte: parcela.valor } },
      data: { saldo: { decrement: parcela.valor } },
    });

    if (debito.count === 0) {
      return { ok: false, motivo: "SALDO_INSUFICIENTE" as const };
    }

    await tx.parcelaEmprestimo.update({
      where: { id: parcela.id },
      data: {
        status: "PAGA",
        valorPago: parcela.valor,
        pagaEm: new Date(),
        pagaPorUserId: dados.userId,
      },
    });

    const pendentes = await tx.parcelaEmprestimo.count({
      where: { emprestimoId: parcela.emprestimoId, status: "PENDENTE" },
    });

    if (pendentes === 0) {
      await tx.emprestimo.update({
        where: { id: parcela.emprestimoId },
        data: { status: "QUITADO", quitadoEm: new Date() },
      });
    }

    await tx.transacao.create({
      data: {
        empresaId: dados.empresaId,
        tipo: "PAGAMENTO_EMPRESTIMO",
        descricao: `Pagamento da parcela ${parcela.numero || 1} de empréstimo`,
        valor: Number(parcela.valor),
        criadoPorUserId: dados.userId,
        rodadaId: dados.rodadaId ?? null,
      },
    });

    const empresa = await tx.empresa.findUniqueOrThrow({
      where: { id: dados.empresaId },
      select: { saldo: true },
    });

    return { ok: true, saldo: Number(empresa.saldo) };
  });
}

/** Quita todas as parcelas pendentes com desconto por antecipação. */
export async function quitarEmprestimoComDesconto(dados: {
  empresaId: string;
  userId: string;
  emprestimoId: string;
  valorPago: number;
  desconto: number;
  parcelas: Array<{ id: string; valorPago: number }>;
  rodadaId?: string | null;
}): Promise<OperacaoBancoResultado> {
  return prisma.$transaction(async (tx) => {
    const emprestimo = await tx.emprestimo.findFirst({
      where: { id: dados.emprestimoId, empresaId: dados.empresaId, status: "ATIVO" },
      select: {
        id: true,
        parcelas: {
          where: { status: "PENDENTE" },
          select: { id: true, numero: true },
        },
      },
    });

    if (!emprestimo || emprestimo.parcelas.length === 0) {
      return { ok: false, motivo: "NAO_ENCONTRADO" as const };
    }

    const debito = await tx.empresa.updateMany({
      where: { id: dados.empresaId, saldo: { gte: dados.valorPago } },
      data: { saldo: { decrement: dados.valorPago } },
    });

    if (debito.count === 0) {
      return { ok: false, motivo: "SALDO_INSUFICIENTE" as const };
    }

    const valoresPorId = new Map(dados.parcelas.map((p) => [p.id, p.valorPago]));

    for (const parcela of emprestimo.parcelas) {
      await tx.parcelaEmprestimo.update({
        where: { id: parcela.id },
        data: {
          status: "PAGA",
          valorPago: valoresPorId.get(parcela.id) ?? 0,
          pagaEm: new Date(),
          pagaPorUserId: dados.userId,
        },
      });
    }

    await tx.emprestimo.update({
      where: { id: emprestimo.id },
      data: {
        status: "QUITADO",
        quitadoEm: new Date(),
        descontoAplicado: dados.desconto,
      },
    });

    await tx.transacao.create({
      data: {
        empresaId: dados.empresaId,
        tipo: "PAGAMENTO_EMPRESTIMO",
        descricao: `Quitação antecipada de empréstimo com desconto de ${dados.desconto.toFixed(2)}`,
        valor: dados.valorPago,
        criadoPorUserId: dados.userId,
        rodadaId: dados.rodadaId ?? null,
      },
    });

    const empresa = await tx.empresa.findUniqueOrThrow({
      where: { id: dados.empresaId },
      select: { saldo: true },
    });

    return { ok: true, saldo: Number(empresa.saldo) };
  });
}

/**
 * Debita a aplicação do saldo e cria o contrato. O `updateMany` com
 * `saldo >= valor` funciona como trava: se o saldo tiver mudado desde a
 * validação, nada é debitado e a função devolve `null`.
 */
export function criarInvestimentoComDebito(dados: {
  empresaId: string;
  userId: string;
  valorAplicado: number;
  taxaRendimentoMensal: number;
  rodadaId?: string | null;
}) {
  return prisma.$transaction(async (tx) => {
    const debito = await tx.empresa.updateMany({
      where: { id: dados.empresaId, saldo: { gte: dados.valorAplicado } },
      data: { saldo: { decrement: dados.valorAplicado } },
    });

    if (debito.count === 0) {
      return null;
    }

    const investimento = await tx.investimento.create({
      data: {
        empresaId: dados.empresaId,
        valorAplicado: dados.valorAplicado,
        taxaRendimentoMensal: dados.taxaRendimentoMensal,
        rodadaCriacaoId: dados.rodadaId ?? null,
        criadoPorUserId: dados.userId,
      },
      select: investimentoSelect,
    });

    await tx.transacao.create({
      data: {
        empresaId: dados.empresaId,
        tipo: "INVESTIMENTO",
        descricao: "Aplicação financeira",
        valor: dados.valorAplicado,
        criadoPorUserId: dados.userId,
        rodadaId: dados.rodadaId ?? null,
      },
    });

    const empresa = await tx.empresa.findUniqueOrThrow({
      where: { id: dados.empresaId },
      select: { saldo: true },
    });

    return { investimento, saldo: Number(empresa.saldo) };
  });
}

/**
 * Marca a aplicação como resgatada e credita o valor calculado no serviço.
 * A condição `status: ATIVO` no `updateMany` impede resgate duplicado em
 * requisições concorrentes; se nada for atualizado, devolve `null`.
 */
export function resgatarInvestimentoComCredito(dados: {
  empresaId: string;
  userId: string;
  investimentoId: string;
  valorResgate: number;
  taxaResgateAplicada: number;
  descricao: string;
  resgatadoEm: Date;
  rodadaId?: string | null;
}) {
  return prisma.$transaction(async (tx) => {
    const atualizacao = await tx.investimento.updateMany({
      where: {
        id: dados.investimentoId,
        empresaId: dados.empresaId,
        status: "ATIVO",
      },
      data: {
        status: "RESGATADO",
        valorResgate: dados.valorResgate,
        taxaResgateAplicada: dados.taxaResgateAplicada,
        resgatadoEm: dados.resgatadoEm,
        resgatadoPorUserId: dados.userId,
      },
    });

    if (atualizacao.count === 0) {
      return null;
    }

    const empresa = await tx.empresa.update({
      where: { id: dados.empresaId },
      data: { saldo: { increment: dados.valorResgate } },
      select: { saldo: true },
    });

    await tx.transacao.create({
      data: {
        empresaId: dados.empresaId,
        tipo: "RESGATE",
        descricao: dados.descricao,
        valor: dados.valorResgate,
        criadoPorUserId: dados.userId,
        rodadaId: dados.rodadaId ?? null,
      },
    });

    return { saldo: Number(empresa.saldo) };
  });
}
