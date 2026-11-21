import type { Metadata } from "next";

import { requireUser } from "@/server/auth/session";
import { getRodadas } from "@/server/services/rodada-service";

import { RodadasView } from "./rodadas-view";

export const metadata: Metadata = { title: "Rodadas" };

export default async function RodadasProfessorPage() {
  const user = await requireUser();
  if (user.role !== "TEACHER") {
    // middleware/guards já protegem, mas reforça no servidor
    const { redirect } = await import("next/navigation");
    redirect("/painel?aviso=acesso-negado");
  }

  const rodadas = await getRodadas();

  return (
    <RodadasView
      rodadas={rodadas.map((r) => ({
        id: r.id,
        numero: r.numero,
        competencia: r.competencia?.toISOString() ?? null,
        status: r.status,
        abertaEm: r.abertaEm.toISOString(),
        abertaPor: r.abertaPor.nome,
        fechadaEm: r.fechadaEm?.toISOString() ?? null,
        fechadaPor: r.fechadaPor?.nome ?? null,
        transacoes: r._count.transacoes,
      }))}
    />
  );
}
