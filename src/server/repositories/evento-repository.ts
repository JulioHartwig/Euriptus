import type { NoticiaTipo } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export function listEventoTemplates() {
  return prisma.eventoTemplate.findMany({
    include: { _count: { select: { disparos: true } } },
    orderBy: [{ ativo: "desc" }, { criadoEm: "desc" }],
  });
}

export function findEventoTemplate(id: string) {
  return prisma.eventoTemplate.findUnique({ where: { id } });
}

export function createEventoTemplate(data: {
  titulo: string;
  descricao: string;
  tipoNoticia: NoticiaTipo;
  impactoTexto: string | null;
  ativo: boolean;
}) {
  return prisma.eventoTemplate.create({ data });
}

export function updateEventoTemplate(
  id: string,
  data: { titulo: string; descricao: string; tipoNoticia: NoticiaTipo; impactoTexto: string | null; ativo: boolean },
) {
  return prisma.eventoTemplate.update({ where: { id }, data });
}

export function deleteEventoTemplate(id: string) {
  return prisma.eventoTemplate.delete({ where: { id } });
}

export function listEventosAtivos() {
  return prisma.eventoAtivo.findMany({
    include: {
      template: { select: { titulo: true, tipoNoticia: true } },
      rodada: { select: { numero: true } },
      disparadoPor: { select: { nome: true } },
      noticia: { select: { id: true, titulo: true } },
    },
    orderBy: { disparadoEm: "desc" },
    take: 50,
  });
}

export function dispararEventoComNoticia(dados: {
  templateId: string;
  titulo: string;
  corpo: string;
  tipoNoticia: NoticiaTipo;
  rodadaId: string | null;
  disparadoPorUserId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const noticia = await tx.noticia.create({
      data: {
        titulo: dados.titulo,
        corpo: dados.corpo,
        tipo: dados.tipoNoticia,
        ativa: true,
      },
    });
    const evento = await tx.eventoAtivo.create({
      data: {
        templateId: dados.templateId,
        rodadaId: dados.rodadaId,
        noticiaId: noticia.id,
        disparadoPorUserId: dados.disparadoPorUserId,
      },
      include: {
        template: { select: { titulo: true } },
        rodada: { select: { numero: true } },
        noticia: { select: { id: true } },
      },
    });
    return evento;
  });
}
