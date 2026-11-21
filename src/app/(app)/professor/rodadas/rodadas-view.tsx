"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Loader2, Play, Square } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { formatarCompetencia, type RodadaActionState } from "@/lib/rodada";
import { formatDateTime } from "@/lib/utils";

import { abrirRodadaAction, fecharRodadaAction } from "./actions";

type RodadaRow = {
  id: string;
  numero: number;
  competencia: string | null;
  status: "ABERTA" | "FECHADA";
  abertaEm: string;
  abertaPor: string;
  fechadaEm: string | null;
  fechadaPor: string | null;
  transacoes: number;
};

const idle: RodadaActionState = { status: "idle" };

export function RodadasView({ rodadas }: { rodadas: RodadaRow[] }) {
  const router = useRouter();
  const [sAbrir, aAbrir, pAbrir] = useActionState(abrirRodadaAction, idle);
  const [sFechar, aFechar, pFechar] = useActionState(fecharRodadaAction, idle);

  useEffect(() => {
    for (const s of [sAbrir, sFechar]) {
      if (s.status === "success") { toast.success(s.message); router.refresh(); }
      else if (s.status === "error") { toast.error(s.message); }
    }
  }, [sAbrir, sFechar, router]);

  const aberta = rodadas.find((r) => r.status === "ABERTA") ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Professor"
        title="Rodadas"
        description="Cada rodada representa um mês. Abra e feche rodadas para processar o período."
        actions={
          <div className="flex gap-2">
            {!aberta ? (
              <form action={aAbrir}>
                <Button type="submit" disabled={pAbrir}>
                  {pAbrir ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  Abrir rodada
                </Button>
              </form>
            ) : (
              <form action={aFechar}>
                <Button type="submit" variant="destructive" disabled={pFechar}>
                  {pFechar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Square className="h-4 w-4" />}
                  Fechar {formatarCompetencia(
                    aberta.competencia ? new Date(aberta.competencia) : null,
                    aberta.numero,
                  )}
                </Button>
              </form>
            )}
          </div>
        }
      />

      <Alert variant="info">
        <CalendarClock aria-hidden="true" className="h-4 w-4" />
        <AlertTitle>Processamento ao fechar</AlertTitle>
        <AlertDescription>
          Cada rodada equivale a um mês (competência). Ao fechar, são aplicados por empresa: custos
          fixos ativos (despesa), salário mínimo (salário), imposto sobre receitas da rodada e
          pagamento automático das parcelas de empréstimo vencidas no mês quando houver saldo.
          Lançamentos são vinculados à rodada e registram autoria do professor.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <h2 className="font-display text-lg font-semibold leading-none tracking-tight">Histórico de rodadas</h2>
          <CardDescription>Mais recentes primeiro.</CardDescription>
        </CardHeader>
        <CardContent>
          {rodadas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma rodada criada ainda.</p>
          ) : (
            <ul className="divide-y">
              {rodadas.map((r) => (
                <li key={r.id} className="flex flex-wrap items-start justify-between gap-3 py-4 first:pt-0 last:pb-0">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        Rodada {r.numero} ·{" "}
                        {formatarCompetencia(
                          r.competencia ? new Date(r.competencia) : null,
                          r.numero,
                        )}
                      </span>
                      <Badge variant={r.status === "ABERTA" ? "default" : "secondary"}>
                        {r.status === "ABERTA" ? "Aberta" : "Fechada"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Aberta em {formatDateTime(r.abertaEm)} por {r.abertaPor}
                      {r.fechadaEm ? ` · Fechada em ${formatDateTime(r.fechadaEm)}${r.fechadaPor ? ` por ${r.fechadaPor}` : ""}` : ""}
                    </p>
                  </div>
                  <Badge variant="outline">{r.transacoes} lançamentos vinculados</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
