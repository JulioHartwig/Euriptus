"use server";

import { revalidatePath } from "next/cache";

import type { RodadaActionState } from "@/lib/rodada";
import { requireUser } from "@/server/auth/session";
import { abrirRodada, fecharEProcessarRodada, RodadaError } from "@/server/services/rodada-service";

async function requireProfessor() {
  const user = await requireUser();
  if (user.role !== "TEACHER") {
    return { ok: false as const, erro: "Apenas professores podem gerenciar rodadas." };
  }
  return { ok: true as const, user };
}

function revalidar() {
  revalidatePath("/professor/rodadas");
  revalidatePath("/professor");
  revalidatePath("/painel");
  revalidatePath("/financeiro");
  revalidatePath("/banco");
  revalidatePath("/mercado");
  revalidatePath("/negociacoes");
  revalidatePath("/estoque");
  revalidatePath("/historico");
  revalidatePath("/alertas");
}

export async function abrirRodadaAction(): Promise<RodadaActionState> {
  const ctx = await requireProfessor();
  if (!ctx.ok) return { status: "error", message: ctx.erro, submittedAt: Date.now() };
  try {
    const r = await abrirRodada(ctx.user.id);
    revalidar();
    return { status: "success", message: `Rodada ${r.numero} aberta.`, submittedAt: Date.now() };
  } catch (e) {
    if (e instanceof RodadaError) return { status: "error", message: e.message, submittedAt: Date.now() };
    throw e;
  }
}

export async function fecharRodadaAction(): Promise<RodadaActionState> {
  const ctx = await requireProfessor();
  if (!ctx.ok) return { status: "error", message: ctx.erro, submittedAt: Date.now() };
  try {
    const r = await fecharEProcessarRodada(ctx.user.id);
    revalidar();
    return {
      status: "success",
      message: `Rodada ${r.numero} fechada e processada (custos fixos, salários, impostos e quitações aplicadas quando aplicável).`,
      submittedAt: Date.now(),
    };
  } catch (e) {
    if (e instanceof RodadaError) return { status: "error", message: e.message, submittedAt: Date.now() };
    throw e;
  }
}
