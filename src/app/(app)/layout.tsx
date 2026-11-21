import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/server/auth/session";
import { getAlertas } from "@/server/services/alertas-service";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const alertas = await getAlertas({
    id: user.id,
    role: user.role,
    empresaId: user.empresaId,
    empresaTipo: user.empresa?.tipo ?? null,
  });

  return (
    <AppShell
      user={{ nome: user.nome, email: user.email, role: user.role }}
      empresa={user.empresa ? { nome: user.empresa.nome, tipo: user.empresa.tipo } : null}
      quantidadeAlertas={alertas.length}
    >
      {children}
    </AppShell>
  );
}
