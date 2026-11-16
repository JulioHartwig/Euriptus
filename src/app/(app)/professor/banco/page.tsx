import type { Metadata } from "next";
import Link from "next/link";
import { Landmark } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EMPRESA_TIPO_LABEL } from "@/lib/empresa";
import { formatCurrency } from "@/lib/utils";
import { requireTeacher } from "@/server/auth/session";
import { getBancoConsolidado } from "@/server/services/empresa-admin-service";

export const metadata: Metadata = { title: "Banco das empresas" };

export default async function ProfessorBancoPage() {
  await requireTeacher();
  const empresas = await getBancoConsolidado();

  const totais = empresas.reduce(
    (acc, e) => {
      const divida = e.emprestimos.reduce((s, x) => s + Number(x.totalDevido), 0);
      const investido = e.investimentos.reduce((s, x) => s + Number(x.valorAplicado), 0);
      acc.divida += divida;
      acc.investido += investido;
      acc.emprestimos += e.emprestimos.length;
      acc.investimentos += e.investimentos.length;
      return acc;
    },
    { divida: 0, investido: 0, emprestimos: 0, investimentos: 0 },
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Área do professor"
        title="Banco das empresas"
        description="Visão consolidada de empréstimos e investimentos ativos por empresa."
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Dívida ativa total</CardTitle></CardHeader><CardContent><p className="font-display text-2xl font-semibold">{formatCurrency(totais.divida)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Investido total</CardTitle></CardHeader><CardContent><p className="font-display text-2xl font-semibold">{formatCurrency(totais.investido)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Contratos de empréstimo</CardTitle></CardHeader><CardContent><p className="font-display text-2xl font-semibold">{totais.emprestimos}</p><p className="text-xs text-muted-foreground">Ativos</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Aplicações</CardTitle></CardHeader><CardContent><p className="font-display text-2xl font-semibold">{totais.investimentos}</p><p className="text-xs text-muted-foreground">Ativas</p></CardContent></Card>
      </section>

      <Card>
        <CardHeader>
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold leading-none tracking-tight"><Landmark className="h-4 w-4" />Situação por empresa</h2>
          <CardDescription>Empréstimos e investimentos ativos consolidados.</CardDescription>
        </CardHeader>
        <CardContent>
          {empresas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma empresa cadastrada.</p>
          ) : (
            <div className="-mx-6 overflow-x-auto">
              <table className="w-full min-w-[44rem] text-sm">
                <thead>
                  <tr className="border-y bg-muted/40 text-left">
                    <th className="px-6 py-2.5 font-medium">Empresa</th>
                    <th className="px-3 py-2.5 font-medium">Etapa</th>
                    <th className="px-3 py-2.5 text-right font-medium">Saldo</th>
                    <th className="px-3 py-2.5 text-right font-medium">Dívida ativa</th>
                    <th className="px-3 py-2.5 text-right font-medium">Investido ativo</th>
                    <th className="px-3 py-2.5 text-right font-medium">Contratos</th>
                    <th className="px-6 py-2.5 text-right font-medium">Detalhes</th>
                  </tr>
                </thead>
                <tbody>
                  {empresas.map((e) => {
                    const divida = e.emprestimos.reduce((s, x) => s + Number(x.totalDevido), 0);
                    const investido = e.investimentos.reduce((s, x) => s + Number(x.valorAplicado), 0);
                    return (
                      <tr key={e.id} className="border-b last:border-0">
                        <td className="px-6 py-3 font-medium">{e.nome}</td>
                        <td className="px-3 py-3"><Badge variant="outline">{EMPRESA_TIPO_LABEL[e.tipo]}</Badge></td>
                        <td className="whitespace-nowrap px-3 py-3 text-right">{formatCurrency(e.saldo)}</td>
                        <td className="whitespace-nowrap px-3 py-3 text-right font-medium text-destructive">{formatCurrency(divida)}</td>
                        <td className="whitespace-nowrap px-3 py-3 text-right font-medium text-emerald-700 dark:text-emerald-400">{formatCurrency(investido)}</td>
                        <td className="px-3 py-3 text-right text-muted-foreground">{e.emprestimos.length} emp. · {e.investimentos.length} inv.</td>
                        <td className="px-6 py-3 text-right"><Link href={`/professor/empresas/${e.id}`} className="text-primary underline-offset-4 hover:underline">Ver empresa</Link></td>
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
  );
}
