"use server";
import { revalidatePath } from "next/cache";
import { empresaSchema } from "@/lib/validations/professor";
import { requireUser } from "@/server/auth/session";
import { EmpresaAdminError, removerEmpresa, salvarEmpresa } from "@/server/services/empresa-admin-service";

type S = { status: "idle" } | { status: "success"; message: string; submittedAt: number } | { status: "error"; message: string; submittedAt: number };
function reval(){ revalidatePath("/professor/empresas"); revalidatePath("/professor"); }

export async function salvarEmpresaAction(_p:S, formData:FormData):Promise<S>{
  const user=await requireUser(); if(user.role!=="TEACHER") return {status:"error",message:"Acesso restrito.",submittedAt:Date.now()};
  const parsed=empresaSchema.safeParse({id:formData.get("id")||undefined,nome:formData.get("nome"),tipo:formData.get("tipo"),saldo:formData.get("saldo")});
  if(!parsed.success) return {status:"error",message:"Revise os campos da empresa.",submittedAt:Date.now()};
  try{ await salvarEmpresa(parsed.data); reval(); return {status:"success",message:parsed.data.id?"Empresa atualizada.":"Empresa criada.",submittedAt:Date.now()}; }
  catch(e){ if(e instanceof EmpresaAdminError) return {status:"error",message:e.message,submittedAt:Date.now()}; throw e; }
}
export async function removerEmpresaAction(formData:FormData):Promise<S>{
  const user=await requireUser(); if(user.role!=="TEACHER") return {status:"error",message:"Acesso restrito.",submittedAt:Date.now()};
  try{ await removerEmpresa(String(formData.get("id")??"")); reval(); return {status:"success",message:"Empresa removida.",submittedAt:Date.now()}; }
  catch(e){ if(e instanceof EmpresaAdminError) return {status:"error",message:e.message,submittedAt:Date.now()}; throw e; }
}
