import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { LoginForm, type DemoAccount } from "@/app/login/login-form";
import { Brand } from "@/components/brand";
import { EmpresaIcon } from "@/components/empresa-icon";
import { authOptions } from "@/server/auth/options";
import {
  EMPRESA_TIPO_DESCRICAO,
  EMPRESA_TIPO_LABEL,
  EMPRESA_TIPOS,
} from "@/lib/empresa";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Acesse o simulador Euriptus com seu e-mail e senha.",
};

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    email: "professor@euriptus.com",
    label: "Professor",
    detail: "Acesso ao painel do professor",
  },
  {
    email: "produtor@euriptus.com",
    label: "Produtor",
    detail: "Fazenda Boa Esperança",
  },
  {
    email: "logistica@euriptus.com",
    label: "Logística",
    detail: "Transportes Vale Verde",
  },
  {
    email: "beneficiamento@euriptus.com",
    label: "Beneficiamento",
    detail: "Beneficiadora Grão de Ouro",
  },
  {
    email: "venda@euriptus.com",
    label: "Venda",
    detail: "Café Aurora",
  },
];

function resolveCallbackUrl(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;

  if (!raw) return "/painel";
  // Aceita apenas caminhos internos, evitando open redirect.
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/painel";

  return raw;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string | string[] }>;
}) {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/painel");
  }

  const params = await searchParams;
  const callbackUrl = resolveCallbackUrl(params.callbackUrl);
  const showDemoAccounts =
    process.env.NODE_ENV !== "production" ||
    process.env.SHOW_DEMO_CREDENTIALS === "true";

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-sidebar px-10 py-10 text-sidebar-foreground lg:flex lg:flex-col lg:justify-between xl:px-14">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-40 -top-40 h-[28rem] w-[28rem] rounded-full border border-white/10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-[22rem] w-[22rem] rounded-full border border-white/[0.07]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-amber-400/10 blur-3xl"
        />

        <Brand inverted className="relative" />

        <div className="relative my-10 max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">
            Simulação educacional
          </p>
          <h2 className="mt-3 font-display text-4xl font-semibold leading-[1.1] tracking-tight text-white xl:text-[2.75rem]">
            Toda a cadeia do café, da fazenda à xícara.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-sidebar-foreground/75">
            Cada grupo administra uma empresa. Vocês negociam, tomam decisões e
            sentem o efeito das escolhas ao longo das rodadas.
          </p>

          <ol className="mt-10 space-y-1" aria-label="Etapas da cadeia produtiva">
            {EMPRESA_TIPOS.map((tipo, index) => (
              <li key={tipo} className="relative flex gap-3 pb-4 last:pb-0">
                {index < EMPRESA_TIPOS.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="absolute left-[1.1rem] top-9 h-[calc(100%-1.5rem)] w-px bg-white/15"
                  />
                )}
                <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-amber-300">
                  <EmpresaIcon tipo={tipo} className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-sm font-medium text-sidebar-foreground">
                    {index + 1}. {EMPRESA_TIPO_LABEL[tipo]}
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-sidebar-muted">
                    {EMPRESA_TIPO_DESCRICAO[tipo]}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </div>

        <p className="relative max-w-md text-xs leading-relaxed text-sidebar-muted">
          Nenhum dinheiro real é movimentado. O objetivo é aprender sobre cadeia
          produtiva, negociação e gestão.
        </p>
      </aside>

      <main className="flex min-h-dvh flex-col justify-center px-4 py-10 sm:px-8 lg:px-12">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Brand />
          </div>

          <div className="rounded-xl border bg-card p-6 shadow-xl shadow-coffee-900/[0.04] sm:p-8">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                Área restrita
              </p>
              <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">
                Entrar na sua conta
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Use o e-mail e a senha fornecidos pelo seu professor.
              </p>
            </div>

            <LoginForm callbackUrl={callbackUrl} demoAccounts={showDemoAccounts ? DEMO_ACCOUNTS : []} />
          </div>

          <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
            Problemas para entrar? Fale com seu professor ou com a equipe da escola.
          </p>
        </div>
      </main>
    </div>
  );
}
