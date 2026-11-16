import type { Metadata } from "next";

import { requireTeacher } from "@/server/auth/session";
import { getTodasNoticias } from "@/server/services/noticia-service";

import { NoticiasAdminView } from "./noticias-admin-view";

export const metadata: Metadata = {
  title: "Gerenciar notícias",
};

export default async function ProfessorNoticiasPage() {
  await requireTeacher();
  const noticias = await getTodasNoticias();

  return (
    <NoticiasAdminView
      noticias={noticias.map((n) => ({
        id: n.id,
        titulo: n.titulo,
        corpo: n.corpo,
        tipo: n.tipo,
        ativa: n.ativa,
        criadoEm: n.criadoEm.toISOString(),
      }))}
    />
  );
}
