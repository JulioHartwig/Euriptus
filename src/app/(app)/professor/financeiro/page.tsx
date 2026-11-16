import type { Metadata } from "next";
import Link from "next/link";
import { Info } from "lucide-react";

import { EmpresaIcon } from "@/components/empresa-icon";
import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { EMPRESA_TIPO_LABEL, EMPRESA_TIPOS } from "@/lib/empresa";
import { formatCurrency } from "@/lib/utils";
import { requireTeacher } from "@/server/auth/session";
import { listEmpresasComEstudantes } from "@/server/repositories/empresa-repository";

export const metadata: Metadata = {
  title: "Financeiro das empresas",
};

export default async function ProfessorFinanceiroPage() {
  await requireTeacher();

  const empresas = await listEmpresasComEstudantes();
  const empresasOrdenadas = [...empresas].sort(
    (a, b) => EMPRESA_TIPOS.indexOf(a.tipo) - EMPRESA_TIPOS.indexOf(b.tipo),
  );
  const saldoTotal = empresas.reduce(
    (total, empresa) => total + Number(empresa.saldo),
    0,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Área do professor"
        title="Financeiro das empresas"
        description="Visão consolidada dos saldos das empresas da cadeia. O detalhe financeiro por empresa chega na etapa de gestão."
        actions={
          <Badge variant="outline" className="bg-card px-3 py-1.5">
            Saldo somado: {formatCurrency(saldoTotal)}
          </Badge>
        }
      />

      <Card>
        <CardHeader>
          <h2 className="font-display text-lg font-semibold leading-none tracking-tight">
            Empresas cadastradas
          </h2>
          <CardDescription>
            {empresas.length}{" "}
            {empresas.length === 1 ? "empresa na cadeia" : "empresas na cadeia"}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {empresasOrdenadas.length === 0 ? (
            <div className="flex min-h-32 flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 px-4 py-8 text-center">
              <p className="text-sm font-medium">Nenhuma empresa cadastrada</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Rode o seed de desenvolvimento para criar as empresas da cadeia.
              </p>
            </div>
          ) : (
            <div className="-mx-6 overflow-x-auto">
              <table className="w-full min-w-[30rem] text-sm">
                <caption className="sr-only">
                  Empresas da cadeia e seus saldos atuais
                </caption>
                <thead>
                  <tr className="border-y bg-muted/40 text-left">
                    <th scope="col" className="px-6 py-2.5 font-medium">
                      Empresa
                    </th>
                    <th scope="col" className="px-3 py-2.5 font-medium">
                      Etapa
                    </th>
                    <th scope="col" className="px-3 py-2.5 text-right font-medium">
                      Estudantes
                    </th>
                    <th scope="col" className="px-6 py-2.5 text-right font-medium">
                      Saldo atual
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {empresasOrdenadas.map((empresa) => (
                    <tr key={empresa.id} className="border-b last:border-0">
                      <td className="px-6 py-3">
                        <span className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
                            <EmpresaIcon tipo={empresa.tipo} className="h-4 w-4" />
                          </span>
                          <span className="font-medium">{empresa.nome}</span>
                        </span>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">
                        {EMPRESA_TIPO_LABEL[empresa.tipo]}
                      </td>
                      <td className="px-3 py-3 text-right text-muted-foreground">
                        {empresa._count.usuarios}
                      </td>
                      <td className="whitespace-nowrap px-6 py-3 text-right font-semibold">
                        {formatCurrency(empresa.saldo)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Alert variant="info">
        <Info aria-hidden="true" className="h-4 w-4" />
        <AlertTitle>Detalhe por empresa</AlertTitle>
        <AlertDescription>
          Para ver extrato, estoque, banco e negociações de cada empresa, acesse{" "}
          <Link href="/professor/empresas" className="font-medium underline underline-offset-4">
            Empresas
          </Link>{" "}
          e abra os detalhes.
        </AlertDescription>
      </Alert>
    </div>
  );
}
