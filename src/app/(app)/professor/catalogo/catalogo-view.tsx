"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CATEGORIA_ITEM_LABEL } from "@/lib/mercado";
import { formatCurrency } from "@/lib/utils";

import {
  removerCatalogoAction,
  salvarCatalogoAction,
  type AdminActionState,
} from "./actions";

type Item = {
  id: string;
  nome: string;
  descricao: string;
  unidade: string;
  preco: number;
  empresaTipo: string | null;
  categoria: "INSUMO" | "PRODUTO" | "MELHORIA";
  aumentoCapacidade: number;
  aumentoMarketing: number;
  ativo: boolean;
};

const idle: AdminActionState = { status: "idle" };

export function CatalogoAdminView({ itens }: { itens: Item[] }) {
  const router = useRouter();
  const [edit, setEdit] = useState<Item | null>(null);
  const [s, a, p] = useActionState(salvarCatalogoAction, idle);
  const [ds, da] = useActionState(
    async (_: AdminActionState, fd: FormData) => removerCatalogoAction(fd),
    idle,
  );

  useEffect(() => {
    for (const st of [s, ds]) {
      if (st.status === "success") {
        toast.success(st.message);
        setEdit(null);
        router.refresh();
      } else if (st.status === "error") {
        toast.error(st.message);
      }
    }
  }, [s, ds, router]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Professor"
        title="Catálogo"
        description="Gerencie insumos, produtos e melhorias com preço fixo por etapa."
      />

      <Card>
        <CardHeader>
          <h2 className="font-display text-lg font-semibold">
            {edit ? "Editar item" : "Novo item"}
          </h2>
          <CardDescription>
            Itens disponíveis no mercado para as empresas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form key={edit?.id ?? "novo"} action={a} className="grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="id" value={edit?.id ?? ""} />

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" name="nome" defaultValue={edit?.nome ?? ""} required />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Input
                id="descricao"
                name="descricao"
                defaultValue={edit?.descricao ?? ""}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unidade">Unidade</Label>
              <Input
                id="unidade"
                name="unidade"
                defaultValue={edit?.unidade ?? ""}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preco">Preço (R$)</Label>
              <Input
                id="preco"
                name="preco"
                type="number"
                step="0.01"
                min="0.01"
                defaultValue={edit?.preco ?? ""}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="empresaTipo">Tipo de empresa</Label>
              <select
                id="empresaTipo"
                name="empresaTipo"
                defaultValue={edit?.empresaTipo ?? ""}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Todas</option>
                <option value="PRODUTOR">Produtor</option>
                <option value="LOGISTICA">Logística</option>
                <option value="BENEFICIAMENTO">Beneficiamento</option>
                <option value="VENDA">Venda</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <select
                id="categoria"
                name="categoria"
                defaultValue={edit?.categoria ?? "INSUMO"}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {Object.entries(CATEGORIA_ITEM_LABEL).map(([valor, rotulo]) => (
                  <option key={valor} value={valor}>
                    {rotulo}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="aumentoCapacidade">Aumento de capacidade (un./mês)</Label>
              <Input
                id="aumentoCapacidade"
                name="aumentoCapacidade"
                type="number"
                min="0"
                step="1"
                defaultValue={edit?.aumentoCapacidade ?? 0}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="aumentoMarketing">Aumento de marketing (0 a 1)</Label>
              <Input
                id="aumentoMarketing"
                name="aumentoMarketing"
                type="number"
                min="0"
                max="1"
                step="0.01"
                defaultValue={edit?.aumentoMarketing ?? 0}
              />
              <p className="text-xs text-muted-foreground">
                Ex.: 0,10 = +10% de receita nas vendas da empresa de venda.
              </p>
            </div>

            <div className="flex items-end gap-2 pb-2 sm:col-span-2">
              <input
                id="ativo"
                name="ativo"
                type="checkbox"
                defaultChecked={edit ? edit.ativo : true}
                className="h-4 w-4"
              />
              <Label htmlFor="ativo">Ativo</Label>
            </div>

            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" disabled={p}>
                {p ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {edit ? "Salvar" : "Criar item"}
              </Button>
              {edit && (
                <Button type="button" variant="outline" onClick={() => setEdit(null)}>
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-display text-lg font-semibold">Itens</h2>
          <CardDescription>{itens.length} no catálogo.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {itens.map((i) => (
              <li
                key={i.id}
                className="flex flex-wrap items-start justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{i.nome}</span>
                    <Badge variant={i.ativo ? "default" : "secondary"}>
                      {i.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                    <Badge variant="outline">
                      {CATEGORIA_ITEM_LABEL[i.categoria]}
                    </Badge>
                    {i.empresaTipo && <Badge variant="outline">{i.empresaTipo}</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {i.descricao} · {i.unidade} · {formatCurrency(i.preco)}
                  </p>
                  {i.categoria === "MELHORIA" && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      +{i.aumentoCapacidade} un./mês
                      {i.aumentoMarketing > 0
                        ? ` · +${(i.aumentoMarketing * 100).toFixed(0)}% marketing`
                        : ""}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEdit(i)}>
                    <Pencil className="h-4 w-4" />
                    Editar
                  </Button>
                  <form action={da}>
                    <input type="hidden" name="id" value={i.id} />
                    <Button size="sm" variant="destructive" type="submit">
                      <Trash2 className="h-4 w-4" />
                      Remover
                    </Button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
