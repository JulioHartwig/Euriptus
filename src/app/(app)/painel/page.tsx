import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  GraduationCap,
  Handshake,
  Landmark,
  Newspaper,
  ShieldCheck,
  Wallet,
} from "lucide-react";

import { CadeiaProdutiva } from "@/components/cadeia-produtiva";
import { EmpresaIcon } from "@/components/empresa-icon";
import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  EMPRESA_TIPO_DESCRICAO,
  EMPRESA_TIPO_LABEL,
} from "@/lib/empresa";
import { firstName, formatCurrency } from "@/lib/utils";
import { requireUser } from "@/server/auth/session";

export const metadata: Metadata = {
  title: "Painel",
};

const PROXIMAS_AREAS = [
  {
    href: "/mercado",
    label: "Mercado",
    description: "Preços e eventos econômicos",
    icon: Newspaper,
  },
  {
    href: "/negociacoes",
    label: "Negociações",
    description: "Propostas formais entre empresas",
    icon: Handshake,
  },
  {
    href: "/financeiro",
    label: "Financeiro",
    description: "Custos, impostos e salários",
    icon: Wallet,
  },
  {
    href: "/banco",
    label: "Banco",
    description: "Empréstimos e financiamentos",
    icon: Landmark,
  },
];

export default async function PainelPage({
  searchParams,
}: {
  searchParams: Promise<{ aviso?: string }>;
}) {
  const user = await requireUser();
  const { aviso } = await searchParams;

  if (user.role === "TEACHER") {
    return <ProfessorOverview nome={user.nome} />;
  }

  const empresa = user.empresa;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Painel do estudante"
        title={`Olá, ${firstName(user.nome)}`}
        description="Esta é a base do seu simulador. Em breve, novas áreas serão liberadas a cada rodada."
        actions={
          <Badge variant="outline" className="gap-1.5 bg-card px-3 py-1.5">
            <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5 text-primary" />
            Iteração 1
          </Badge>
        }
      />

      {aviso === "acesso-negado" && (
        <Alert variant="warning">
          <ShieldCheck aria-hidden="true" className="h-4 w-4" />
          <AlertTitle>Acesso restrito</AlertTitle>
          <AlertDescription>
            Esta área é exclusiva para professores. Você foi direcionado de volta ao seu painel.
          </AlertDescription>
        </Alert>
      )}

      {!empresa ? (
        <Alert variant="warning">
          <Building2 aria-hidden="true" className="h-4 w-4" />
          <AlertTitle>Sua conta ainda não está vinculada a uma empresa</AlertTitle>
          <AlertDescription>
            Peça ao professor para vincular seu usuário a uma empresa antes do início das
            negociações.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <section
            aria-label="Resumo da empresa"
            className="grid gap-4 lg:grid-cols-3"
          >
            <h2 className="sr-only">Resumo da empresa</h2>
            <Card className="relative overflow-hidden border-0 bg-sidebar text-sidebar-foreground shadow-md lg:col-span-2">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full border border-white/10"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-24 right-16 h-44 w-44 rounded-full bg-amber-400/10 blur-2xl"
              />
              <CardHeader className="relative pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-sidebar-muted">
                      Saldo disponível
                    </p>
                    <p className="mt-2 font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                      {formatCurrency(empresa.saldo)}
                    </p>
                  </div>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-amber-300">
                    <Wallet aria-hidden="true" className="h-5 w-5" />
                  </span>
                </div>
              </CardHeader>
              <CardContent className="relative pt-2">
                <p className="max-w-md text-sm leading-relaxed text-sidebar-foreground/70">
                  Todo saldo é mantido no banco de dados e será usado para fechar
                  negociações. Não existe inadimplência no simulador.
                </p>
                <p className="mt-5 text-[0.7rem] font-medium uppercase tracking-[0.14em] text-sidebar-muted">
                  Caixa da empresa · moeda fictícia (BRL)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Sua empresa
                </p>
                <CardTitle className="pt-1 font-display text-2xl leading-tight">
                  {empresa.nome}
                </CardTitle>
                <CardDescription>{EMPRESA_TIPO_DESCRICAO[empresa.tipo]}</CardDescription>
              </CardHeader>
              <CardContent className="pt-1">
                <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                    <EmpresaIcon tipo={empresa.tipo} />
                  </span>
                  <div>
                    <p className="text-[0.68rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      Etapa da cadeia
                    </p>
                    <p className="text-sm font-semibold">{EMPRESA_TIPO_LABEL[empresa.tipo]}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <section aria-labelledby="cadeia-title">
            <div className="mb-4">
              <h2 id="cadeia-title" className="font-display text-xl font-semibold tracking-tight">
                O caminho do café
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Sua empresa ocupa uma das quatro etapas da cadeia produtiva.
              </p>
            </div>
            <CadeiaProdutiva atual={empresa.tipo} />
          </section>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="flex-row items-start gap-3 space-y-0 pb-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                  <Newspaper aria-hidden="true" className="h-5 w-5" />
                </span>
                <div>
                  <CardTitle className="flex flex-wrap items-center gap-2">
                    Notícias do mercado
                    <Badge variant="accent">Em breve</Badge>
                  </CardTitle>
                  <CardDescription>
                    Eventos econômicos disparados pelo professor aparecerão aqui.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex min-h-40 flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 px-6 py-8 text-center">
                  <Newspaper aria-hidden="true" className="h-8 w-8 text-muted-foreground/50" />
                  <p className="mt-3 text-sm font-medium">Nenhuma notícia publicada</p>
                  <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
                    Quando as rodadas e os eventos forem implementados, as notícias do
                    mercado do café serão exibidas nesta área.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Próximas áreas</CardTitle>
                <CardDescription>O que está sendo preparado</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="divide-y">
                  {PROXIMAS_AREAS.map((area) => {
                    const Icon = area.icon;
                    return (
                      <li key={area.href}>
                        <Link
                          href={area.href}
                          className="group flex items-center gap-3 py-3 transition-colors first:pt-0 last:pb-0"
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-primary">
                            <Icon aria-hidden="true" className="h-4 w-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-medium">{area.label}</span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {area.description}
                            </span>
                          </span>
                          <ArrowUpRight
                            aria-hidden="true"
                            className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary"
                          />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function ProfessorOverview({ nome }: { nome: string }) {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Painel"
        title={`Olá, ${firstName(nome)}`}
        description="Você está logado como professor. As rotas de aluno podem ser visitadas em modo de leitura."
        actions={
          <Button asChild>
            <Link href="/professor">
              <GraduationCap aria-hidden="true" className="h-4 w-4" />
              Abrir Painel do Professor
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </Button>
        }
      />

      <Alert variant="info">
        <GraduationCap aria-hidden="true" className="h-4 w-4" />
        <AlertTitle>Visão do professor</AlertTitle>
        <AlertDescription>
          Seu usuário não pertence a uma empresa. A lista de empresas e saldos fica
          no Painel do Professor.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary">
              <Building2 aria-hidden="true" className="h-5 w-5" />
            </span>
            <CardTitle>Empresas cadastradas</CardTitle>
            <CardDescription>
              Consulte as empresas da cadeia, seus saldos e quantidades de estudantes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href="/professor">
                Ver empresas
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary">
              <Handshake aria-hidden="true" className="h-5 w-5" />
            </span>
            <CardTitle>Próximas ferramentas</CardTitle>
            <CardDescription>
              Rodadas, eventos econômicos e acompanhamento das negociações entram nas
              próximas iterações.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant="accent">Planejado</Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
