import type { Metadata } from "next";

import { requireTeacher } from "@/server/auth/session";
import { getParametros } from "@/server/services/parametro-service";

import { ParametrosView } from "./parametros-view";

export const metadata: Metadata = { title: "Parâmetros econômicos" };

export default async function ParametrosPage() {
  await requireTeacher();
  const parametros = await getParametros();
  return <ParametrosView parametros={parametros.map(p => ({ nome: p.nome, valor: Number(p.valor), descricao: p.descricao }))} />;
}
