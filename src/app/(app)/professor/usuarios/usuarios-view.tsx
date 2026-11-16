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

import { removerUsuarioAction, salvarUsuarioAction } from "./actions";

type Usuario = { id: string; nome: string; email: string; role: "STUDENT" | "TEACHER"; empresaId: string | null; empresaNome: string | null };
type EmpresaOpt = { id: string; nome: string };
type State = { status: "idle" } | { status: "success"; message: string; submittedAt: number } | { status: "error"; message: string; submittedAt: number };
const idle: State = { status: "idle" };

export function UsuariosAdminView({ usuarios, empresas }: { usuarios: Usuario[]; empresas: EmpresaOpt[] }) {
  const router = useRouter();
  const [edit, setEdit] = useState<Usuario | null>(null);
  const [role, setRole] = useState<"STUDENT" | "TEACHER">(edit?.role ?? "STUDENT");
  const [s, a, p] = useActionState(salvarUsuarioAction, idle);
  const [ds, da] = useActionState(async (_: State, fd: FormData) => removerUsuarioAction(fd), idle);

  useEffect(() => { setRole(edit?.role ?? "STUDENT"); }, [edit]);
  useEffect(() => {
    for (const st of [s, ds]) {
      if (st.status === "success") { toast.success(st.message); setEdit(null); router.refresh(); }
      else if (st.status === "error") toast.error(st.message);
    }
  }, [s, ds, router]);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Professor" title="Usuários" description="Gerencie contas de professores e estudantes. Estudantes devem estar vinculados a uma empresa." />

      <Card>
        <CardHeader>
          <h2 className="font-display text-lg font-semibold leading-none tracking-tight">{edit ? "Editar usuário" : "Novo usuário"}</h2>
          <CardDescription>{edit ? "Deixe a senha em branco para manter a atual." : "Defina uma senha inicial (mínimo 6 caracteres)."}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={a} className="grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="id" value={edit?.id ?? ""} />
            <div className="space-y-2"><Label htmlFor="nome">Nome</Label><Input id="nome" name="nome" defaultValue={edit?.nome ?? ""} required minLength={3} /></div>
            <div className="space-y-2"><Label htmlFor="email">E-mail</Label><Input id="email" name="email" type="email" defaultValue={edit?.email ?? ""} required /></div>
            <div className="space-y-2">
              <Label htmlFor="role">Perfil</Label>
              <select id="role" name="role" value={role} onChange={(e) => setRole(e.target.value as "STUDENT" | "TEACHER")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="STUDENT">Estudante</option>
                <option value="TEACHER">Professor</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="empresaId">Empresa</Label>
              <select id="empresaId" name="empresaId" defaultValue={edit?.empresaId ?? ""} disabled={role === "TEACHER"} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-60">
                <option value="">{role === "TEACHER" ? "Sem empresa (professor)" : "Selecione uma empresa"}</option>
                {empresas.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
              </select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="senha">Senha {edit ? "(opcional para redefinir)" : ""}</Label>
              <Input id="senha" name="senha" type="password" minLength={edit ? undefined : 6} placeholder={edit ? "Deixe em branco para manter" : "Mínimo 6 caracteres"} />
            </div>
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" disabled={p}>{p ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}{edit ? "Salvar alterações" : "Criar usuário"}</Button>
              {edit && <Button type="button" variant="outline" onClick={() => setEdit(null)}>Cancelar</Button>}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-display text-lg font-semibold leading-none tracking-tight">Usuários cadastrados</h2>
          <CardDescription>{usuarios.length} usuários.</CardDescription>
        </CardHeader>
        <CardContent>
          {usuarios.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum usuário.</p>
          ) : (
            <ul className="divide-y">
              {usuarios.map((u) => (
                <li key={u.id} className="flex flex-wrap items-start justify-between gap-3 py-4 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{u.nome}</span>
                      <Badge variant={u.role === "TEACHER" ? "default" : "secondary"}>{u.role === "TEACHER" ? "Professor" : "Estudante"}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{u.email}{u.empresaNome ? ` · ${u.empresaNome}` : ""}</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => setEdit(u)}><Pencil className="h-4 w-4" />Editar</Button>
                    <form action={da}><input type="hidden" name="id" value={u.id} /><Button type="submit" size="sm" variant="destructive"><Trash2 className="h-4 w-4" />Remover</Button></form>
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
