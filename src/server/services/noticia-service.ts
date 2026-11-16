import type { NoticiaTipo } from "@prisma/client";

import {
  createNoticia,
  deleteNoticia,
  findNoticia,
  listNoticias,
  setNoticiaAtiva,
  updateNoticia,
} from "@/server/repositories/noticia-repository";

export class NoticiaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NoticiaError";
  }
}

/** Notícias publicadas, exibidas no painel dos estudantes. */
export function getNoticiasAtivas() {
  return listNoticias({ apenasAtivas: true });
}

/** Todas as notícias, inclusive inativas. Usado pelo professor. */
export function getTodasNoticias() {
  return listNoticias();
}

export async function salvarNoticia(dados: {
  id?: string;
  titulo: string;
  corpo: string;
  tipo: NoticiaTipo;
  ativa: boolean;
}) {
  const payload = {
    titulo: dados.titulo.trim(),
    corpo: dados.corpo.trim(),
    tipo: dados.tipo,
    ativa: dados.ativa,
  };
  if (!payload.titulo || !payload.corpo) throw new NoticiaError("Preencha título e corpo.");
  if (dados.id) {
    const existente = await findNoticia(dados.id);
    if (!existente) throw new NoticiaError("Notícia não encontrada.");
    return updateNoticia(dados.id, payload);
  }
  return createNoticia(payload);
}

export async function removerNoticia(id: string) {
  const existente = await findNoticia(id);
  if (!existente) throw new NoticiaError("Notícia não encontrada.");
  await deleteNoticia(id);
}

export async function alternarNoticia(id: string, ativa: boolean) {
  const existente = await findNoticia(id);
  if (!existente) throw new NoticiaError("Notícia não encontrada.");
  return setNoticiaAtiva(id, ativa);
}
