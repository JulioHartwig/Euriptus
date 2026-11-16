import type { NoticiaTipo } from "@prisma/client";

export const NOTICIA_TIPOS: NoticiaTipo[] = ["MERCADO", "EVENTO", "AVISO"];

export const NOTICIA_TIPO_LABEL: Record<NoticiaTipo, string> = {
  MERCADO: "Mercado",
  EVENTO: "Evento",
  AVISO: "Aviso",
};

export const NOTICIA_TIPO_DESCRICAO: Record<NoticiaTipo, string> = {
  MERCADO: "Movimentos de preços e do cenário econômico.",
  EVENTO: "Acontecimentos que afetam toda a cadeia produtiva.",
  AVISO: "Orientações e recados do professor.",
};

/**
 * Variante visual do Badge para cada tipo de notícia.
 * Mantida aqui (e não no componente) para que novas telas usem o mesmo padrão.
 */
export const NOTICIA_TIPO_BADGE: Record<
  NoticiaTipo,
  "secondary" | "accent" | "default"
> = {
  MERCADO: "secondary",
  EVENTO: "accent",
  AVISO: "default",
};
