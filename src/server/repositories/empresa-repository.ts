import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const empresaListSelect = {
  id: true,
  nome: true,
  tipo: true,
  saldo: true,
  createdAt: true,
  _count: {
    select: {
      usuarios: {
        where: { role: "STUDENT" },
      },
    },
  },
} satisfies Prisma.EmpresaSelect;

export type EmpresaComContagem = Prisma.EmpresaGetPayload<{
  select: typeof empresaListSelect;
}>;

export function listEmpresasComEstudantes() {
  return prisma.empresa.findMany({
    select: empresaListSelect,
    orderBy: { nome: "asc" },
  });
}

export function findEmpresaById(id: string) {
  return prisma.empresa.findUnique({
    where: { id },
    select: {
      id: true,
      nome: true,
      tipo: true,
      saldo: true,
    },
  });
}
