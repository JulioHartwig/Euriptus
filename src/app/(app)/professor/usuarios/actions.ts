"use server";
import { revalidatePath } from "next/cache";
import { usuarioSchema } from "@/lib/validations/professor";
import { requireUser } from "@/server/auth/session";
import { UsuarioError, removerUsuario, salvarUsuario } from "@/server/services/usuario-service";

type S = { status: "idle" } | { status: "success"; message: string; submittedAt: number } | { status: "error"; message: string; submittedAt: number };
function reval(){ revalidatePath("/professor/usuarios"); revalidatePath("/professor"); revalidatePath("/professor/empresas"); }

export async function salvarUsuarioAction(_p:S, formData:FormData):Promise<S>{
  const user=await requireUser(); if(user.role!=="TEACHER") return {status:"error",message:"Acesso restrito.",submittedAt:Date.now()};
  const parsed=usuarioSchema.safeParse({id:formData.get("id")||undefined,nome:formData.get("nome"),email:formData.get("email"),role:formData.get("role"),empresaId:formData.get("empresaId")||"",senha:formData.get("senha")||""});
  if(!parsed.success) return {status:"error",message:"Revise os campos do usuário.",submittedAt:Date.now()};
  try{ await salvarUsuario({ ...parsed.data, senha: parsed.data.senha || undefined }); reval(); return {status:"success",message:parsed.data.id?"Usuário atualizado.":"Usuário criado.",submittedAt:Date.now()}; }
  catch(e: unknown){ if(e instanceof UsuarioError) return {status:"error",message:e.message,submittedAt:Date.now()}; const code = typeof e === "object" && e && "code" in e ? (e as { code?: string }).code : undefined; if(code==="P2002") return {status:"error",message:"E-mail já cadastrado.",submittedAt:Date.now()}; throw e; }
}
export async function removerUsuarioAction(formData:FormData):Promise<S>{
  const user=await requireUser(); if(user.role!=="TEACHER") return {status:"error",message:"Acesso restrito.",submittedAt:Date.now()};
  try{ await removerUsuario(String(formData.get("id")??"")); reval(); return {status:"success",message:"Usuário removido.",submittedAt:Date.now()}; }
  catch(e){ if(e instanceof UsuarioError) return {status:"error",message:e.message,submittedAt:Date.now()}; throw e; }
}
