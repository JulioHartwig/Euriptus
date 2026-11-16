import type { EmpresaTipo } from "@prisma/client";
import {
  createEmpresa,
  deleteEmpresa,
  findEmpresaAdmin,
  findEmpresaConsolidada,
  listEmpresasAdmin,
  listEmpresasBancoConsolidado,
  updateEmpresa,
} from "@/server/repositories/empresa-admin-repository";

export class EmpresaAdminError extends Error { constructor(m:string){super(m);this.name="EmpresaAdminError";} }
export const getEmpresasAdmin = () => listEmpresasAdmin();
export const getEmpresaDetalhe = (id: string) => findEmpresaAdmin(id);
export const getEmpresaConsolidada = (id: string) => findEmpresaConsolidada(id);
export const getBancoConsolidado = () => listEmpresasBancoConsolidado();

export async function salvarEmpresa(d: { id?: string; nome: string; tipo: EmpresaTipo; saldo: number }) {
  const payload = { nome: d.nome.trim(), tipo: d.tipo, saldo: d.saldo };
  if (d.id) { if (!(await findEmpresaAdmin(d.id))) throw new EmpresaAdminError("Empresa não encontrada."); return updateEmpresa(d.id, payload); }
  return createEmpresa(payload);
}
export async function removerEmpresa(id: string) {
  if (!(await findEmpresaAdmin(id))) throw new EmpresaAdminError("Empresa não encontrada.");
  await deleteEmpresa(id);
}
