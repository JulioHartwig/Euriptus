"use server";
import { revalidatePath } from "next/cache";
import { catalogoSchema } from "@/lib/validations/professor";
import { requireUser } from "@/server/auth/session";
import { CatalogoAdminError, removerCatalogo, salvarCatalogo } from "@/server/services/catalogo-admin-service";

export type AdminActionState = { status: "idle" } | { status: "success"; message: string; submittedAt: number } | { status: "error"; message: string; submittedAt: number };

export async function salvarCatalogoAction(_p: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const user = await requireUser();
  if (user.role !== "TEACHER") return { status: "error", message: "Acesso restrito.", submittedAt: Date.now() };
  const parsed = catalogoSchema.safeParse({
    id: formData.get("id") || undefined,
    nome: formData.get("nome"), descricao: formData.get("descricao"), unidade: formData.get("unidade"),
    preco: formData.get("preco"), empresaTipo: formData.get("empresaTipo") || "", ativo: formData.get("ativo") ?? "off",
  });
  if (!parsed.success) return { status: "error", message: "Revise os campos do item.", submittedAt: Date.now() };
  try {
    await salvarCatalogo(parsed.data);
    revalidatePath("/professor/catalogo"); revalidatePath("/mercado");
    return { status: "success", message: parsed.data.id ? "Item atualizado." : "Item criado.", submittedAt: Date.now() };
  } catch (e) { if (e instanceof CatalogoAdminError) return { status: "error", message: e.message, submittedAt: Date.now() }; throw e; }
}
export async function removerCatalogoAction(formData: FormData): Promise<AdminActionState> {
  const user = await requireUser();
  if (user.role !== "TEACHER") return { status: "error", message: "Acesso restrito.", submittedAt: Date.now() };
  try { await removerCatalogo(String(formData.get("id") ?? "")); revalidatePath("/professor/catalogo"); revalidatePath("/mercado"); return { status: "success", message: "Item removido.", submittedAt: Date.now() }; }
  catch (e) { if (e instanceof CatalogoAdminError) return { status: "error", message: e.message, submittedAt: Date.now() }; throw e; }
}
