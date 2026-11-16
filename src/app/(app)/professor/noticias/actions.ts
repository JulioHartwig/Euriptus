"use server";

import { revalidatePath } from "next/cache";

import { noticiaSchema } from "@/lib/validations/professor";
import { requireUser } from "@/server/auth/session";
import { alternarNoticia, NoticiaError, removerNoticia, salvarNoticia } from "@/server/services/noticia-service";

export type AdminActionState =
  | { status: "idle" }
  | { status: "success"; message: string; submittedAt: number }
  | { status: "error"; message: string; submittedAt: number };

async function ensureTeacher() {
  const user = await requireUser();
  if (user.role !== "TEACHER") return { ok: false as const, erro: "Acesso restrito ao professor." };
  return { ok: true as const };
}

function reval() {
  revalidatePath("/professor/noticias");
  revalidatePath("/painel");
  revalidatePath("/professor");
}

export async function salvarNoticiaAction(_p: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const ctx = await ensureTeacher();
  if (!ctx.ok) return { status: "error", message: ctx.erro, submittedAt: Date.now() };
  const parsed = noticiaSchema.safeParse({
    id: formData.get("id") || undefined,
    titulo: formData.get("titulo"),
    corpo: formData.get("corpo"),
    tipo: formData.get("tipo"),
    ativa: formData.get("ativa") ?? "off",
  });
  if (!parsed.success) return { status: "error", message: "Revise os campos da notícia.", submittedAt: Date.now() };
  try {
    await salvarNoticia(parsed.data);
    reval();
    return { status: "success", message: parsed.data.id ? "Notícia atualizada." : "Notícia criada.", submittedAt: Date.now() };
  } catch (e) {
    if (e instanceof NoticiaError) return { status: "error", message: e.message, submittedAt: Date.now() };
    throw e;
  }
}

export async function removerNoticiaAction(formData: FormData): Promise<AdminActionState> {
  const ctx = await ensureTeacher();
  if (!ctx.ok) return { status: "error", message: ctx.erro, submittedAt: Date.now() };
  const id = String(formData.get("id") ?? "");
  try {
    await removerNoticia(id);
    reval();
    return { status: "success", message: "Notícia removida.", submittedAt: Date.now() };
  } catch (e) {
    if (e instanceof NoticiaError) return { status: "error", message: e.message, submittedAt: Date.now() };
    throw e;
  }
}

export async function alternarNoticiaAction(formData: FormData): Promise<AdminActionState> {
  const ctx = await ensureTeacher();
  if (!ctx.ok) return { status: "error", message: ctx.erro, submittedAt: Date.now() };
  const id = String(formData.get("id") ?? "");
  const ativa = String(formData.get("ativa")) === "true";
  try {
    await alternarNoticia(id, ativa);
    reval();
    return { status: "success", message: ativa ? "Notícia ativada." : "Notícia desativada.", submittedAt: Date.now() };
  } catch (e) {
    if (e instanceof NoticiaError) return { status: "error", message: e.message, submittedAt: Date.now() };
    throw e;
  }
}
