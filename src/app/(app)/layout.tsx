import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/server/auth/session";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <AppShell
      user={{ nome: user.nome, email: user.email, role: user.role }}
      empresa={user.empresa ? { nome: user.empresa.nome, tipo: user.empresa.tipo } : null}
    >
      {children}
    </AppShell>
  );
}
