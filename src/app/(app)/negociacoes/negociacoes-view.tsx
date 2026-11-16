"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Handshake, Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PROPOSTA_STATUS_BADGE, PROPOSTA_STATUS_LABEL, type NegociacaoActionState } from "@/lib/negociacao";
import { formatCurrency, formatDateTime } from "@/lib/utils";

import {
  aceitarPropostaAction,
  cancelarPropostaAction,
  criarPropostaAction,
  recusarPropostaAction,
} from "./actions";

type Destino = { id: string; nome: string; tipo: string };
type EstoqueOpt = { catalogoItemId: string; quantidade: number; nome: string; unidade: string };
type PropostaView = {
  id: string;
  empresaOrigemId: string;
  origem: string;
  destino: string;
  item: string;
  unidade: string;
  quantidade: number;
  valorTotal: number;
  mensagem: string | null;
  status: "PENDENTE" | "ACEITA" | "RECUSADA" | "CANCELADA";
  criadoEm: string;
  criadoPor: string;
  respondidoPor: string | null;
};

const idle: NegociacaoActionState = { status: "idle" };

export function NegociacoesView({
  minhaEmpresaId,
  empresaNome,
  saldo,
  destinos,
  estoque,
  propostas,
}: {
  minhaEmpresaId: string;
  empresaNome: string;
  saldo: number;
  destinos: Destino[];
  estoque: EstoqueOpt[];
  propostas: PropostaView[];
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Negociações"
        title="Negociações"
        description={`Propostas formais entre empresas. Você representa ${empresaNome}.`}
      />

      <Alert variant="info">
        <Handshake aria-hidden="true" className="h-4 w-4" />
        <AlertTitle>Como funciona</AlertTitle>
        <AlertDescription>
          Envie uma oferta para vender um item do seu estoque a outra empresa por um valor acordado. A destinatária pode aceitar (transferindo itens e valores, se houver saldo/estoque) ou recusar. Toda ação registra autoria. Sem troca ou reembolso.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <h2 className="font-display text-lg font-semibold leading-none tracking-tight">Nova proposta</h2>
          <CardDescription>Ofereça itens do seu estoque para outra empresa. Saldo atual: {formatCurrency(saldo)}.</CardDescription>
        </CardHeader>
        <CardContent>
          {estoque.length === 0 || destinos.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {estoque.length === 0
                ? "Você precisa ter itens em estoque (comprados no Mercado) para enviar propostas."
                : "Não há outras empresas cadastradas."}
            </p>
          ) : (
            <NovaPropostaForm destinos={destinos} estoque={estoque} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-display text-lg font-semibold leading-none tracking-tight">Propostas enviadas e recebidas</h2>
          <CardDescription>Mais recentes primeiro.</CardDescription>
        </CardHeader>
        <CardContent>
          {propostas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma proposta ainda.</p>
          ) : (
            <ul className="divide-y">
              {propostas.map((p) => (
                <PropostaItem key={p.id} p={p} minhaEmpresaId={minhaEmpresaId} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function NovaPropostaForm({ destinos, estoque }: { destinos: Destino[]; estoque: EstoqueOpt[] }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(criarPropostaAction, idle);

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message);
      router.refresh();
    } else if (state.status === "error") {
      toast.error(state.message);
    }
  }, [state, router]);

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="empresaDestinoId">Empresa destinatária</Label>
        <select id="empresaDestinoId" name="empresaDestinoId" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
          <option value="">Selecione...</option>
          {destinos.map((d) => (
            <option key={d.id} value={d.id}>{d.nome}</option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="catalogoItemId">Item do seu estoque</Label>
        <select id="catalogoItemId" name="catalogoItemId" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
          <option value="">Selecione...</option>
          {estoque.map((e) => (
            <option key={e.catalogoItemId} value={e.catalogoItemId}>
              {e.nome} (disponível: {e.quantidade} {e.unidade})
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="quantidade">Quantidade</Label>
        <Input id="quantidade" name="quantidade" type="number" min={1} step={1} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="valorTotal">Valor total (R$)</Label>
        <Input id="valorTotal" name="valorTotal" type="number" min="0.01" step="0.01" required />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="mensagem">Mensagem (opcional)</Label>
        <Input id="mensagem" name="mensagem" maxLength={280} placeholder="Ex.: oferta para entrega imediata" />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Enviar proposta
        </Button>
      </div>
    </form>
  );
}

function PropostaItem({ p, minhaEmpresaId }: { p: PropostaView; minhaEmpresaId: string }) {
  const router = useRouter();
  const [s1, a1, pend1] = useActionState(aceitarPropostaAction, idle);
  const [s2, a2, pend2] = useActionState(recusarPropostaAction, idle);
  const [s3, a3, pend3] = useActionState(cancelarPropostaAction, idle);
  useEffect(() => {
    for (const s of [s1, s2, s3]) {
      if (s.status === "success") { toast.success(s.message); router.refresh(); }
      else if (s.status === "error") { toast.error(s.message); }
    }
  }, [s1, s2, s3, router]);

  const souOrigem = p.empresaOrigemId === minhaEmpresaId;
  const souDestino = !souOrigem;
  const pendente = p.status === "PENDENTE";

  return (
    <li className="space-y-3 py-4 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{p.item}</span>
            <Badge variant={PROPOSTA_STATUS_BADGE[p.status]}>{PROPOSTA_STATUS_LABEL[p.status]}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {p.origem} → {p.destino} · {p.quantidade} {p.unidade} por {formatCurrency(p.valorTotal)}
          </p>
          {p.mensagem ? <p className="mt-1 text-sm">“{p.mensagem}”</p> : null}
          <p className="mt-1 text-xs text-muted-foreground">
            Criada em {formatDateTime(p.criadoEm)} por {p.criadoPor}
            {p.respondidoPor ? ` · Respondida por ${p.respondidoPor}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {pendente && souDestino && (
            <>
              <form action={a1}><input type="hidden" name="propostaId" value={p.id} /><Button type="submit" size="sm" disabled={pend1 || pend2}>Aceitar</Button></form>
              <form action={a2}><input type="hidden" name="propostaId" value={p.id} /><Button type="submit" size="sm" variant="outline" disabled={pend1 || pend2}>Recusar</Button></form>
            </>
          )}
          {pendente && souOrigem && (
            <form action={a3}><input type="hidden" name="propostaId" value={p.id} /><Button type="submit" size="sm" variant="outline" disabled={pend3}>Cancelar</Button></form>
          )}
        </div>
      </div>
    </li>
  );
}
