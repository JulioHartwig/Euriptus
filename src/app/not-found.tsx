import Link from "next/link";
import type { Metadata } from "next";
import { Compass } from "lucide-react";

import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Página não encontrada",
};

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-12 text-center">
      <Brand className="mb-10" />
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-primary">
        <Compass aria-hidden="true" className="h-7 w-7" />
      </span>
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
        Erro 404
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        Página não encontrada
      </h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        O endereço que você tentou abrir não existe ou foi movido. Volte ao painel para
        continuar a simulação.
      </p>
      <Button asChild className="mt-6">
        <Link href="/painel">Voltar ao painel</Link>
      </Button>
    </main>
  );
}
