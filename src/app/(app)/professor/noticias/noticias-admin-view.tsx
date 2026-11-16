"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { alternarNoticiaAction, removerNoticiaAction, salvarNoticiaAction, type AdminActionState } from "./actions";

type Noticia = { id: string; titulo: string; corpo: string; tipo: "MERCADO" | "EVENTO" | "AVISO"; ativa: boolean; criadoEm: string };
const idle: AdminActionState = { status: "idle" };

export function NoticiasAdminView({ noticias }: { noticias: Noticia[] }) {
  const router = useRouter();
  const [editando, setEditando] = useState<Noticia | null>(null);
  const [state, action, pending] = useActionState(salvarNoticiaAction, idle);
  const [delState, delAction] = useActionState(async (_s: AdminActionState, fd: FormData) => removerNoticiaAction(fd), idle);
  const [togState, togAction] = useActionState(async (_s: AdminActionState, fd: FormData) => alternarNoticiaAction(fd), idle);

  useEffect(() => {
    for (const s of [state, delState, togState]) {
      if (s.status === "success") { toast.success(s.message); setEditando(null); router.refresh(); }
      else if (s.status === "error") toast.error(s.message);
    }
  }, [state, delState, togState, router]);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Professor" title="Gerenciar notícias" description="Crie, edite, ative/desative e remova notícias do mercado." />

      <Card>
        <CardHeader>
          <h2 className="font-display text-lg font-semibold leading-none tracking-tight">{editando ? "Editar notícia" : "Nova notícia"}</h2>
          <CardDescription>Notícias são globais e aparecem no painel dos estudantes quando ativas.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className="grid gap-4">
            <input type="hidden" name="id" value={editando?.id ?? ""} />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="titulo">Título</Label>
                <Input id="titulo" name="titulo" defaultValue={editando?.titulo ?? ""} required minLength={3} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="corpo">Conteúdo</Label>
                <textarea id="corpo" name="corpo" defaultValue={editando?.corpo ?? ""} required minLength={10} className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo</Label>
                <select id="tipo" name="tipo" defaultValue={editando?.tipo ?? "MERCADO"} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="MERCADO">Mercado</option>
                  <option value="EVENTO">Evento</option>
                  <option value="AVISO">Aviso</option>
                </select>
              </div>
              <div className="flex items-end gap-2 pb-2">
                <input id="ativa" name="ativa" type="checkbox" defaultChecked={editando ? editando.ativa : true} className="h-4 w-4" />
                <Label htmlFor="ativa">Ativa (visível aos estudantes)</Label>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={pending}>{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}{editando ? "Salvar alterações" : "Criar notícia"}</Button>
              {editando && <Button type="button" variant="outline" onClick={() => setEditando(null)}>Cancelar edição</Button>}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-display text-lg font-semibold leading-none tracking-tight">Notícias cadastradas</h2>
          <CardDescription>{noticias.length} no total.</CardDescription>
        </CardHeader>
        <CardContent>
          {noticias.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma notícia.</p> : (
            <ul className="space-y-3">
              {noticias.map((n) => (
                <li key={n.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{n.titulo}</span>
                        <Badge variant={n.ativa ? "default" : "secondary"}>{n.ativa ? "Ativa" : "Inativa"}</Badge>
                        <Badge variant="outline">{n.tipo}</Badge>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{n.corpo}</p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => setEditando(n)}><Pencil className="h-4 w-4" />Editar</Button>
                      <form action={togAction}><input type="hidden" name="id" value={n.id} /><input type="hidden" name="ativa" value={String(!n.ativa)} /><Button type="submit" size="sm" variant="outline">{n.ativa ? "Desativar" : "Ativar"}</Button></form>
                      <form action={delAction}><input type="hidden" name="id" value={n.id} /><Button type="submit" size="sm" variant="destructive"><Trash2 className="h-4 w-4" />Remover</Button></form>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
