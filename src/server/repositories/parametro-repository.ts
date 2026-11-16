import { prisma } from "@/lib/prisma";

export function listParametros() {
  return prisma.parametroEconomico.findMany({ orderBy: { nome: "asc" } });
}

export function updateParametro(nome: string, data: { valor: number; descricao: string }) {
  return prisma.parametroEconomico.update({ where: { nome }, data });
}
