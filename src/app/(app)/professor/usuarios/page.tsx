import type { Metadata } from "next";

import { requireTeacher } from "@/server/auth/session";
import { getEmpresasAdmin } from "@/server/services/empresa-admin-service";
import { getUsuarios } from "@/server/services/usuario-service";

import { UsuariosAdminView } from "./usuarios-view";

export const metadata: Metadata = { title: "Usuários" };

export default async function UsuariosPage() {
  await requireTeacher();
  const [usuarios, empresas] = await Promise.all([getUsuarios(), getEmpresasAdmin()]);
  return (
    <UsuariosAdminView
      usuarios={usuarios.map((u) => ({
        id: u.id,
        nome: u.nome,
        email: u.email,
        role: u.role,
        empresaId: u.empresaId,
        empresaNome: u.empresa?.nome ?? null,
      }))}
      empresas={empresas.map((e) => ({ id: e.id, nome: e.nome }))}
    />
  );
}
