"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Factory,
  Gauge,
  Loader2,
  Package,
  ShoppingCart,
  Sparkles,
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
import {
  CATEGORIA_ITEM_LABEL,
  type MercadoActionState,
  totalCompra,
} from "@/lib/mercado";
import { formatCurrency } from "@/lib/utils";

import {
  comprarItemAction,
  registrarProducaoAction,
} from "./actions";

export type CatalogoViewItem = {
  id: string;
  nome: string;
  descricao: string;
  unidade: string;
  preco: number;
  empresaTipo: string | null;
  categoria: "INSUMO" | "PRODUTO" | "MELHORIA";
  aumentoCapacidade: number;
  aumentoMarketing: number;
};

export type EstoqueViewItem = {
  id: string;
  quantidade: number;
  valorTotal: number;
  nome: string;
  unidade: string;
  preco: number;
};

export type CapacidadeView = {
  base: number;
  melhorias: number;
  total: number;
  usado: number;
  disponivel: number;
  rodadaId: string | null;
  multiplicadorMarketing: number;
};

type ProdutoView = { id: string; nome: string; unidade: string };

const ESTADO_INICIAL: MercadoActionState = { status: "idle" };

export function MercadoView({
  empresa,
  catalogo,
  estoque,
  estoqueTotal,
  estoqueValorTotal,
  capacidade,
  produtos,
}: {
  empresa: { nome: string; saldo: number; tipoLabel: string };
  catalogo: CatalogoViewItem[];
  estoque: EstoqueViewItem[];
  estoqueTotal: number;
  estoqueValorTotal: number;
  capacidade: CapacidadeView;
  produtos: ProdutoView[];
}) {
  const router = useRouter();
  const [estado, formAction, pendente] = useActionState<MercadoActionState, FormData>(
    comprarItemAction,
    ESTADO_INICIAL,
  );
  const [estadoProducao, formActionProducao, pendenteProducao] =
    useActionState<MercadoActionState, FormData>(
      registrarProducaoAction,
      ESTADO_INICIAL,
    );
  const [itemSelecionado, setItemSelecionado] = useState<CatalogoViewItem | null>(null);
  const [quantidade, setQuantidade] = useState("1");
  const [produtoId, setProdutoId] = useState(produtos[0]?.id ?? "");
  const [quantidadeProducao, setQuantidadeProducao] = useState("1");
  const [ultimaCompra, setUltimaCompra] = useState<string | null>(null);

  useEffect(() => {
    if (estado.status === "idle") return;
    if (estado.status === "success") {
      toast.success(estado.message);
      setUltimaCompra(estado.message);
      setItemSelecionado(null);
      setQuantidade("1");
      router.refresh();
    } else {
      toast.error(estado.message);
    }
  }, [estado, router]);

  useEffect(() => {
    if (estadoProducao.status === "idle") return;
    if (estadoProducao.status === "success") {
      toast.success(estadoProducao.message);
      setUltimaCompra(estadoProducao.message);
      setQuantidadeProducao("1");
      router.refresh();
    } else {
      toast.error(estadoProducao.message);
    }
  }, [estadoProducao, router]);

  const qtd = useMemo(() => {
    const n = Number(quantidade);
    return Number.isInteger(n) && n > 0 ? n : 0;
  }, [quantidade]);
  const total = itemSelecionado ? totalCompra(itemSelecionado.preco, qtd) : 0;
  const saldoInsuficiente = itemSelecionado ? total > empresa.saldo : false;

  const qtdProducao = useMemo(() => {
    const n = Number(quantidadeProducao);
    return Number.isInteger(n) && n > 0 ? n : 0;
  }, [quantidadeProducao]);

  function abrirCompra(item: CatalogoViewItem) {
    setItemSelecionado(item);
    setQuantidade("1");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Mercado"
        title="Mercado e catálogo"
        description={`Compre insumos e melhorias e registre a produção de ${empresa.nome}.`}
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
          A compra debita o saldo, registra uma despesa no extrato e adiciona os
          itens ao estoque com valor médio. Melhorias aumentam a capacidade de
          produção (ou o multiplicador de marketing, para a empresa de venda).
          Não há troca nem reembolso.
        </AlertDescription>
      </Alert>

      {ultimaCompra && (
        <Alert variant="success">
          <ShoppingCart aria-hidden="true" className="h-4 w-4" />
          <AlertTitle>Última operação confirmada</AlertTitle>
          <AlertDescription>{ultimaCompra}</AlertDescription>
        </Alert>
      )}

      <section
        aria-label="Resumo do mercado"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <h2 className="sr-only">Resumo do mercado</h2>
        <ResumoCard titulo="Saldo disponível" valor={formatCurrency(empresa.saldo)} detalhe="Caixa atual" icon={Wallet} />
        <ResumoCard titulo="Itens em estoque" valor={String(estoqueTotal)} detalhe="Quantidade total armazenada" icon={Package} />
        <ResumoCard titulo="Valor do estoque" valor={formatCurrency(estoqueValorTotal)} detalhe="Soma do valor contábil dos lotes" icon={TrendingUp} />
        <ResumoCard
          titulo="Capacidade no mês"
          valor={`${capacidade.usado}/${capacidade.total}`}
          detalhe={`${capacidade.disponivel} unidades disponíveis · ${capacidade.melhorias} de melhorias`}
          icon={Gauge}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <h2 className="font-display text-lg font-semibold leading-none tracking-tight">
              Catálogo de suprimentos e melhorias
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
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{item.nome}</p>
                        <Badge
                          variant={
                            item.categoria === "MELHORIA" ? "default" : "outline"
                          }
                          className="gap-1"
                        >
                          {item.categoria === "MELHORIA" ? (
                            <Sparkles aria-hidden="true" className="h-3 w-3" />
                          ) : null}
                          {CATEGORIA_ITEM_LABEL[item.categoria]}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{item.descricao}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.unidade}
                        {item.categoria === "MELHORIA" && item.aumentoCapacidade > 0
                          ? ` · +${item.aumentoCapacidade} un./mês de capacidade`
                          : ""}
                        {item.aumentoMarketing > 0
                          ? ` · +${(item.aumentoMarketing * 100).toFixed(0)}% de marketing`
                          : ""}
                      </p>
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

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="font-display text-lg font-semibold leading-none tracking-tight">Estoque</h2>
              <CardDescription>Quantidade, preço médio e valor total por item.</CardDescription>
            </CardHeader>
            <CardContent>
              {estoque.length === 0 ? (
                <div className="flex min-h-32 flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 px-4 py-8 text-center">
                  <Package aria-hidden="true" className="h-7 w-7 text-muted-foreground/50" />
                  <p className="mt-3 text-sm font-medium">Estoque vazio</p>
                  <p className="mt-1 text-xs text-muted-foreground">As compras e a produção aparecerão aqui.</p>
                </div>
              ) : (
                <ul className="divide-y">
                  {estoque.map((item) => (
                    <li key={item.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                      <div>
                        <p className="text-sm font-medium">{item.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantidade} {item.unidade} · médio{" "}
                          {formatCurrency(
                            item.quantidade > 0
                              ? item.valorTotal / item.quantidade
                              : 0,
                          )}
                        </p>
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        {formatCurrency(item.valorTotal)}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-display text-lg font-semibold leading-none tracking-tight">
                Registrar produção
              </h2>
              <CardDescription>
                Cada rodada representa um mês. A produção consome a capacidade
                disponível e entra no estoque.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!capacidade.rodadaId ? (
                <p className="text-sm text-muted-foreground">
                  Não há rodada aberta. Peça ao professor para abrir uma rodada.
                </p>
              ) : produtos.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum produto disponível para a sua empresa no catálogo.
                </p>
              ) : (
                <form action={formActionProducao} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="produto-producao">Produto / serviço</Label>
                    <select
                      id="produto-producao"
                      name="catalogoItemId"
                      value={produtoId}
                      onChange={(event) => setProdutoId(event.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      {produtos.map((produto) => (
                        <option key={produto.id} value={produto.id}>
                          {produto.nome} ({produto.unidade})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantidade-producao">Quantidade</Label>
                    <Input
                      id="quantidade-producao"
                      name="quantidade"
                      type="number"
                      min={1}
                      max={capacidade.disponivel}
                      step={1}
                      value={quantidadeProducao}
                      onChange={(event) => setQuantidadeProducao(event.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Disponível nesta rodada: {capacidade.disponivel} de{" "}
                      {capacidade.total} unidades.
                    </p>
                    {estadoProducao.status === "error" && (
                      <p className="text-xs font-medium text-destructive">
                        {estadoProducao.message}
                      </p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={
                      pendenteProducao ||
                      qtdProducao < 1 ||
                      qtdProducao > capacidade.disponivel ||
                      capacidade.disponivel === 0
                    }
                  >
                    {pendenteProducao ? (
                      <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                    ) : (
                      <Factory aria-hidden="true" className="h-4 w-4" />
                    )}
                    Registrar produção
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
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
                    <span className="text-muted-foreground">Total debitado</span>
                    <span className="font-display font-semibold">{formatCurrency(total)}</span>
                  </div>
                  {itemSelecionado.categoria === "MELHORIA" && (
                    <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Efeito da melhoria</span>
                      <span>
                        {itemSelecionado.aumentoCapacidade > 0
                          ? `+${itemSelecionado.aumentoCapacidade * qtd} un./mês`
                          : `+${(itemSelecionado.aumentoMarketing * qtd * 100).toFixed(0)}% marketing`}
                      </span>
                    </div>
                  )}
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
