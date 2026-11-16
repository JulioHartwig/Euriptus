import type { Metadata } from "next";
import Link from "next/link";
import {
  BadgeDollarSign,
  Building2,
  CalendarClock,
  GraduationCap,
  Landmark,
  Megaphone,
  Newspaper,
  Package,
  Settings,
  Users,
  Wallet,
} from "lucide-react";

import { EmpresaIcon } from "@/components/empresa-icon";
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
import { formatCurrency, formatDate } from "@/lib/utils";
import { requireTeacher } from "@/server/auth/session";
import { listEmpresasComEstudantes } from "@/server/repositories/empresa-repository";
import { getTodasNoticias } from "@/server/services/noticia-service";

export const metadata: Metadata = {
  title: "Painel do Professor",
};

export default async function ProfessorPage() {
  await requireTeacher();

  const [empresas, noticias] = await Promise.all([
    listEmpresasComEstudantes(),
    getTodasNoticias(),
  ]);
  const empresasOrdenadas = [...empresas].sort(
    (a, b) => EMPRESA_TIPOS.indexOf(a.tipo) - EMPRESA_TIPOS.indexOf(b.tipo),
  );

  const totalEstudantes = empresas.reduce(
    (total, empresa) => total + empresa._count.usuarios,
    0,
  );
  const saldoTotal = empresas.reduce(
    (total, empresa) => total + Number(empresa.saldo),
    0,
  );

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Ãrea do professor"
        title="Painel do Professor"
        description="VisÃ£o geral e gestÃ£o do simulador: rodadas, empresas, usuÃ¡rios, parÃ¢metros, catÃ¡logo e notÃ­cias."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline">
              <Link href="/professor/rodadas">
                <CalendarClock aria-hidden="true" className="h-4 w-4" />
                Rodadas
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/professor/financeiro">
                <Landmark aria-hidden="true" className="h-4 w-4" />
                Financeiro
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/professor/banco">
                <BadgeDollarSign aria-hidden="true" className="h-4 w-4" />
                Banco
              </Link>
            </Button>
          </div>
        }
      />

      <section aria-label="Resumo geral" className="grid gap-4 sm:grid-cols-3">
        <h2 className="sr-only">Resumo geral</h2>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Empresas
            </CardTitle>
            <Building2 aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl font-semibold">{empresas.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Uma por etapa da cadeia (esperado: 4)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Estudantes vinculados
            </CardTitle>
            <Users aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl font-semibold">{totalEstudantes}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Contas com perfil STUDENT
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo somado
            </CardTitle>
            <Wallet aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl font-semibold">{formatCurrency(saldoTotal)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Caixa total das empresas</p>
          </CardContent>
        </Card>
      </section>

      <Alert variant="info">
        <GraduationCap aria-hidden="true" className="h-4 w-4" />
        <AlertTitle>Gestão disponível</AlertTitle>
        <AlertDescription>
          Gerencie rodadas, eventos econômicos, empresas, usuários, notícias, parâmetros, catálogo e
          acompanhe banco/financeiro consolidado. Próxima etapa: polimento, testes e deploy.
        </AlertDescription>
      </Alert>

      <section aria-label="Atalhos de gestão" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: "/professor/eventos", label: "Eventos", desc: "Templates e disparos", icon: Megaphone },
          { href: "/professor/empresas", label: "Empresas", desc: "Cadastro e detalhes", icon: Building2 },
          { href: "/professor/usuarios", label: "Usuários", desc: "Contas e vínculos", icon: Users },
          { href: "/professor/parametros", label: "Parâmetros", desc: "Taxas e regras", icon: Settings },
          { href: "/professor/catalogo", label: "Catálogo", desc: "Itens e preços", icon: Package },
        ].map((item) => (
          <Link key={item.href} href={item.href} className="rounded-lg border bg-card p-4 transition-colors hover:bg-accent/40">
            <div className="flex items-center gap-2 font-medium"><item.icon className="h-4 w-4 text-primary" />{item.label}</div>
            <p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
          </Link>
        ))}
      </section>

      <section aria-labelledby="empresas-title">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 id="empresas-title" className="font-display text-xl font-semibold tracking-tight">
              Empresas da cadeia
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Ordenadas pela posiÃ§Ã£o na cadeia produtiva.
            </p>
          </div>
          <span className="text-xs text-muted-foreground">
            {empresas.length} {empresas.length === 1 ? "empresa" : "empresas"}
          </span>
        </div>

        {empresasOrdenadas.length === 0 ? (
          <Card>
            <CardContent className="flex min-h-40 flex-col items-center justify-center py-10 text-center">
              <Building2 aria-hidden="true" className="h-8 w-8 text-muted-foreground/50" />
              <p className="mt-3 text-sm font-medium">Nenhuma empresa cadastrada</p>
              <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                Rode o seed de desenvolvimento para criar as quatro empresas da cadeia.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {empresasOrdenadas.map((empresa) => (
              <Card key={empresa.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary">
                      <EmpresaIcon tipo={empresa.tipo} />
                    </span>
                    <Badge variant="secondary">
                      Etapa {EMPRESA_TIPOS.indexOf(empresa.tipo) + 1}
                    </Badge>
                  </div>
                  <CardTitle className="pt-2 font-display text-xl leading-tight">
                    {empresa.nome}
                  </CardTitle>
                  <CardDescription>
                    {EMPRESA_TIPO_LABEL[empresa.tipo]} Â·{" "}
                    {EMPRESA_TIPO_DESCRICAO[empresa.tipo]}
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto">
                  <dl className="grid grid-cols-2 gap-3 border-t pt-4">
                    <div>
                      <dt className="text-[0.68rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                        Saldo atual
                      </dt>
                      <dd className="mt-1 font-display text-lg font-semibold">
                        {formatCurrency(empresa.saldo)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[0.68rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                        Estudantes
                      </dt>
                      <dd className="mt-1 flex items-center gap-1.5 font-display text-lg font-semibold">
                        <Users aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
                        {empresa._count.usuarios}
                      </dd>
                    </div>
                  </dl>
                  <p className="mt-4 text-[0.7rem] text-muted-foreground">
                    Criada em {formatDate(empresa.createdAt)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="noticias-professor-title" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              id="noticias-professor-title"
              className="font-display text-xl font-semibold tracking-tight"
            >
              NotÃ­cias do mercado
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              ConteÃºdo exibido no painel dos estudantes. Nesta iteraÃ§Ã£o, somente leitura.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/professor/noticias">
              <Newspaper aria-hidden="true" className="h-4 w-4" />
              Gerenciar notÃ­cias
            </Link>
          </Button>
        </div>
        <NoticiaLista noticias={noticias} mostrarInativas />
      </section>
    </div>
  );
}
