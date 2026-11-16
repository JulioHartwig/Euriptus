import { findEmpresaDoUsuario } from "@/server/repositories/empresa-repository";

/**
 * Dados da empresa exibidos no painel do aluno.
 *
 * Retorna `null` quando o usuário ainda não foi vinculado a uma empresa
 * (a página mostra um aviso amigável nesse caso).
 */
export function getEmpresaDoUsuario(userId: string) {
  return findEmpresaDoUsuario(userId);
}
