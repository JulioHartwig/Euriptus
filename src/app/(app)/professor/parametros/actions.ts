"use server";

import { revalidatePath } from "next/cache";

import { parametroSchema } from "@/lib/validations/professor";
import { requireUser } from "@/server/auth/session";
import { ParametroError, salvarParametro } from "@/server/services/parametro-service";

export type AdminActionState = { status: "idle" } | { status: "success"; message: string; submittedAt: number } | { status: "error"; message: string; submittedAt: number };

export async function salvarParametroAction(_p: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const user = await requireUser();
  if (user.role !== "TEACHER") return { status: "error", message: "Acesso restrito.", submittedAt: Date.now() };
  const parsed = parametroSchema.safeParse({
    nome: formData.get("nome"),
    valor: formData.get("valor"),
    descricao: formData.get("descricao"),
  });
  if (!parsed.success) return { status: "error", message: "Revise os campos.", submittedAt: Date.now() };
  try {
    await salvarParametro(parsed.data.nome, parsed.data.valor, parsed.data.descricao);
    revalidatePath("/professor/parametros");
    revalidatePath("/banco");
    revalidatePath("/financeiro");
    return { status: "success", message: "Parâmetro atualizado.", submittedAt: Date.now() };
  } catch (e) {
    if (e instanceof ParametroError) return { status: "error", message: e.message, submittedAt: Date.now() };
    throw e;
  }
}
