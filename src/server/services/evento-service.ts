import type { NoticiaTipo } from "@prisma/client";

import {
  createEventoTemplate,
  deleteEventoTemplate,
  dispararEventoComNoticia,
  findEventoTemplate,
  listEventoTemplates,
  listEventosAtivos,
  updateEventoTemplate,
} from "@/server/repositories/evento-repository";
import { getRodadaAbertaId } from "@/server/services/rodada-service";

export class EventoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EventoError";
  }
}

export function getEventoTemplates() {
  return listEventoTemplates();
}

export function getEventosAtivos() {
  return listEventosAtivos();
}

export async function salvarEventoTemplate(d: {
  id?: string;
  titulo: string;
  descricao: string;
  tipoNoticia: NoticiaTipo;
  impactoTexto?: string;
  ativo: boolean;
}) {
  const payload = {
    titulo: d.titulo.trim(),
    descricao: d.descricao.trim(),
    tipoNoticia: d.tipoNoticia,
    impactoTexto: d.impactoTexto?.trim() ? d.impactoTexto.trim() : null,
    ativo: d.ativo,
  };
  if (d.id) {
    const existente = await findEventoTemplate(d.id);
    if (!existente) throw new EventoError("Template de evento não encontrado.");
    return updateEventoTemplate(d.id, payload);
  }
  return createEventoTemplate(payload);
}

export async function removerEventoTemplate(id: string) {
  const existente = await findEventoTemplate(id);
  if (!existente) throw new EventoError("Template de evento não encontrado.");
  await deleteEventoTemplate(id);
}

export async function dispararEvento(templateId: string, userId: string) {
  const template = await findEventoTemplate(templateId);
  if (!template) throw new EventoError("Template de evento não encontrado.");
  if (!template.ativo) throw new EventoError("Ative o template antes de disparar o evento.");

  const rodadaId = await getRodadaAbertaId();
  const corpo = template.impactoTexto
    ? `${template.descricao}\n\nImpacto: ${template.impactoTexto}`
    : template.descricao;

  return dispararEventoComNoticia({
    templateId: template.id,
    titulo: template.titulo,
    corpo,
    tipoNoticia: template.tipoNoticia,
    rodadaId,
    disparadoPorUserId: userId,
  });
}
