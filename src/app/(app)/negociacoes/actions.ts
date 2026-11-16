"use server";

import { revalidatePath } from "next/cache";

import type { NegociacaoActionState } from "@/lib/negociacao";
import { formatCurrency } from "@/lib/utils";
import {
  criarPropostaSchema,
  responderPropostaSchema,
} from "@/lib/validations/negociacao";
import { requireUser } from "@/server/auth/session";
import { getEmpresaDoUsuario } from "@/server/services/empresa-service";
import {
  enviarProposta,
  NegociacaoError,
  responderProposta,
} from "@/server/services/negociacao-service";

function revalidar() {
  revalidatePath("/negociacoes");
  revalidatePath("/painel");
  revalidatePath("/financeiro");
  revalidatePath("/mercado");
}

async function contexto() {
  const user = await requireUser();
  if (user.role !== "STUDENT") {
    return { ok: false as const, erro: "Apenas estudantes podem negociar." };
  }
  const empresa = await getEmpresaDoUsuario(user.id);
  if (!empresa) {
    return { ok: false as const, erro: "Sua conta não está vinculada a uma empresa." };
  }
  return { ok: true as const, user, empresa };
}

export async function criarPropostaAction(
  _prev: NegociacaoActionState,
  formData: FormData,
): Promise<NegociacaoActionState> {
  const ctx = await contexto();
  if (!ctx.ok) return { status: "error", message: ctx.erro, submittedAt: Date.now() };

  const parsed = criarPropostaSchema.safeParse({
    empresaDestinoId: formData.get("empresaDestinoId"),
    catalogoItemId: formData.get("catalogoItemId"),
    quantidade: formData.get("quantidade"),
    valorTotal: formData.get("valorTotal"),
    mensagem: formData.get("mensagem") ?? "",
  });
  if (!parsed.success) {
    const fields = parsed.error.flatten().fieldErrors;
    return {
      status: "error",
      message: "Revise os dados da proposta.",
      fieldErrors: fields,
      submittedAt: Date.now(),
    };
  }

  try {
    await enviarProposta({
      empresaOrigemId: ctx.empresa.id,
      userId: ctx.user.id,
      ...parsed.data,
      mensagem: parsed.data.mensagem || undefined,
    });
    revalidar();
    return {
      status: "success",
      message: `Proposta enviada por ${formatCurrency(parsed.data.valorTotal)}.`,
      submittedAt: Date.now(),
    };
  } catch (e) {
    if (e instanceof NegociacaoError) {
      return { status: "error", message: e.message, submittedAt: Date.now() };
    }
    throw e;
  }
}

async function responder(acao: "ACEITAR" | "RECUSAR" | "CANCELAR", propostaId: unknown): Promise<NegociacaoActionState> {
  const ctx = await contexto();
  if (!ctx.ok) return { status: "error", message: ctx.erro, submittedAt: Date.now() };
  const parsed = responderPropostaSchema.safeParse({ propostaId });
  if (!parsed.success) return { status: "error", message: "Proposta inválida.", submittedAt: Date.now() };
  try {
    await responderProposta({
      propostaId: parsed.data.propostaId,
      empresaId: ctx.empresa.id,
      userId: ctx.user.id,
      acao,
    });
    revalidar();
    const msg = acao === "ACEITAR" ? "Proposta aceita. Valores e itens transferidos." : acao === "RECUSAR" ? "Proposta recusada." : "Proposta cancelada.";
    return { status: "success", message: msg, submittedAt: Date.now() };
  } catch (e) {
    if (e instanceof NegociacaoError) return { status: "error", message: e.message, submittedAt: Date.now() };
    throw e;
  }
}

export async function aceitarPropostaAction(_prev: NegociacaoActionState, formData: FormData) {
  return responder("ACEITAR", formData.get("propostaId"));
}
export async function recusarPropostaAction(_prev: NegociacaoActionState, formData: FormData) {
  return responder("RECUSAR", formData.get("propostaId"));
}
export async function cancelarPropostaAction(_prev: NegociacaoActionState, formData: FormData) {
  return responder("CANCELAR", formData.get("propostaId"));
}
