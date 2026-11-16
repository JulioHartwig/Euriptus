import type { NoticiaTipo, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const noticiaSelect = {
  id: true,
  titulo: true,
  corpo: true,
  tipo: true,
  ativa: true,
  criadoEm: true,
} satisfies Prisma.NoticiaSelect;

export type NoticiaPublica = Prisma.NoticiaGetPayload<{
  select: typeof noticiaSelect;
}>;

/**
 * Notícias são globais (não pertencem a uma empresa).
 * A ordem é da mais recente para a mais antiga.
 */
export function listNoticias({ apenasAtivas = false }: { apenasAtivas?: boolean } = {}) {
  return prisma.noticia.findMany({
    where: apenasAtivas ? { ativa: true } : undefined,
    select: noticiaSelect,
    orderBy: [{ criadoEm: "desc" }, { id: "desc" }],
  });
}

export function findNoticia(id: string) {
  return prisma.noticia.findUnique({ where: { id }, select: noticiaSelect });
}

export function createNoticia(data: { titulo: string; corpo: string; tipo: NoticiaTipo; ativa: boolean }) {
  return prisma.noticia.create({ data, select: noticiaSelect });
}

export function updateNoticia(id: string, data: { titulo: string; corpo: string; tipo: NoticiaTipo; ativa: boolean }) {
  return prisma.noticia.update({ where: { id }, data, select: noticiaSelect });
}

export function deleteNoticia(id: string) {
  return prisma.noticia.delete({ where: { id }, select: { id: true } });
}

export function setNoticiaAtiva(id: string, ativa: boolean) {
  return prisma.noticia.update({ where: { id }, data: { ativa }, select: noticiaSelect });
}
