import { hash } from "bcryptjs";
import type { Role } from "@prisma/client";
import { createUsuario, deleteUsuario, findUsuario, listUsuarios, updateUsuario } from "@/server/repositories/usuario-repository";

export class UsuarioError extends Error { constructor(m:string){super(m);this.name="UsuarioError";} }
export const getUsuarios = () => listUsuarios();

export async function salvarUsuario(d: { id?: string; nome: string; email: string; role: Role; empresaId: string | null; senha?: string }) {
  const email = d.email.trim().toLowerCase();
  const nome = d.nome.trim();
  const empresaId = d.role === "TEACHER" ? null : d.empresaId;
  if (d.role === "STUDENT" && !empresaId) throw new UsuarioError("Estudantes devem estar vinculados a uma empresa.");

  if (d.id) {
    const existente = await findUsuario(d.id);
    if (!existente) throw new UsuarioError("Usuário não encontrado.");
    const data: { nome: string; email: string; role: Role; empresaId: string | null; passwordHash?: string } = { nome, email, role: d.role, empresaId };
    if (d.senha && d.senha.trim()) data.passwordHash = await hash(d.senha, 12);
    return updateUsuario(d.id, data);
  }

  if (!d.senha || d.senha.trim().length < 6) throw new UsuarioError("Informe uma senha com pelo menos 6 caracteres.");
  const passwordHash = await hash(d.senha, 12);
  return createUsuario({ nome, email, passwordHash, role: d.role, empresaId });
}

export async function removerUsuario(id: string) {
  if (!(await findUsuario(id))) throw new UsuarioError("Usuário não encontrado.");
  await deleteUsuario(id);
}
