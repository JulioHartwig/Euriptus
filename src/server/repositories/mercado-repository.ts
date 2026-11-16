import type { EmpresaTipo, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const catalogoSelect = {
  id: true,
  nome: true,
  descricao: true,
  unidade: true,
  preco: true,
  empresaTipo: true,
} satisfies Prisma.CatalogoItemSelect;

export type CatalogoItemResumo = Prisma.CatalogoItemGetPayload<{
  select: typeof catalogoSelect;
}>;

/** Itens ativos disponíveis para o tipo da empresa (ou globais). */
export function listCatalogoParaEmpresa(tipo: EmpresaTipo) {
  return prisma.catalogoItem.findMany({
    where: {
      ativo: true,
      OR: [{ empresaTipo: null }, { empresaTipo: tipo }],
    },
    select: catalogoSelect,
    orderBy: [{ empresaTipo: "asc" }, { nome: "asc" }],
  });
}

export function findCatalogoItemAtivo(id: string, tipo: EmpresaTipo) {
  return prisma.catalogoItem.findFirst({
    where: {
      id,
      ativo: true,
      OR: [{ empresaTipo: null }, { empresaTipo: tipo }],
    },
    select: catalogoSelect,
  });
}

const estoqueSelect = {
  id: true,
  quantidade: true,
  atualizadoEm: true,
  catalogoItem: {
    select: {
      id: true,
      nome: true,
      unidade: true,
      preco: true,
    },
  },
} satisfies Prisma.EstoqueItemSelect;

export type EstoqueItemComCatalogo = Prisma.EstoqueItemGetPayload<{
  select: typeof estoqueSelect;
}>;

export function listEstoqueDaEmpresa(empresaId: string) {
  return prisma.estoqueItem.findMany({
    where: { empresaId, quantidade: { gt: 0 } },
    select: estoqueSelect,
    orderBy: { catalogoItem: { nome: "asc" } },
  });
}

export async function somarEstoque(empresaId: string) {
  const resultado = await prisma.estoqueItem.aggregate({
    where: { empresaId },
    _sum: { quantidade: true },
  });

  return resultado._sum.quantidade ?? 0;
}

export function findSaldoEmpresa(empresaId: string) {
  return prisma.empresa.findUnique({
    where: { id: empresaId },
    select: { saldo: true },
  });
}

/**
 * Compra: debita saldo (com trava), registra transação e incrementa estoque.
 * Retorna `null` se o saldo for insuficiente no momento da atualização.
 */
export function comprarItemComDebito(dados: {
  empresaId: string;
  userId: string;
  catalogoItemId: string;
  nomeItem: string;
  quantidade: number;
  valorTotal: number;
  rodadaId?: string | null;
}) {
  return prisma.$transaction(async (tx) => {
    const debito = await tx.empresa.updateMany({
      where: { id: dados.empresaId, saldo: { gte: dados.valorTotal } },
      data: { saldo: { decrement: dados.valorTotal } },
    });

    if (debito.count === 0) {
      return null;
    }

    await tx.transacao.create({
      data: {
        empresaId: dados.empresaId,
        tipo: "DESPESA",
        descricao: `Compra: ${dados.nomeItem} (${dados.quantidade} ${dados.quantidade === 1 ? "unidade" : "unidades"})`,
        valor: dados.valorTotal,
        criadoPorUserId: dados.userId,
        rodadaId: dados.rodadaId ?? null,
      },
    });

    const estoque = await tx.estoqueItem.upsert({
      where: {
        empresaId_catalogoItemId: {
          empresaId: dados.empresaId,
          catalogoItemId: dados.catalogoItemId,
        },
      },
      update: { quantidade: { increment: dados.quantidade } },
      create: {
        empresaId: dados.empresaId,
        catalogoItemId: dados.catalogoItemId,
        quantidade: dados.quantidade,
      },
      select: estoqueSelect,
    });

    const empresa = await tx.empresa.findUniqueOrThrow({
      where: { id: dados.empresaId },
      select: { saldo: true },
    });

    return { saldo: Number(empresa.saldo), estoque };
  });
}
