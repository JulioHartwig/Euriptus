import type { Metadata } from "next";

import { requireTeacher } from "@/server/auth/session";
import { getEmpresasAdmin } from "@/server/services/empresa-admin-service";

import { EmpresasAdminView } from "./empresas-view";

export const metadata: Metadata = { title: "Empresas" };

export default async function EmpresasPage() {
  await requireTeacher();
  const empresas = await getEmpresasAdmin();
  return (
    <EmpresasAdminView
      empresas={empresas.map((e) => ({
        id: e.id,
        nome: e.nome,
        tipo: e.tipo,
        saldo: Number(e.saldo),
        usuarios: e._count.usuarios,
        createdAt: e.createdAt.toISOString(),
      }))}
    />
  );
}
