import type { Metadata } from "next";
import { requireTeacher } from "@/server/auth/session";
import { getCatalogoAdmin } from "@/server/services/catalogo-admin-service";
import { CatalogoAdminView } from "./catalogo-view";

export const metadata: Metadata = { title: "Catálogo" };

export default async function CatalogoAdminPage() {
  await requireTeacher();
  const itens = await getCatalogoAdmin();

  return (
    <CatalogoAdminView
      itens={itens.map((i) => ({
        ...i,
        preco: Number(i.preco),
        aumentoMarketing: Number(i.aumentoMarketing),
      }))}
    />
  );
}
