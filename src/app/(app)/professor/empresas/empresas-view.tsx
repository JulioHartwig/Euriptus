"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EMPRESA_TIPO_LABEL } from "@/lib/empresa";
import { formatCurrency } from "@/lib/utils";

import { removerEmpresaAction, salvarEmpresaAction } from "./actions";

type EmpresaRow = {
  id: string;
  nome: string;
  tipo: "PRODUTOR" | "LOGISTICA" | "BENEFICIAMENTO" | "VENDA";
  saldo: number;
  usuarios: number;
  createdAt: string;
};

type State = { status: "idle" } | { status: "success"; message: string; submittedAt: number } | { status: "error"; message: string; submittedAt: number };
const idle: State = { status: "idle" };

export function EmpresasAdminView({ empresas }: { empresas: EmpresaRow[] }) {
  const router = useRouter();
  const [edit, setEdit] = useState<EmpresaRow | null>(null);
  const [s, a, p] = useActionState(salvarEmpresaAction, idle);
  const [ds, da] = useActionState(async (_: State, fd: FormData) => removerEmpresaAction(fd), idle);

  useEffect(() => {
    for (const st of [s, ds]) {
      if (st.status === "success") { toast.success(st.message); setEdit(null); router.refresh(); }
      else if (st.status === "error") toast.error(st.message);
    }
  }, [s, ds, router]);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Professor" title="Empresas" description="Cadastre, edite e gerencie as empresas da cadeia produtiva." />

      <Card>
        <CardHeader>
          <h2 className="font-display text-lg font-semibold leading-none tracking-tight">{edit ? "Editar empresa" : "Nova empresa"}</h2>
          <CardDescription>Defina nome, etapa e saldo inicial/atual da empresa.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={a} className="grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="id" value={edit?.id ?? ""} />
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" name="nome" defaultValue={edit?.nome ?? ""} required minLength={3} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo">Etapa</Label>
              <select id="tipo" name="tipo" defaultValue={edit?.tipo ?? "PRODUTOR"} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="PRODUTOR">Produtor</option>
                <option value="LOGISTICA">Logística</option>
                <option value="BENEFICIAMENTO">Beneficiamento</option>
                <option value="VENDA">Venda</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="saldo">Saldo (R$)</Label>
              <Input id="saldo" name="saldo" type="number" step="0.01" min="0" defaultValue={edit?.saldo ?? 0} required />
            </div>
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" disabled={p}>{p ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}{edit ? "Salvar alterações" : "Criar empresa"}</Button>
              {edit && <Button type="button" variant="outline" onClick={() => setEdit(null)}>Cancelar</Button>}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-display text-lg font-semibold leading-none tracking-tight">Empresas cadastradas</h2>
          <CardDescription>{empresas.length} empresas.</CardDescription>
        </CardHeader>
        <CardContent>
          {empresas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma empresa cadastrada.</p>
          ) : (
            <ul className="divide-y">
              {empresas.map((e) => (
                <li key={e.id} className="flex flex-wrap items-start justify-between gap-3 py-4 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{e.nome}</span>
                      <Badge variant="outline">{EMPRESA_TIPO_LABEL[e.tipo]}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Saldo: {formatCurrency(e.saldo)} · {e.usuarios} usuário(s)
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button asChild size="sm" variant="outline"><Link href={`/professor/empresas/${e.id}`}><Eye className="h-4 w-4" />Detalhes</Link></Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setEdit(e)}><Pencil className="h-4 w-4" />Editar</Button>
                    <form action={da}><input type="hidden" name="id" value={e.id} /><Button type="submit" size="sm" variant="destructive"><Trash2 className="h-4 w-4" />Remover</Button></form>
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
