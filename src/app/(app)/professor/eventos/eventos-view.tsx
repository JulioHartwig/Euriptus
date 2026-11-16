"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateTime } from "@/lib/utils";

import { dispararEventoAction, removerTemplateAction, salvarTemplateAction, type EventoActionState } from "./actions";

type Template = { id: string; titulo: string; descricao: string; tipoNoticia: "MERCADO" | "EVENTO" | "AVISO"; impactoTexto: string | null; ativo: boolean; disparos: number };
type Disparo = { id: string; template: string; rodada: number | null; disparadoEm: string; autor: string; noticia: string | null };
const idle: EventoActionState = { status: "idle" };

export function EventosView({ templates, disparos }: { templates: Template[]; disparos: Disparo[] }) {
  const router = useRouter();
  const [edit, setEdit] = useState<Template | null>(null);
  const [s, a, p] = useActionState(salvarTemplateAction, idle);
  const [ds, da] = useActionState(async (_: EventoActionState, fd: FormData) => removerTemplateAction(fd), idle);
  const [ts, ta] = useActionState(async (_: EventoActionState, fd: FormData) => dispararEventoAction(fd), idle);

  useEffect(() => {
    for (const st of [s, ds, ts]) {
      if (st.status === "success") { toast.success(st.message); setEdit(null); router.refresh(); }
      else if (st.status === "error") toast.error(st.message);
    }
  }, [s, ds, ts, router]);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Professor" title="Eventos econômicos" description="Cadastre templates pré-registrados e dispare eventos para o simulador." />

      <Alert variant="info">
        <Send aria-hidden="true" className="h-4 w-4" />
        <AlertTitle>Disparo e notícia automática</AlertTitle>
        <AlertDescription>
          Ao disparar um template ativo, o evento é registrado (com autor e rodada atual, se houver) e uma notícia é publicada automaticamente no painel dos estudantes.
          Nesta etapa, efeitos econômicos automáticos sobre saldos/preços são simplificados; ajuste parâmetros ou catálogo manualmente quando necessário.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <h2 className="font-display text-lg font-semibold leading-none tracking-tight">{edit ? "Editar template" : "Novo template"}</h2>
          <CardDescription>Templates pré-registrados para disparo rápido.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={a} className="grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="id" value={edit?.id ?? ""} />
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="titulo">Título</Label><Input id="titulo" name="titulo" defaultValue={edit?.titulo ?? ""} required minLength={3} /></div>
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="descricao">Descrição (corpo da notícia)</Label><textarea id="descricao" name="descricao" defaultValue={edit?.descricao ?? ""} required minLength={10} className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></div>
            <div className="space-y-2"><Label htmlFor="tipoNoticia">Tipo de notícia</Label><select id="tipoNoticia" name="tipoNoticia" defaultValue={edit?.tipoNoticia ?? "EVENTO"} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="EVENTO">Evento</option><option value="MERCADO">Mercado</option><option value="AVISO">Aviso</option></select></div>
            <div className="space-y-2"><Label htmlFor="impactoTexto">Impacto (opcional)</Label><Input id="impactoTexto" name="impactoTexto" defaultValue={edit?.impactoTexto ?? ""} placeholder="Ex.: revisar custos nesta rodada" /></div>
            <div className="flex items-end gap-2 pb-2 sm:col-span-2"><input id="ativo" name="ativo" type="checkbox" defaultChecked={edit ? edit.ativo : true} className="h-4 w-4" /><Label htmlFor="ativo">Template ativo (pode ser disparado)</Label></div>
            <div className="flex gap-2 sm:col-span-2"><Button type="submit" disabled={p}>{p ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}{edit ? "Salvar template" : "Criar template"}</Button>{edit && <Button type="button" variant="outline" onClick={() => setEdit(null)}>Cancelar</Button>}</div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><h2 className="font-display text-lg font-semibold leading-none tracking-tight">Templates</h2><CardDescription>{templates.length} cadastrados.</CardDescription></CardHeader>
          <CardContent>
            {templates.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum template.</p> : (
              <ul className="space-y-3">
                {templates.map((t) => (
                  <li key={t.id} className="rounded-lg border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2"><span className="font-medium">{t.titulo}</span><Badge variant={t.ativo ? "default" : "secondary"}>{t.ativo ? "Ativo" : "Inativo"}</Badge><Badge variant="outline">{t.tipoNoticia}</Badge></div>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{t.descricao}</p>
                        {t.impactoTexto && <p className="mt-1 text-xs text-muted-foreground">Impacto: {t.impactoTexto}</p>}
                        <p className="mt-1 text-xs text-muted-foreground">{t.disparos} disparo(s)</p>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <form action={ta}><input type="hidden" name="templateId" value={t.id} /><Button type="submit" size="sm" disabled={!t.ativo}><Send className="h-4 w-4" />Disparar</Button></form>
                        <Button type="button" size="sm" variant="outline" onClick={() => setEdit(t)}><Pencil className="h-4 w-4" />Editar</Button>
                        <form action={da}><input type="hidden" name="id" value={t.id} /><Button type="submit" size="sm" variant="destructive"><Trash2 className="h-4 w-4" />Remover</Button></form>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h2 className="font-display text-lg font-semibold leading-none tracking-tight">Eventos disparados</h2><CardDescription>Histórico recente (até 50).</CardDescription></CardHeader>
          <CardContent>
            {disparos.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum evento disparado.</p> : (
              <ul className="space-y-3">
                {disparos.map((d) => (
                  <li key={d.id} className="rounded-lg border p-3 text-sm">
                    <div className="flex flex-wrap items-center gap-2"><span className="font-medium">{d.template}</span>{d.rodada != null && <Badge variant="outline">Rodada {d.rodada}</Badge>}</div>
                    <p className="mt-1 text-muted-foreground">{formatDateTime(d.disparadoEm)} · por {d.autor}</p>
                    {d.noticia && <p className="mt-1 text-xs text-muted-foreground">Notícia: {d.noticia}</p>}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
