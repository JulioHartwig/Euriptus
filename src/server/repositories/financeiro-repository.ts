import type { Prisma, TransacaoTipo } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type TotalPorTipo = {
  tipo: TransacaoTipo;
  total: number;
  quantidade: number;
};

/** Soma os lançamentos da empresa agrupados por tipo. */
export async function somarTransacoesPorTipo(
  empresaId: string,
): Promise<TotalPorTipo[]> {
  const grupos = await prisma.transacao.groupBy({
    by: ["tipo"],
    where: { empresaId },
    _sum: { valor: true },
    _count: { _all: true },
  });

  return grupos.map((grupo) => ({
    tipo: grupo.tipo,
    total: Number(grupo._sum.valor ?? 0),
    quantidade: grupo._count._all,
  }));
}

const transacaoSelect = {
  id: true,
  tipo: true,
  descricao: true,
  valor: true,
  quantidade: true,
  rodadaId: true,
  rodada: { select: { numero: true, competencia: true } },
  criadoEm: true,
  criadoPor: {
    select: {
      nome: true,
    },
  },
} satisfies Prisma.TransacaoSelect;

export type TransacaoComAutor = Prisma.TransacaoGetPayload<{
  select: typeof transacaoSelect;
}>;

/** Extrato da empresa, do lançamento mais recente para o mais antigo. */
export function listTransacoesDaEmpresa(empresaId: string, limite = 50) {
  return prisma.transacao.findMany({
    where: { empresaId },
    select: transacaoSelect,
    orderBy: [{ criadoEm: "desc" }, { id: "desc" }],
    take: limite,
  });
}

/** Custos fixos da empresa; por padrão, apenas os ativos. */
export function listCustosFixosDaEmpresa(
  empresaId: string,
  { apenasAtivos = true }: { apenasAtivos?: boolean } = {},
) {
  return prisma.custoFixo.findMany({
    where: { empresaId, ...(apenasAtivos ? { ativo: true } : {}) },
    orderBy: { descricao: "asc" },
  });
}
