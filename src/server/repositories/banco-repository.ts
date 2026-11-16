import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

/** Taxa mensal de juros configurada pelo professor (JUROS_MENSAL). */
export function findTaxaJurosMensal() {
  return prisma.parametroEconomico.findUnique({
    where: { nome: "JUROS_MENSAL" },
    select: { valor: true },
  });
}

/** Saldo atual da empresa, lido antes de validar operações do Banco. */
export function findSaldoEmpresa(empresaId: string) {
  return prisma.empresa.findUnique({
    where: { id: empresaId },
    select: { saldo: true },
  });
}

export async function somarEmprestimosAtivos(empresaId: string) {
  const resultado = await prisma.emprestimo.aggregate({
    where: { empresaId, status: "ATIVO" },
    _sum: { totalDevido: true },
    _count: { _all: true },
  });

  return {
    totalDevido: Number(resultado._sum.totalDevido ?? 0),
    quantidade: resultado._count._all,
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

const emprestimoSelect = {
  id: true,
  valorPrincipal: true,
  taxaJurosMensal: true,
  totalDevido: true,
  status: true,
  criadoEm: true,
  criadoPor: {
    select: { nome: true },
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
    },
  });
}

/**
 * Contrata o empréstimo, credita o principal no saldo e registra o lançamento
 * no extrato — tudo na mesma transação de banco de dados.
 */
export function criarEmprestimoComCredito(dados: {
  empresaId: string;
  userId: string;
  valorPrincipal: number;
  taxaJurosMensal: number;
  totalDevido: number;
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
        criadoPorUserId: dados.userId,
      },
      select: emprestimoSelect,
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
 * Marca a aplicação como resgatada e credita principal + rendimento.
 * A condição `status: ATIVO` no `updateMany` impede resgate duplicado em
 * requisições concorrentes; se nada for atualizado, devolve `null`.
 */
export function resgatarInvestimentoComCredito(dados: {
  empresaId: string;
  userId: string;
  investimentoId: string;
  valorResgate: number;
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
        descricao: "Resgate de investimento com rendimento",
        valor: dados.valorResgate,
        criadoPorUserId: dados.userId,
        rodadaId: dados.rodadaId ?? null,
      },
    });

    return { saldo: Number(empresa.saldo) };
  });
}
