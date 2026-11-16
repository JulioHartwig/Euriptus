"use server";

import { revalidatePath } from "next/cache";

import { eventoTemplateSchema } from "@/lib/validations/professor";
import { requireUser } from "@/server/auth/session";
import {
  dispararEvento,
  EventoError,
  removerEventoTemplate,
  salvarEventoTemplate,
} from "@/server/services/evento-service";

export type EventoActionState =
  | { status: "idle" }
  | { status: "success"; message: string; submittedAt: number }
  | { status: "error"; message: string; submittedAt: number };

async function ensureTeacher() {
  const user = await requireUser();
  if (user.role !== "TEACHER") return { ok: false as const, erro: "Acesso restrito ao professor." };
  return { ok: true as const, user };
}

function reval() {
  revalidatePath("/professor/eventos");
  revalidatePath("/painel");
  revalidatePath("/professor");
  revalidatePath("/professor/noticias");
}

export async function salvarTemplateAction(_p: EventoActionState, formData: FormData): Promise<EventoActionState> {
  const ctx = await ensureTeacher();
  if (!ctx.ok) return { status: "error", message: ctx.erro, submittedAt: Date.now() };
  const parsed = eventoTemplateSchema.safeParse({
    id: formData.get("id") || undefined,
    titulo: formData.get("titulo"),
    descricao: formData.get("descricao"),
    tipoNoticia: formData.get("tipoNoticia"),
    impactoTexto: formData.get("impactoTexto") ?? "",
    ativo: formData.get("ativo") ?? "off",
  });
  if (!parsed.success) return { status: "error", message: "Revise os campos do template.", submittedAt: Date.now() };
  try {
    await salvarEventoTemplate(parsed.data);
    reval();
    return { status: "success", message: parsed.data.id ? "Template atualizado." : "Template criado.", submittedAt: Date.now() };
  } catch (e) {
    if (e instanceof EventoError) return { status: "error", message: e.message, submittedAt: Date.now() };
    throw e;
  }
}

export async function removerTemplateAction(formData: FormData): Promise<EventoActionState> {
  const ctx = await ensureTeacher();
  if (!ctx.ok) return { status: "error", message: ctx.erro, submittedAt: Date.now() };
  try {
    await removerEventoTemplate(String(formData.get("id") ?? ""));
    reval();
    return { status: "success", message: "Template removido.", submittedAt: Date.now() };
  } catch (e) {
    if (e instanceof EventoError) return { status: "error", message: e.message, submittedAt: Date.now() };
    throw e;
  }
}

export async function dispararEventoAction(formData: FormData): Promise<EventoActionState> {
  const ctx = await ensureTeacher();
  if (!ctx.ok) return { status: "error", message: ctx.erro, submittedAt: Date.now() };
  try {
    await dispararEvento(String(formData.get("templateId") ?? ""), ctx.user.id);
    reval();
    return { status: "success", message: "Evento disparado e notícia publicada automaticamente.", submittedAt: Date.now() };
  } catch (e) {
    if (e instanceof EventoError) return { status: "error", message: e.message, submittedAt: Date.now() };
    throw e;
  }
}
