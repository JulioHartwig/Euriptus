"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Loader2,
  Package,
  ShoppingCart,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { type MercadoActionState, totalCompra } from "@/lib/mercado";
import { formatCurrency } from "@/lib/utils";

import { comprarItemAction } from "./actions";

export type CatalogoViewItem = {
  id: string;
  nome: string;
  descricao: string;
  unidade: string;
  preco: number;
  empresaTipo: string | null;
};

export type EstoqueViewItem = {
  id: string;
  quantidade: number;
  nome: string;
  unidade: string;
  preco: number;
};

export function MercadoView({
  empresa,
  catalogo,
  estoque,
  estoqueTotal,
}: {
  empresa: { nome: string; saldo: number; tipoLabel: string };
  catalogo: CatalogoViewItem[];
  estoque: EstoqueViewItem[];
  estoqueTotal: number;
}) {
  const router = useRouter();
  const [estado, formAction, pendente] = useActionState<MercadoActionState, FormData>(
    comprarItemAction,
    { status: "idle" },
  );
  const [itemSelecionado, setItemSelecionado] = useState<CatalogoViewItem | null>(null);
  const [quantidade, setQuantidade] = useState("1");

  useEffect(() => {
    if (estado.status === "idle") return;
    if (estado.status === "success") {
      toast.success(estado.message);
      setItemSelecionado(null);
      setQuantidade("1");
      router.refresh();
    } else {
      toast.error(estado.message);
    }
  }, [estado, router]);

  const qtd = useMemo(() => {
    const n = Number(quantidade);
    return Number.isInteger(n) && n > 0 ? n : 0;
  }, [quantidade]);
  const total = itemSelecionado ? totalCompra(itemSelecionado.preco, qtd) : 0;
  const saldoInsuficiente = itemSelecionado ? total > empresa.saldo : false;

  function abrirCompra(item: CatalogoViewItem) {
    setItemSelecionado(item);
    setQuantidade("1");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Mercado"
        title="Mercado e catálogo"
        description={`Compre suprimentos de preço fixo para ${empresa.nome}.`}
        actions={
          <Badge variant="outline" className="gap-1.5 bg-card px-3 py-1.5">
            <Wallet aria-hidden="true" className="h-3.5 w-3.5 text-primary" />
            Saldo: {formatCurrency(empresa.saldo)}
          </Badge>
        }
      />

      <Alert variant="info">
        <TrendingUp aria-hidden="true" className="h-4 w-4" />
        <AlertTitle>Compras de catálogo (preço fixo)</AlertTitle>
        <AlertDescription>
          Os preços são fixos nesta etapa. A compra debita o saldo, registra uma despesa no
          extrato e adiciona os itens ao estoque. Não há troca nem reembolso.
        </AlertDescription>
      </Alert>

      <section
        aria-label="Resumo do mercado"
        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        <ResumoCard titulo="Saldo disponível" valor={formatCurrency(empresa.saldo)} detalhe="Caixa atual" icon={Wallet} />
        <ResumoCard titulo="Itens em estoque" valor={String(estoqueTotal)} detalhe="Quantidade total armazenada" icon={Package} />
        <ResumoCard titulo="Itens no catálogo" valor={String(catalogo.length)} detalhe={`Disponíveis para ${empresa.tipoLabel}`} icon={ShoppingCart} />
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <h2 className="font-display text-lg font-semibold leading-none tracking-tight">
              Catálogo de suprimentos
            </h2>
            <CardDescription>Itens disponíveis para a sua etapa da cadeia.</CardDescription>
          </CardHeader>
          <CardContent>
            {catalogo.length === 0 ? (
              <div className="flex min-h-32 flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 px-4 py-8 text-center">
                <ShoppingCart aria-hidden="true" className="h-7 w-7 text-muted-foreground/50" />
                <p className="mt-3 text-sm font-medium">Nenhum item disponível</p>
              </div>
            ) : (
              <ul className="divide-y">
                {catalogo.map((item) => (
                  <li key={item.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-medium">{item.nome}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{item.descricao}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{item.unidade}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="font-display text-base font-semibold">
                        {formatCurrency(item.preco)}
                      </span>
                      <Button size="sm" onClick={() => abrirCompra(item)}>
                        Comprar
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-display text-lg font-semibold leading-none tracking-tight">Estoque</h2>
            <CardDescription>Itens armazenados pela empresa.</CardDescription>
          </CardHeader>
          <CardContent>
            {estoque.length === 0 ? (
              <div className="flex min-h-32 flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 px-4 py-8 text-center">
                <Package aria-hidden="true" className="h-7 w-7 text-muted-foreground/50" />
                <p className="mt-3 text-sm font-medium">Estoque vazio</p>
                <p className="mt-1 text-xs text-muted-foreground">As compras aparecerão aqui.</p>
              </div>
            ) : (
              <ul className="divide-y">
                {estoque.map((item) => (
                  <li key={item.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium">{item.nome}</p>
                      <p className="text-xs text-muted-foreground">{item.unidade}</p>
                    </div>
                    <Badge variant="secondary" className="shrink-0">{item.quantidade} un.</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!itemSelecionado} onOpenChange={(open) => !open && setItemSelecionado(null)}>
        <AlertDialogContent>
          {itemSelecionado && (
            <form action={formAction}>
              <input type="hidden" name="catalogoItemId" value={itemSelecionado.id} />
              <AlertDialogHeader>
                <AlertDialogTitle>Comprar {itemSelecionado.nome}</AlertDialogTitle>
                <AlertDialogDescription>
                  {formatCurrency(itemSelecionado.preco)} por {itemSelecionado.unidade}. A compra é registrada e não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="quantidade">Quantidade</Label>
                  <Input
                    id="quantidade"
                    name="quantidade"
                    type="number"
                    min={1}
                    max={999}
                    step={1}
                    value={quantidade}
                    onChange={(e) => setQuantidade(e.target.value)}
                    required
                  />
                  {estado.status === "error" && estado.fieldErrors?.quantidade?.[0] && (
                    <p className="text-xs text-destructive">{estado.fieldErrors.quantidade[0]}</p>
                  )}
                </div>
                <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-display font-semibold">{formatCurrency(total)}</span>
                  </div>
                </div>
                {saldoInsuficiente && qtd > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle aria-hidden="true" className="h-4 w-4" />
                    <AlertTitle>Saldo insuficiente</AlertTitle>
                    <AlertDescription>
                      Total {formatCurrency(total)} acima do saldo {formatCurrency(empresa.saldo)}.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel type="button" disabled={pendente}>Cancelar</AlertDialogCancel>
                <AlertDialogAction asChild>
                  <Button type="submit" disabled={pendente || qtd < 1 || saldoInsuficiente}>
                    {pendente ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Confirmar compra
                  </Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </form>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ResumoCard({
  titulo,
  valor,
  detalhe,
  icon: Icon,
}: {
  titulo: string;
  valor: string;
  detalhe: string;
  icon: LucideIcon;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <h3 className="text-sm font-medium text-muted-foreground">{titulo}</h3>
        <Icon aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{valor}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{detalhe}</p>
      </CardContent>
    </Card>
  );
}
