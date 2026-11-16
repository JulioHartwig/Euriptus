"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { salvarParametroAction, type AdminActionState } from "./actions";

const idle: AdminActionState = { status: "idle" };

export function ParametrosView({ parametros }: { parametros: { nome: string; valor: number; descricao: string }[] }) {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Professor" title="Parâmetros econômicos" description="Edite taxas e valores globais usados pelo simulador." />
      <div className="grid gap-4">
        {parametros.map((p) => <ParametroCard key={p.nome} p={p} />)}
      </div>
    </div>
  );
}

function ParametroCard({ p }: { p: { nome: string; valor: number; descricao: string } }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(salvarParametroAction, idle);
  useEffect(() => {
    if (state.status === "success") { toast.success(state.message); router.refresh(); }
    else if (state.status === "error") toast.error(state.message);
  }, [state, router]);

  return (
    <Card>
      <CardHeader>
        <h2 className="font-display text-lg font-semibold leading-none tracking-tight">{p.nome}</h2>
        <CardDescription>Valor atual: {p.valor}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="nome" value={p.nome} />
          <div className="space-y-2">
            <Label>Valor</Label>
            <Input name="valor" type="number" step="0.0001" defaultValue={p.valor} required />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Descrição</Label>
            <Input name="descricao" defaultValue={p.descricao} required />
          </div>
          <div><Button type="submit" disabled={pending}>{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Salvar</Button></div>
        </form>
      </CardContent>
    </Card>
  );
}
