import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  GraduationCap,
  ReceiptText,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import {
  TRANSACAO_TIPO_BADGE,
  TRANSACAO_TIPO_LABEL,
  TRANSACAO_SINAL,
  formatarValorTransacao,
} from "@/lib/financeiro";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { requireUser } from "@/server/auth/session";
import { getEmpresaDoUsuario } from "@/server/services/empresa-service";
import {
  getCustosFixos,
  getExtrato,
  getResumoFinanceiro,
} from "@/server/services/financeiro-service";

export const metadata: Metadata = {
  title: "Financeiro",
};

export default async function FinanceiroPage() {
  const user = await requireUser();

  if (user.role === "TEACHER") {
    return <VisaoProfessor />;
  }

  const empresa = await getEmpresaDoUsuario(user.id);

  if (!empresa) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Financeiro"
          title="Financeiro"
          description="Receitas, despesas e custos fixos da sua empresa."
        />
        <Alert variant="warning">
          <Building2 aria-hidden="true" className="h-4 w-4" />
          <AlertTitle>Sua conta ainda não está vinculada a uma empresa</AlertTitle>
          <AlertDescription>
            Peça ao professor para vincular seu usuário a uma empresa. O financeiro
            aparecerá aqui assim que o vínculo existir.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const [resumo, extrato, custosFixos] = await Promise.all([
    getResumoFinanceiro(empresa.id),
    getExtrato(empresa.id),
    getCustosFixos(empresa.id),
  ]);

  const totalCustosFixos = custosFixos.reduce(
    (total, custo) => total + Number(custo.valor),
    0,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Financeiro"
        title="Financeiro"
        description={`Receitas, despesas e custos fixos de ${empresa.nome}.`}
        actions={
          <Badge variant="outline" className="bg-card px-3 py-1.5">
            Rodada: —
          </Badge>
        }
      />

      <Card>
        <CardHeader>
          <h2 className="font-display text-lg font-semibold leading-none tracking-tight">
            Resumo da rodada
          </h2>
          <CardDescription>
            Soma de todos os lançamentos registrados até agora. O fechamento por
            rodada chega na Etapa 7.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <ResumoItem
              rotulo="Receitas"
              valor={formatCurrency(resumo.receitas)}
              icon={TrendingUp}
            />
            <ResumoItem
              rotulo="Despesas"
              valor={formatCurrency(resumo.despesas)}
              icon={TrendingDown}
            />
            <ResumoItem
              rotulo="Impostos"
              valor={formatCurrency(resumo.impostos)}
              icon={ReceiptText}
            />
            <ResumoItem
              rotulo="Salários"
              valor={formatCurrency(resumo.salarios)}
              icon={Users}
            />
            <ResumoItem
              rotulo="Resultado"
              valor={formatCurrency(resumo.resultado)}
              icon={Wallet}
              destaque
              tom={resumo.resultado >= 0 ? "positivo" : "negativo"}
            />
          </dl>
          <p className="mt-5 border-t pt-4 text-xs leading-relaxed text-muted-foreground">
            {resumo.totalLancamentos}{" "}
            {resumo.totalLancamentos === 1 ? "lançamento" : "lançamentos"} no
            extrato. Resultado = receitas − despesas − impostos − salários.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <h2 className="font-display text-lg font-semibold leading-none tracking-tight">
              Custos fixos ativos
            </h2>
            <CardDescription>Valores recorrentes da operação.</CardDescription>
          </CardHeader>
          <CardContent>
            {custosFixos.length === 0 ? (
              <div className="flex min-h-32 flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 px-4 py-8 text-center">
                <ReceiptText
                  aria-hidden="true"
                  className="h-7 w-7 text-muted-foreground/50"
                />
                <p className="mt-3 text-sm font-medium">Nenhum custo fixo ativo</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Custos cadastrados pelo professor aparecerão aqui.
                </p>
              </div>
            ) : (
              <>
                <ul className="divide-y">
                  {custosFixos.map((custo) => (
                    <li
                      key={custo.id}
                      className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <span className="text-sm">{custo.descricao}</span>
                      <span className="shrink-0 text-sm font-semibold">
                        {formatCurrency(custo.valor)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex items-center justify-between border-t pt-4 text-sm">
                  <span className="font-medium">Total por aplicação</span>
                  <span className="font-display text-base font-semibold">
                    {formatCurrency(totalCustosFixos)}
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <h2 className="font-display text-lg font-semibold leading-none tracking-tight">
              Extrato
            </h2>
            <CardDescription>
              Últimos lançamentos, do mais recente para o mais antigo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {extrato.length === 0 ? (
              <div className="flex min-h-32 flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 px-4 py-8 text-center">
                <Wallet
                  aria-hidden="true"
                  className="h-7 w-7 text-muted-foreground/50"
                />
                <p className="mt-3 text-sm font-medium">Nenhum lançamento registrado</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Compras, vendas e custos aparecerão aqui conforme forem registrados.
                </p>
              </div>
            ) : (
              <div className="-mx-6 overflow-x-auto">
                <table className="w-full min-w-[34rem] text-sm">
                  <caption className="sr-only">
                    Extrato financeiro da empresa {empresa.nome}
                  </caption>
                  <thead>
                    <tr className="border-y bg-muted/40 text-left">
                      <th scope="col" className="px-6 py-2.5 font-medium">
                        Data
                      </th>
                      <th scope="col" className="px-3 py-2.5 font-medium">
                        Descrição
                      </th>
                      <th scope="col" className="px-3 py-2.5 font-medium">
                        Tipo
                      </th>
                      <th scope="col" className="px-6 py-2.5 text-right font-medium">
                        Valor
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {extrato.map((transacao) => {
                      const entrada = TRANSACAO_SINAL[transacao.tipo] > 0;
                      return (
                        <tr key={transacao.id} className="border-b last:border-0">
                          <td className="whitespace-nowrap px-6 py-3 text-muted-foreground">
                            <time dateTime={transacao.criadoEm.toISOString()}>
                              {formatDate(transacao.criadoEm)}
                            </time>
                          </td>
                          <td className="px-3 py-3">
                            <span className="block font-medium">
                              {transacao.descricao}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              por {transacao.criadoPor.nome}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <Badge variant={TRANSACAO_TIPO_BADGE[transacao.tipo]}>
                              {TRANSACAO_TIPO_LABEL[transacao.tipo]}
                            </Badge>
                          </td>
                          <td
                            className={cn(
                              "whitespace-nowrap px-6 py-3 text-right font-semibold",
                              entrada ? "text-emerald-700" : "text-destructive",
                            )}
                          >
                            {formatarValorTransacao(
                              transacao.tipo,
                              Number(transacao.valor),
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ResumoItem({
  rotulo,
  valor,
  icon: Icon,
  destaque = false,
  tom = "neutro",
}: {
  rotulo: string;
  valor: string;
  icon: LucideIcon;
  destaque?: boolean;
  tom?: "neutro" | "positivo" | "negativo";
}) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-muted/30 p-3",
        destaque && "border-primary/25 bg-secondary/60",
      )}
    >
      <dt className="flex items-center gap-1.5 text-[0.68rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        <Icon aria-hidden="true" className="h-3.5 w-3.5" />
        {rotulo}
      </dt>
      <dd
        className={cn(
          "mt-1.5 font-display text-lg font-semibold tracking-tight",
          tom === "positivo" && "text-emerald-700",
          tom === "negativo" && "text-destructive",
        )}
      >
        {valor}
      </dd>
    </div>
  );
}

function VisaoProfessor() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Financeiro"
        title="Financeiro"
        description="Você está logado como professor. O financeiro é organizado por empresa."
      />
      <Alert variant="info">
        <GraduationCap aria-hidden="true" className="h-4 w-4" />
        <AlertTitle>Visão do professor</AlertTitle>
        <AlertDescription>
          Abra o financeiro das empresas para consultar os saldos. O detalhe de
          receitas, despesas e custos por empresa chega na etapa de gestão.
        </AlertDescription>
      </Alert>
      <Button asChild>
        <Link href="/professor/financeiro">
          Abrir financeiro das empresas
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}
