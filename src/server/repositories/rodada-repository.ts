import { prisma } from "@/lib/prisma";

export function findRodadaAberta() {
  return prisma.rodada.findFirst({ where: { status: "ABERTA" } });
}

export function listRodadas() {
  return prisma.rodada.findMany({
    include: {
      abertaPor: { select: { nome: true } },
      fechadaPor: { select: { nome: true } },
      _count: { select: { transacoes: true } },
    },
    orderBy: { numero: "desc" },
  });
}

export function getUltimoNumero() {
  return prisma.rodada.aggregate({ _max: { numero: true } });
}

export function criarRodada(numero: number, userId: string) {
  return prisma.rodada.create({
    data: { numero, abertaPorUserId: userId },
  });
}
