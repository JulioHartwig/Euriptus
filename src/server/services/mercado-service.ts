import type { EmpresaTipo } from "@prisma/client";

import { formatCurrency } from "@/lib/utils";
import { totalCompra } from "@/lib/mercado";
import {
  comprarItemComDebito,
  findCatalogoItemAtivo,
  findSaldoEmpresa,
  listCatalogoParaEmpresa,
  listEstoqueDaEmpresa,
  somarEstoque,
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
    rodadaId,
  });

  if (!resultado) {
    throw new MercadoError(
      "O saldo mudou durante a operação. Recarregue a página e tente novamente.",
    );
  }

  return { item, quantidade, valorTotal, saldo: resultado.saldo };
}
