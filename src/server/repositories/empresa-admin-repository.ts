import type { EmpresaTipo } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export function listEmpresasAdmin() {
  return prisma.empresa.findMany({
    include: {
      _count: { select: { usuarios: true } },
    },
    orderBy: { nome: "asc" },
  });
}
export function findEmpresaAdmin(id: string) {
  return prisma.empresa.findUnique({
    where: { id },
    include: {
      usuarios: { select: { id: true, nome: true, email: true, role: true } },
      _count: { select: { usuarios: true, transacoes: true, estoque: true, emprestimos: true, investimentos: true } },
    },
  });
}

export function findEmpresaConsolidada(id: string) {
  return prisma.empresa.findUnique({
    where: { id },
    include: {
      usuarios: { select: { id: true, nome: true, email: true, role: true } },
      estoque: { include: { catalogoItem: { select: { nome: true, unidade: true } } }, orderBy: { catalogoItem: { nome: "asc" } } },
      transacoes: {
        include: { criadoPor: { select: { nome: true } } },
        orderBy: { criadoEm: "desc" },
        take: 30,
      },
      emprestimos: {
        include: { criadoPor: { select: { nome: true } } },
        orderBy: [{ status: "asc" }, { criadoEm: "desc" }],
      },
      investimentos: {
        include: { criadoPor: { select: { nome: true } }, resgatadoPor: { select: { nome: true } } },
        orderBy: [{ status: "asc" }, { criadoEm: "desc" }],
      },
      propostasEnviadas: {
        include: { empresaDestino: { select: { nome: true } }, catalogoItem: { select: { nome: true, unidade: true } } },
        orderBy: { criadoEm: "desc" },
        take: 20,
      },
      propostasRecebidas: {
        include: { empresaOrigem: { select: { nome: true } }, catalogoItem: { select: { nome: true, unidade: true } } },
        orderBy: { criadoEm: "desc" },
        take: 20,
      },
    },
  });
}

export function listEmpresasBancoConsolidado() {
  return prisma.empresa.findMany({
    include: {
      emprestimos: { select: { status: true, totalDevido: true, valorPrincipal: true }, where: { status: "ATIVO" } },
      investimentos: { select: { status: true, valorAplicado: true }, where: { status: "ATIVO" } },
      _count: { select: { emprestimos: true, investimentos: true } },
    },
    orderBy: { nome: "asc" },
  });
}
export function createEmpresa(data: { nome: string; tipo: EmpresaTipo; saldo: number }) {
  return prisma.empresa.create({ data });
}
export function updateEmpresa(id: string, data: { nome: string; tipo: EmpresaTipo; saldo: number }) {
  return prisma.empresa.update({ where: { id }, data });
}
export function deleteEmpresa(id: string) { return prisma.empresa.delete({ where: { id } }); }
