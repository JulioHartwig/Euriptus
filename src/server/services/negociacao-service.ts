import { formatCurrency } from "@/lib/utils";
import {
  aceitarProposta,
  atualizarStatusProposta,
  criarProposta,
  findPropostaPendente,
  listEmpresasDestino,
  listEstoqueDisponivel,
  listPropostasDaEmpresa,
} from "@/server/repositories/negociacao-repository";
import { getRodadaAbertaId } from "@/server/services/rodada-service";

export class NegociacaoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NegociacaoError";
  }
}

export function getEmpresasDestino(empresaId: string) {
  return listEmpresasDestino(empresaId);
}

export function getEstoqueDisponivel(empresaId: string) {
  return listEstoqueDisponivel(empresaId);
}

export function getPropostas(empresaId: string) {
  return listPropostasDaEmpresa(empresaId);
}

export async function enviarProposta(dados: {
  empresaOrigemId: string;
  userId: string;
  empresaDestinoId: string;
  catalogoItemId: string;
  quantidade: number;
  valorTotal: number;
  mensagem?: string;
}) {
  if (dados.empresaOrigemId === dados.empresaDestinoId) {
    throw new NegociacaoError("Selecione uma empresa destinatária diferente da sua.");
  }

  const estoque = await listEstoqueDisponivel(dados.empresaOrigemId);
  const item = estoque.find((e) => e.catalogoItemId === dados.catalogoItemId);
  if (!item) {
    throw new NegociacaoError("Você não possui este item em estoque para oferecer.");
  }
  if (dados.quantidade > item.quantidade) {
    throw new NegociacaoError(
      `Quantidade indisponível. Você tem ${item.quantidade} em estoque.`,
    );
  }

  await criarProposta({
    empresaOrigemId: dados.empresaOrigemId,
    empresaDestinoId: dados.empresaDestinoId,
    catalogoItemId: dados.catalogoItemId,
    quantidade: dados.quantidade,
    valorTotal: Math.round(dados.valorTotal * 100) / 100,
    mensagem: dados.mensagem?.trim() ? dados.mensagem.trim() : null,
    criadoPorUserId: dados.userId,
  });
}

export async function responderProposta(dados: {
  propostaId: string;
  empresaId: string;
  userId: string;
  acao: "ACEITAR" | "RECUSAR" | "CANCELAR";
}) {
  const proposta = await findPropostaPendente(dados.propostaId);
  if (!proposta) throw new NegociacaoError("Proposta não encontrada ou já respondida.");

  if (dados.acao === "CANCELAR") {
    if (proposta.empresaOrigemId !== dados.empresaId) {
      throw new NegociacaoError("Apenas a empresa que enviou pode cancelar esta proposta.");
    }
    const r = await atualizarStatusProposta({
      id: proposta.id,
      status: "CANCELADA",
      respondidoPorUserId: dados.userId,
    });
    if (r.count === 0) throw new NegociacaoError("Proposta já respondida.");
    return;
  }

  if (proposta.empresaDestinoId !== dados.empresaId) {
    throw new NegociacaoError("Apenas a empresa destinatária pode aceitar ou recusar.");
  }

  if (dados.acao === "RECUSAR") {
    const r = await atualizarStatusProposta({
      id: proposta.id,
      status: "RECUSADA",
      respondidoPorUserId: dados.userId,
    });
    if (r.count === 0) throw new NegociacaoError("Proposta já respondida.");
    return;
  }

  // ACEITAR
  try {
    const rodadaId = await getRodadaAbertaId();
    const res = await aceitarProposta({
      propostaId: proposta.id,
      respondidoPorUserId: dados.userId,
      empresaOrigemId: proposta.empresaOrigemId,
      empresaDestinoId: proposta.empresaDestinoId,
      catalogoItemId: proposta.catalogoItemId,
      quantidade: proposta.quantidade,
      valorTotal: Number(proposta.valorTotal),
      nomeItem: proposta.catalogoItem.nome,
      rodadaId,
    });
    if (!res.ok) throw new NegociacaoError("Proposta já respondida.");
  } catch (e) {
    if (e instanceof NegociacaoError) throw e;
    const msg = e instanceof Error ? e.message : "";
    if (msg === "ESTOQUE_INSUFICIENTE") {
      throw new NegociacaoError("O vendedor não possui estoque suficiente para esta proposta.");
    }
    if (msg === "SALDO_INSUFICIENTE") {
      throw new NegociacaoError(
        `Saldo insuficiente para aceitar. Valor: ${formatCurrency(Number(proposta.valorTotal))}.`,
      );
    }
    throw e;
  }
}
