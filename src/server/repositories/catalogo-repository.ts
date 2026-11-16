import type { EmpresaTipo, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const select = { id: true, nome: true, descricao: true, unidade: true, preco: true, empresaTipo: true, ativo: true } satisfies Prisma.CatalogoItemSelect;

export function listCatalogoAdmin() {
  return prisma.catalogoItem.findMany({ select, orderBy: [{ empresaTipo: "asc" }, { nome: "asc" }] });
}
export function findCatalogo(id: string) { return prisma.catalogoItem.findUnique({ where: { id }, select }); }
export function createCatalogo(data: { nome: string; descricao: string; unidade: string; preco: number; empresaTipo: EmpresaTipo | null; ativo: boolean }) {
  return prisma.catalogoItem.create({ data, select });
}
export function updateCatalogo(id: string, data: { nome: string; descricao: string; unidade: string; preco: number; empresaTipo: EmpresaTipo | null; ativo: boolean }) {
  return prisma.catalogoItem.update({ where: { id }, data, select });
}
export function deleteCatalogo(id: string) { return prisma.catalogoItem.delete({ where: { id } }); }
