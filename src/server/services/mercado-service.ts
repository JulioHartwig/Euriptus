import type { EmpresaTipo } from "@prisma/client";

import { CAPACIDADE_BASE_POR_TIPO } from "@/lib/empresa";
import { totalCompra } from "@/lib/mercado";
import { formatCurrency } from "@/lib/utils";
import {
  comprarItemComDebito,
  findCatalogoItemAtivo,
  findSaldoEmpresa,
  listCatalogoParaEmpresa,
  listEstoqueDaEmpresa,
  listProdutosParaEmpresa,
  registrarProducao,
  somarEstoque,
  somarProducaoDaRodada,
} from "@/server/repositories/mercado-repository";
import { getRodadaAbertaId } from "@/server/services/rodada-service";

export class MercadoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MercadoError";
  }
}

export function getCatalogo(empresaTipo: EmpresaTipo) {
  return listCatalogoParaEmpresa(empresaTipo);
}

export function getEstoque(empresaId: string) {
  return listEstoqueDaEmpresa(empresaId);
}

export function getEstoqueTotal(empresaId: string) {
  return somarEstoque(empresaId);
}

/** Capacidade de produção da empresa no mês corrente. */
export async function getCapacidade(empresaId: string, empresaTipo: EmpresaTipo) {
  const empresa = await findSaldoEmpresa(empresaId);

  if (!empresa) {
    throw new MercadoError("Empresa não encontrada.");
  }

  const rodadaId = await getRodadaAbertaId();
  const usado = rodadaId ? await somarProducaoDaRodada(empresaId, rodadaId) : 0;
  const base = CAPACIDADE_BASE_POR_TIPO[empresaTipo];
  const melhorias = empresa.capacidadeProducao;
  const total = base + melhorias;

  return {
    base,
    melhorias,
    total,
    usado,
    disponivel: Math.max(total - usado, 0),
    rodadaId,
    multiplicadorMarketing: Number(empresa.multiplicadorMarketing),
  };
}

export function getProdutos(empresaTipo: EmpresaTipo) {
  return listProdutosParaEmpresa(empresaTipo);
}

export async function comprarItem({
  empresaId,
  empresaTipo,
  userId,
  catalogoItemId,
  quantidade,
}: {
  empresaId: string;
  empresaTipo: EmpresaTipo;
  userId: string;
  catalogoItemId: string;
  quantidade: number;
}) {
  if (!Number.isInteger(quantidade) || quantidade < 1) {
    throw new MercadoError("A quantidade deve ser um número inteiro maior que zero.");
  }

  const item = await findCatalogoItemAtivo(catalogoItemId, empresaTipo);

  if (!item) {
    throw new MercadoError("Item do catálogo não encontrado ou indisponível.");
  }

  const valorTotal = totalCompra(Number(item.preco), quantidade);
  const empresa = await findSaldoEmpresa(empresaId);

  if (!empresa) {
    throw new MercadoError("Empresa não encontrada.");
  }

  const saldo = Number(empresa.saldo);

  if (valorTotal > saldo) {
    throw new MercadoError(
      `Saldo insuficiente. Total da compra: ${formatCurrency(valorTotal)}; saldo disponível: ${formatCurrency(saldo)}.`,
    );
  }

  const rodadaId = await getRodadaAbertaId();

  const resultado = await comprarItemComDebito({
    empresaId,
    userId,
    catalogoItemId: item.id,
    nomeItem: item.nome,
    quantidade,
    valorTotal,
    categoria: item.categoria,
    aumentoCapacidade: item.aumentoCapacidade,
    aumentoMarketing: Number(item.aumentoMarketing),
    rodadaId,
  });

  if (!resultado) {
    throw new MercadoError(
      "O saldo mudou durante a operação. Recarregue a página e tente novamente.",
    );
  }

  return {
    item,
    quantidade,
    valorTotal,
    saldo: resultado.saldo,
    estoqueQuantidade: resultado.estoque.quantidade,
    estoqueValorTotal: Number(resultado.estoque.valorTotal),
    capacidadeProducao: resultado.capacidadeProducao,
    multiplicadorMarketing: resultado.multiplicadorMarketing,
  };
}

/** Registra produção/prestação de serviço dentro da capacidade do mês. */
export async function registrarProducaoItem({
  empresaId,
  empresaTipo,
  userId,
  catalogoItemId,
  quantidade,
}: {
  empresaId: string;
  empresaTipo: EmpresaTipo;
  userId: string;
  catalogoItemId: string;
  quantidade: number;
}) {
  if (!Number.isInteger(quantidade) || quantidade < 1) {
    throw new MercadoError("Informe uma quantidade inteira maior que zero.");
  }

  const rodadaId = await getRodadaAbertaId();

  if (!rodadaId) {
    throw new MercadoError(
      "Não há rodada aberta. Peça ao professor para abrir uma rodada antes de produzir.",
    );
  }

  const produtos = await listProdutosParaEmpresa(empresaTipo);

  if (!produtos.some((produto) => produto.id === catalogoItemId)) {
    throw new MercadoError("Produto indisponível para a sua empresa.");
  }

  const capacidade = await getCapacidade(empresaId, empresaTipo);

  if (quantidade > capacidade.disponivel) {
    throw new MercadoError(
      `Limite de produção excedido. Você pode produzir até ${capacidade.disponivel} unidades nesta rodada. Compre melhorias no mercado para ampliar a capacidade.`,
    );
  }

  const resultado = await registrarProducao({
    empresaId,
    userId,
    rodadaId,
    catalogoItemId,
    quantidade,
    capacidadeTotal: capacidade.total,
  });

  if (!resultado.ok) {
    throw new MercadoError(
      resultado.motivo === "LIMITE_EXCEDIDO"
        ? "Limite de produção excedido. Tente novamente com uma quantidade menor."
        : "Produto inválido.",
    );
  }

  return {
    quantidade: resultado.quantidade,
    capacidadeUsada: resultado.capacidadeUsada,
    capacidadeTotal: capacidade.total,
    estoqueQuantidade: resultado.estoque.quantidade,
  };
}
