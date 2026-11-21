import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export function listEmpresasDestino(excluirEmpresaId: string) {
  return prisma.empresa.findMany({
    where: { id: { not: excluirEmpresaId } },
    select: { id: true, nome: true, tipo: true },
    orderBy: { nome: "asc" },
  });
}

export function listEstoqueDisponivel(empresaId: string) {
  return prisma.estoqueItem.findMany({
    where: { empresaId, quantidade: { gt: 0 } },
    select: {
      catalogoItemId: true,
      quantidade: true,
      valorTotal: true,
      catalogoItem: { select: { id: true, nome: true, unidade: true } },
    },
    orderBy: { catalogoItem: { nome: "asc" } },
  });
}

const propostaSelect = {
  id: true,
  empresaOrigemId: true,
  empresaDestinoId: true,
  quantidade: true,
  valorTotal: true,
  mensagem: true,
  status: true,
  criadoEm: true,
  respondidoEm: true,
  empresaOrigem: { select: { id: true, nome: true, tipo: true } },
  empresaDestino: { select: { id: true, nome: true, tipo: true } },
  catalogoItem: { select: { id: true, nome: true, unidade: true } },
  criadoPor: { select: { nome: true } },
  respondidoPor: { select: { nome: true } },
} satisfies Prisma.PropostaSelect;

export type PropostaDetalhada = Prisma.PropostaGetPayload<{ select: typeof propostaSelect }>;

export function listPropostasDaEmpresa(empresaId: string) {
  return prisma.proposta.findMany({
    where: { OR: [{ empresaOrigemId: empresaId }, { empresaDestinoId: empresaId }] },
    select: propostaSelect,
    orderBy: { criadoEm: "desc" },
  });
}

export function findPropostaPendente(id: string) {
  return prisma.proposta.findFirst({
    where: { id, status: "PENDENTE" },
    select: {
      id: true,
      empresaOrigemId: true,
      empresaDestinoId: true,
      catalogoItemId: true,
      quantidade: true,
      valorTotal: true,
      catalogoItem: { select: { nome: true, unidade: true } },
    },
  });
}

export function criarProposta(data: {
  empresaOrigemId: string;
  empresaDestinoId: string;
  catalogoItemId: string;
  quantidade: number;
  valorTotal: number;
  mensagem: string | null;
  criadoPorUserId: string;
}) {
  return prisma.proposta.create({ data, select: { id: true } });
}

export function atualizarStatusProposta(dados: {
  id: string;
  status: "RECUSADA" | "CANCELADA";
  respondidoPorUserId: string;
}) {
  return prisma.proposta.updateMany({
    where: { id: dados.id, status: "PENDENTE" },
    data: {
      status: dados.status,
      respondidoPorUserId: dados.respondidoPorUserId,
      respondidoEm: new Date(),
    },
  });
}

/** Aceite atômico: verifica saldo/estoque, transfere valores e itens, registra transações. */
export function aceitarProposta(dados: {
  propostaId: string;
  respondidoPorUserId: string;
  empresaOrigemId: string;
  empresaDestinoId: string;
  catalogoItemId: string;
  quantidade: number;
  valorTotal: number;
  nomeItem: string;
  rodadaId?: string | null;
}) {
  return prisma.$transaction(async (tx) => {
    // trava proposta
    const p = await tx.proposta.updateMany({
      where: { id: dados.propostaId, status: "PENDENTE" },
      data: {
        status: "ACEITA",
        respondidoPorUserId: dados.respondidoPorUserId,
        respondidoEm: new Date(),
      },
    });
    if (p.count === 0) return { ok: false as const, motivo: "NAO_PENDENTE" };

    // estoque do vendedor, com valor contábil proporcional transferido
    const estoqueOrigem = await tx.estoqueItem.findFirst({
      where: {
        empresaId: dados.empresaOrigemId,
        catalogoItemId: dados.catalogoItemId,
        quantidade: { gte: dados.quantidade },
      },
      select: { id: true, quantidade: true, valorTotal: true },
    });
    if (!estoqueOrigem) throw new Error("ESTOQUE_INSUFICIENTE");

    const valorUnitario =
      estoqueOrigem.quantidade > 0
        ? Number(estoqueOrigem.valorTotal) / estoqueOrigem.quantidade
        : 0;
    const valorTransferido = Math.round(valorUnitario * dados.quantidade * 100) / 100;

    await tx.estoqueItem.update({
      where: { id: estoqueOrigem.id },
      data: {
        quantidade: { decrement: dados.quantidade },
        valorTotal: { decrement: valorTransferido },
      },
    });

    // saldo do comprador
    const deb = await tx.empresa.updateMany({
      where: { id: dados.empresaDestinoId, saldo: { gte: dados.valorTotal } },
      data: { saldo: { decrement: dados.valorTotal } },
    });
    if (deb.count === 0) throw new Error("SALDO_INSUFICIENTE");

    // marketing da empresa vendedora aumenta a receita da venda
    const origem = await tx.empresa.findUniqueOrThrow({
      where: { id: dados.empresaOrigemId },
      select: { multiplicadorMarketing: true },
    });
    const receita =
      Math.round(dados.valorTotal * Number(origem.multiplicadorMarketing) * 100) / 100;

    await tx.empresa.update({
      where: { id: dados.empresaOrigemId },
      data: { saldo: { increment: receita } },
    });

    await tx.estoqueItem.upsert({
      where: {
        empresaId_catalogoItemId: {
          empresaId: dados.empresaDestinoId,
          catalogoItemId: dados.catalogoItemId,
        },
      },
      update: {
        quantidade: { increment: dados.quantidade },
        valorTotal: { increment: valorTransferido },
      },
      create: {
        empresaId: dados.empresaDestinoId,
        catalogoItemId: dados.catalogoItemId,
        quantidade: dados.quantidade,
        valorTotal: valorTransferido,
      },
    });

    await tx.transacao.createMany({
      data: [
        {
          empresaId: dados.empresaDestinoId,
          tipo: "DESPESA",
          descricao: `Compra por negociação: ${dados.nomeItem} (${dados.quantidade})`,
          valor: dados.valorTotal,
          quantidade: dados.quantidade,
          criadoPorUserId: dados.respondidoPorUserId,
          rodadaId: dados.rodadaId ?? null,
        },
        {
          empresaId: dados.empresaOrigemId,
          tipo: "RECEITA",
          descricao: `Venda por negociação: ${dados.nomeItem} (${dados.quantidade})`,
          valor: receita,
          quantidade: dados.quantidade,
          criadoPorUserId: dados.respondidoPorUserId,
          rodadaId: dados.rodadaId ?? null,
        },
      ],
    });

    return { ok: true as const };
  });
}
