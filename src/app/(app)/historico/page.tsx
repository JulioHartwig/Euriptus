import type { Metadata } from "next";
import { History } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TRANSACAO_TIPO_LABEL } from "@/lib/financeiro";
import { formatCurrency, formatDate } from "@/lib/utils";
import { requireUser } from "@/server/auth/session";
import { getEmpresaDoUsuario } from "@/server/services/empresa-service";
import { getHistorico } from "@/server/services/historico-service";

export const metadata: Metadata = {
  title: "Histórico",
};

export default async function HistoricoPage() {
  const user = await requireUser();

  if (user.role === "TEACHER" || !user.empresaId) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Histórico"
          title="Histórico"
          description="Linha do tempo de operações da empresa."
        />
        <Alert variant="info">
          <History aria-hidden="true" className="h-4 w-4" />
          <AlertTitle>
            {user.role === "TEACHER"
              ? "Visão do professor"
              : "Sua conta ainda não está vinculada a uma empresa"}
          </AlertTitle>
          <AlertDescription>
            {user.role === "TEACHER"
              ? "Cada estudante acompanha o histórico da sua própria empresa."
              : "Peça ao professor para vincular seu usuário a uma empresa."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const empresa = await getEmpresaDoUsuario(user.id);

  if (!empresa) {
    return null;
  }

  const entradas = await getHistorico(empresa.id);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Histórico"
        title="Histórico de operações"
        description={`Lançamentos financeiros e produção de ${empresa.nome}, com valores, quantidades e autor.`}
      />

      <Card>
        <CardHeader>
          <h2 className="font-display text-lg font-semibold leading-none tracking-tight">
            Linha do tempo
          </h2>
          <p className="text-sm text-muted-foreground">
            {entradas.length} registros mais recentes. Valores positivos entram no
            caixa; negativos saem.
          </p>
        </CardHeader>
        <CardContent>
          {entradas.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma operação registrada ainda.
            </p>
          ) : (
            <ul className="divide-y">
              {entradas.map((entrada) => {
                const rotulo =
                  entrada.tipo === "PRODUCAO"
                    ? "Produção"
                    : TRANSACAO_TIPO_LABEL[
                        entrada.tipo as keyof typeof TRANSACAO_TIPO_LABEL
                      ] ?? entrada.tipo;

                return (
                  <li
                    key={entrada.id}
                    className="grid gap-2 py-4 first:pt-0 last:pb-0 sm:grid-cols-[1fr_auto]"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant={
                            entrada.sinal === 1
                              ? "default"
                              : entrada.sinal === -1
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {rotulo}
                        </Badge>
                        {entrada.rodada && (
                          <span className="text-xs text-muted-foreground">
                            Rodada {entrada.rodada}
                          </span>
                        )}
                      </div>
                      <p className="mt-1.5 truncate text-sm font-medium">
                        {entrada.descricao}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(entrada.criadoEm)} · por {entrada.autor}
                        {entrada.quantidade !== null
                          ? ` · ${entrada.quantidade} un.`
                          : ""}
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p
                        className={
                          entrada.sinal === 1
                            ? "font-display font-semibold text-emerald-700"
                            : entrada.sinal === -1
                              ? "font-display font-semibold text-amber-700"
                              : "font-display font-semibold text-muted-foreground"
                        }
                      >
                        {entrada.valor === null
                          ? "—"
                          : `${entrada.sinal === 1 ? "+ " : entrada.sinal === -1 ? "− " : ""}${formatCurrency(entrada.valor)}`}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
