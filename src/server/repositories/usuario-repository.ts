import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export function listUsuarios() {
  return prisma.user.findMany({
    select: { id: true, nome: true, email: true, role: true, empresaId: true, empresa: { select: { nome: true } } },
    orderBy: { nome: "asc" },
  });
}
export function findUsuario(id: string) {
  return prisma.user.findUnique({ where: { id }, select: { id: true, nome: true, email: true, role: true, empresaId: true } });
}
export function createUsuario(data: { nome: string; email: string; passwordHash: string; role: Role; empresaId: string | null }) {
  return prisma.user.create({ data });
}
export function updateUsuario(id: string, data: { nome: string; email: string; passwordHash?: string; role: Role; empresaId: string | null }) {
  return prisma.user.update({ where: { id }, data });
}
export function deleteUsuario(id: string) { return prisma.user.delete({ where: { id } }); }
