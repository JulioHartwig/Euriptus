import type { CatalogoItemCategoria, EmpresaTipo } from "@prisma/client";
import {
  createCatalogo,
  deleteCatalogo,
  findCatalogo,
  listCatalogoAdmin,
  updateCatalogo,
} from "@/server/repositories/catalogo-repository";

export class CatalogoAdminError extends Error {
  constructor(m: string) {
    super(m);
    this.name = "CatalogoAdminError";
  }
}

export function getCatalogoAdmin() {
  return listCatalogoAdmin();
}

export async function salvarCatalogo(d: {
  id?: string;
  nome: string;
  descricao: string;
  unidade: string;
  preco: number;
  empresaTipo: EmpresaTipo | null;
  categoria: CatalogoItemCategoria;
  aumentoCapacidade: number;
  aumentoMarketing: number;
  ativo: boolean;
}) {
  const payload = {
    nome: d.nome.trim(),
    descricao: d.descricao.trim(),
    unidade: d.unidade.trim(),
    preco: d.preco,
    empresaTipo: d.empresaTipo,
    categoria: d.categoria,
    aumentoCapacidade: d.aumentoCapacidade,
    aumentoMarketing: d.aumentoMarketing,
    ativo: d.ativo,
  };
  if (d.id) {
    if (!(await findCatalogo(d.id))) throw new CatalogoAdminError("Item não encontrado.");
    return updateCatalogo(d.id, payload);
  }
  return createCatalogo(payload);
}

export async function removerCatalogo(id: string) {
  if (!(await findCatalogo(id))) throw new CatalogoAdminError("Item não encontrado.");
  await deleteCatalogo(id);
}
