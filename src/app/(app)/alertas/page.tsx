import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronRight,
  Info,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { requireUser } from "@/server/auth/session";
import { getAlertas, type Alerta } from "@/server/services/alertas-service";

export const metadata: Metadata = {
  title: "Alertas",
};

const SEVERIDADE: Record<
  Alerta["severidade"],
  { label: string; variant: "destructive" | "outline" | "secondary"; icon: typeof Bell }
> = {
  urgente: { label: "Urgente", variant: "destructive", icon: AlertTriangle },
  atencao: { label: "Atenção", variant: "outline", icon: AlertTriangle },
  info: { label: "Informativo", variant: "secondary", icon: Info },
};

export default async function AlertasPage() {
  const user = await requireUser();
  const alertas = await getAlertas({
    id: user.id,
    role: user.role,
    empresaId: user.empresaId,
    empresaTipo: user.empresa?.tipo ?? null,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Alertas"
        title="Central de alertas"
        description="Pendências e avisos calculados a partir do estado atual do simulador."
      />

      <Card>
        <CardHeader>
          <h2 className="font-display text-lg font-semibold leading-none tracking-tight">
            {alertas.length === 0
              ? "Tudo em dia"
              : `${alertas.length} ${alertas.length === 1 ? "alerta" : "alertas"}`}
          </h2>
        </CardHeader>
        <CardContent>
          {alertas.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 px-4 py-10 text-center">
              <CheckCircle2
                aria-hidden="true"
                className="h-8 w-8 text-emerald-600"
              />
              <p className="mt-3 text-sm font-medium">Nenhum alerta no momento</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Novos alertas aparecem automaticamente conforme as operações
                acontecem.
              </p>
            </div>
          ) : (
            <ul className="divide-y">
              {alertas.map((alerta) => {
                const config = SEVERIDADE[alerta.severidade];
                const Icon = config.icon;

                return (
                  <li
                    key={alerta.id}
                    className="flex flex-wrap items-start justify-between gap-3 py-4 first:pt-0 last:pb-0"
                  >
                    <div className="flex min-w-0 gap-3">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Icon aria-hidden="true" className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{alerta.titulo}</p>
                          <Badge variant={config.variant}>{config.label}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {alerta.descricao}
                        </p>
                      </div>
                    </div>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={alerta.href}>
                        Abrir
                        <ChevronRight aria-hidden="true" className="h-4 w-4" />
                      </Link>
                    </Button>
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
