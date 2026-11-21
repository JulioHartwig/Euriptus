import type { EmpresaTipo, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const catalogoSelect = {
  id: true,
  nome: true,
  descricao: true,
  unidade: true,
  preco: true,
  empresaTipo: true,
  categoria: true,
  aumentoCapacidade: true,
  aumentoMarketing: true,
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
  valorTotal: true,
  atualizadoEm: true,
  catalogoItem: {
    select: {
      id: true,
      nome: true,
      unidade: true,
      preco: true,
      categoria: true,
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
    _sum: { quantidade: true, valorTotal: true },
  });

  return {
    quantidade: resultado._sum.quantidade ?? 0,
    valorTotal: Number(resultado._sum.valorTotal ?? 0),
  };
}

export function findSaldoEmpresa(empresaId: string) {
  return prisma.empresa.findUnique({
    where: { id: empresaId },
    select: { saldo: true, capacidadeProducao: true, multiplicadorMarketing: true },
  });
}

/**
 * Compra: debita saldo (com trava), registra transação, incrementa estoque com
 * valor contábil e aplica melhorias de capacidade/marketing. Retorna `null` se o
 * saldo for insuficiente no momento da atualização.
 */
export function comprarItemComDebito(dados: {
  empresaId: string;
  userId: string;
  catalogoItemId: string;
  nomeItem: string;
  quantidade: number;
  valorTotal: number;
  categoria: "INSUMO" | "PRODUTO" | "MELHORIA";
  aumentoCapacidade: number;
  aumentoMarketing: number;
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

    const dadosEmpresa: Prisma.EmpresaUpdateInput = {};

    if (dados.categoria === "MELHORIA") {
      if (dados.aumentoCapacidade > 0) {
        dadosEmpresa.capacidadeProducao = { increment: dados.aumentoCapacidade };
      }
      if (dados.aumentoMarketing > 0) {
        dadosEmpresa.multiplicadorMarketing = {
          increment: dados.aumentoMarketing,
        };
      }
    }

    if (Object.keys(dadosEmpresa).length > 0) {
      await tx.empresa.update({
        where: { id: dados.empresaId },
        data: dadosEmpresa,
      });
    }

    await tx.transacao.create({
      data: {
        empresaId: dados.empresaId,
        tipo: "DESPESA",
        descricao: `Compra: ${dados.nomeItem} (${dados.quantidade} ${dados.quantidade === 1 ? "unidade" : "unidades"})`,
        valor: dados.valorTotal,
        quantidade: dados.quantidade,
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
      update: {
        quantidade: { increment: dados.quantidade },
        valorTotal: { increment: dados.valorTotal },
      },
      create: {
        empresaId: dados.empresaId,
        catalogoItemId: dados.catalogoItemId,
        quantidade: dados.quantidade,
        valorTotal: dados.valorTotal,
      },
      select: estoqueSelect,
    });

    const empresa = await tx.empresa.findUniqueOrThrow({
      where: { id: dados.empresaId },
      select: {
        saldo: true,
        capacidadeProducao: true,
        multiplicadorMarketing: true,
      },
    });

    return {
      saldo: Number(empresa.saldo),
      estoque,
      capacidadeProducao: empresa.capacidadeProducao,
      multiplicadorMarketing: Number(empresa.multiplicadorMarketing),
    };
  });
}

/** Registros de produção para o histórico da empresa. */
export function listProducoesDaEmpresa(empresaId: string, limite = 50) {
  return prisma.producaoRodada.findMany({
    where: { empresaId },
    select: {
      id: true,
      quantidade: true,
      capacidadeAplicada: true,
      criadoEm: true,
      criadoPor: { select: { nome: true } },
      catalogoItem: { select: { nome: true, unidade: true } },
      rodada: { select: { numero: true, competencia: true } },
    },
    orderBy: [{ criadoEm: "desc" }, { id: "desc" }],
    take: limite,
  });
}

/** Produção/prestação registrada no mês, por item. */
export function listProducaoDaRodada(empresaId: string, rodadaId: string) {
  return prisma.producaoRodada.findMany({
    where: { empresaId, rodadaId },
    select: {
      quantidade: true,
      capacidadeAplicada: true,
      catalogoItem: { select: { nome: true, unidade: true } },
    },
    orderBy: { catalogoItem: { nome: "asc" } },
  });
}

export async function somarProducaoDaRodada(empresaId: string, rodadaId: string) {
  const resultado = await prisma.producaoRodada.aggregate({
    where: { empresaId, rodadaId },
    _sum: { quantidade: true },
  });

  return resultado._sum.quantidade ?? 0;
}

/** Itens produtivos (categoria PRODUTO) liberados para o tipo da empresa. */
export function listProdutosParaEmpresa(tipo: EmpresaTipo) {
  return prisma.catalogoItem.findMany({
    where: {
      ativo: true,
      categoria: "PRODUTO",
      OR: [{ empresaTipo: null }, { empresaTipo: tipo }],
    },
    select: catalogoSelect,
    orderBy: { nome: "asc" },
  });
}

/**
 * Registra a produção mensal, respeitando a capacidade disponível no atomo da
 * transação, e adiciona a quantidade ao estoque sem custo de compra.
 */
export async function registrarProducao(dados: {
  empresaId: string;
  userId: string;
  rodadaId: string;
  catalogoItemId: string;
  quantidade: number;
  capacidadeTotal: number;
}): Promise<
  | { ok: true; quantidade: number; capacidadeUsada: number; estoque: EstoqueItemComCatalogo }
  | { ok: false; motivo: "LIMITE_EXCEDIDO" | "ITEM_INVALIDO" }
> {
  return prisma.$transaction(async (tx) => {
    const item = await tx.catalogoItem.findFirst({
      where: {
        id: dados.catalogoItemId,
        ativo: true,
        categoria: "PRODUTO",
      },
      select: { id: true },
    });

    if (!item) {
      return { ok: false, motivo: "ITEM_INVALIDO" as const };
    }

    const producaoAnterior = await tx.producaoRodada.findUnique({
      where: {
        empresaId_rodadaId_catalogoItemId: {
          empresaId: dados.empresaId,
          rodadaId: dados.rodadaId,
          catalogoItemId: dados.catalogoItemId,
        },
      },
      select: { quantidade: true },
    });

    const jaProduzido = producaoAnterior?.quantidade ?? 0;
    const totalApos = jaProduzido + dados.quantidade;

    const producaoTotal = await tx.producaoRodada.aggregate({
      where: { empresaId: dados.empresaId, rodadaId: dados.rodadaId },
      _sum: { quantidade: true },
    });
    const usadoAntes = producaoTotal._sum.quantidade ?? 0;

    if (usadoAntes + dados.quantidade > dados.capacidadeTotal) {
      return { ok: false, motivo: "LIMITE_EXCEDIDO" as const };
    }

    await tx.producaoRodada.upsert({
      where: {
        empresaId_rodadaId_catalogoItemId: {
          empresaId: dados.empresaId,
          rodadaId: dados.rodadaId,
          catalogoItemId: dados.catalogoItemId,
        },
      },
      update: {
        quantidade: totalApos,
        capacidadeAplicada: dados.capacidadeTotal,
      },
      create: {
        empresaId: dados.empresaId,
        rodadaId: dados.rodadaId,
        catalogoItemId: dados.catalogoItemId,
        quantidade: dados.quantidade,
        capacidadeAplicada: dados.capacidadeTotal,
        criadoPorUserId: dados.userId,
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
        valorTotal: 0,
      },
      select: estoqueSelect,
    });

    return {
      ok: true as const,
      quantidade: dados.quantidade,
      capacidadeUsada: usadoAntes + dados.quantidade,
      estoque,
    };
  });
}
