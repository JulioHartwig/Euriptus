import type { Metadata } from "next";

import { requireTeacher } from "@/server/auth/session";
import { getEventoTemplates, getEventosAtivos } from "@/server/services/evento-service";

import { EventosView } from "./eventos-view";

export const metadata: Metadata = { title: "Eventos econômicos" };

export default async function EventosPage() {
  await requireTeacher();
  const [templates, disparos] = await Promise.all([getEventoTemplates(), getEventosAtivos()]);

  return (
    <EventosView
      templates={templates.map((t) => ({
        id: t.id,
        titulo: t.titulo,
        descricao: t.descricao,
        tipoNoticia: t.tipoNoticia,
        impactoTexto: t.impactoTexto,
        ativo: t.ativo,
        disparos: t._count.disparos,
      }))}
      disparos={disparos.map((d) => ({
        id: d.id,
        template: d.template.titulo,
        rodada: d.rodada?.numero ?? null,
        disparadoEm: d.disparadoEm.toISOString(),
        autor: d.disparadoPor.nome,
        noticia: d.noticia?.titulo ?? null,
      }))}
    />
  );
}
