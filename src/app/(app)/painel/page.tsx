import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CalendarClock,
  GraduationCap,
  Handshake,
  Landmark,
  Package,
  ShieldCheck,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { CadeiaProdutiva } from "@/components/cadeia-produtiva";
import { NoticiaLista } from "@/components/noticia-lista";
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
  EMPRESA_TIPOS,
} from "@/lib/empresa";
import { firstName, formatCurrency } from "@/lib/utils";
import { requireUser } from "@/server/auth/session";
import { getDividaTotal } from "@/server/services/banco-service";
import { getEmpresaDoUsuario } from "@/server/services/empresa-service";
import { getEstoqueTotal } from "@/server/services/mercado-service";
import { getNoticiasAtivas } from "@/server/services/noticia-service";
import { getRodadaAtualInfo } from "@/server/services/rodada-service";

export const metadata: Metadata = {
  title: "Painel",
};

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

  const [empresa, noticias, rodadaAtual] = await Promise.all([
    getEmpresaDoUsuario(user.id),
    getNoticiasAtivas(),
    getRodadaAtualInfo(),
  ]);
  const [divida, estoqueTotal] = empresa
    ? await Promise.all([getDividaTotal(empresa.id), getEstoqueTotal(empresa.id)])
    : [null, 0];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={`Olá, ${firstName(user.nome)}`}
        title={empresa ? empresa.nome : "Meu painel"}
        description={
          empresa
            ? `${EMPRESA_TIPO_DESCRICAO[empresa.tipo]} Etapa ${EMPRESA_TIPOS.indexOf(empresa.tipo) + 1} de 4 da cadeia.`
            : "Acompanhe o cenário do café e prepare sua empresa para as próximas rodadas."
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {empresa && (
              <Badge variant="secondary" className="px-3 py-1.5">
                {EMPRESA_TIPO_LABEL[empresa.tipo]}
              </Badge>
            )}
            <Badge variant="outline" className="gap-1.5 bg-card px-3 py-1.5">
              <Wallet aria-hidden="true" className="h-3.5 w-3.5 text-primary" />
              {formatCurrency(empresa?.saldo ?? 0)}
            </Badge>
          </div>
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
        <section
          aria-label="Indicadores da empresa"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <h2 className="sr-only">Indicadores da empresa</h2>
          <IndicadorCard
            titulo="Saldo atual"
            valor={formatCurrency(empresa.saldo)}
            detalhe="Caixa disponível para negociações"
            icon={Wallet}
          />
          <IndicadorCard
            titulo="Dívida total"
            valor={formatCurrency(divida?.totalDevido ?? 0)}
            detalhe={
              !divida || divida.quantidade === 0
                ? "Nenhum empréstimo contratado"
                : `${divida.quantidade} ${divida.quantidade === 1 ? "contrato ativo" : "contratos ativos"}`
            }
            icon={Landmark}
          />
          <IndicadorCard
            titulo="Estoque total"
            valor={String(estoqueTotal)}
            detalhe={
              estoqueTotal === 0
                ? "Nenhum item em estoque"
                : "Itens armazenados na empresa"
            }
            icon={Package}
          />
          <IndicadorCard
            titulo="Rodada atual"
            valor={rodadaAtual ? String(rodadaAtual.numero) : "—"}
            detalhe={
              !rodadaAtual
                ? "Aguardando o professor abrir a rodada"
                : rodadaAtual.status === "ABERTA"
                  ? "Rodada aberta"
                  : "Última rodada fechada"
            }
            icon={CalendarClock}
          />
        </section>
      )}

      <section aria-labelledby="noticias-title" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              id="noticias-title"
              className="font-display text-xl font-semibold tracking-tight"
            >
              Notícias do mercado
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Avisos e movimentos que valem para toda a cadeia do café.
            </p>
          </div>
          {noticias.length > 0 && (
            <Badge variant="outline" className="bg-card">
              {noticias.length} {noticias.length === 1 ? "publicada" : "publicadas"}
            </Badge>
          )}
        </div>
        <NoticiaLista noticias={noticias} />
      </section>

      {empresa && (
        <section aria-labelledby="cadeia-title">
          <div className="mb-4">
            <h2
              id="cadeia-title"
              className="font-display text-xl font-semibold tracking-tight"
            >
              O caminho do café
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sua empresa ocupa uma das quatro etapas da cadeia produtiva.
            </p>
          </div>
          <CadeiaProdutiva atual={empresa.tipo} />
        </section>
      )}
    </div>
  );
}

function IndicadorCard({
  titulo,
  valor,
  detalhe,
  icon: Icon,
}: {
  titulo: string;
  valor: string;
  detalhe: string;
  icon: LucideIcon;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {titulo}
        </CardTitle>
        <Icon aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          {valor}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{detalhe}</p>
      </CardContent>
    </Card>
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
              Novos ajustes de simulação e acompanhamento das negociações entram nas
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
