import type { Metadata } from "next";
import { Building2, GraduationCap, Package, TrendingUp } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { requireUser } from "@/server/auth/session";
import { getEmpresaDoUsuario } from "@/server/services/empresa-service";
import { getCapacidade, getEstoque, getEstoqueTotal } from "@/server/services/mercado-service";
import { listProducaoDaRodada } from "@/server/repositories/mercado-repository";

export const metadata: Metadata = {
  title: "Estoque",
};

export default async function EstoquePage() {
  const user = await requireUser();

  if (user.role === "TEACHER" || !user.empresaId) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Estoque"
          title="Estoque"
          description="Acompanhe os itens e valores armazenados pela sua empresa."
        />
        <Alert variant="info">
          {user.role === "TEACHER" ? (
            <GraduationCap aria-hidden="true" className="h-4 w-4" />
          ) : (
            <Building2 aria-hidden="true" className="h-4 w-4" />
          )}
          <AlertTitle>
            {user.role === "TEACHER"
              ? "Visão do professor"
              : "Sua conta ainda não está vinculada a uma empresa"}
          </AlertTitle>
          <AlertDescription>
            {user.role === "TEACHER"
              ? "Cada estudante acompanha o estoque da sua própria empresa."
              : "Peça ao professor para vincular seu usuário a uma empresa."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const empresa = await getEmpresaDoUsuario(user.id);

  if (!empresa) {
    return null;
  }

  const [estoque, total, capacidade] = await Promise.all([
    getEstoque(empresa.id),
    getEstoqueTotal(empresa.id),
    getCapacidade(empresa.id, empresa.tipo),
  ]);

  const producao = capacidade.rodadaId
    ? await listProducaoDaRodada(empresa.id, capacidade.rodadaId)
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Estoque"
        title="Estoque"
        description={`Itens, preço médio e valor contábil de ${empresa.nome}.`}
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <h2 className="text-sm font-medium text-muted-foreground">Itens em estoque</h2>
            <Package aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="font-display text-2xl font-semibold">{total.quantidade}</p>
            <p className="mt-1 text-xs text-muted-foreground">Unidades armazenadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <h2 className="text-sm font-medium text-muted-foreground">Valor total</h2>
            <TrendingUp aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="font-display text-2xl font-semibold">
              {formatCurrency(total.valorTotal)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Soma dos lotes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <h2 className="text-sm font-medium text-muted-foreground">Capacidade no mês</h2>
            <Badge variant="outline">Rodada</Badge>
          </CardHeader>
          <CardContent>
            <p className="font-display text-2xl font-semibold">
              {capacidade.usado}/{capacidade.total}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {capacidade.disponivel} disponíveis · {capacidade.melhorias} de melhorias
            </p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <h2 className="font-display text-lg font-semibold leading-none tracking-tight">
            Itens armazenados
          </h2>
        </CardHeader>
        <CardContent>
          {estoque.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Estoque vazio. Compre insumos ou registre produção no Mercado.
            </p>
          ) : (
            <div className="divide-y">
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 pb-2 text-[0.68rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                <span>Item</span>
                <span className="text-right">Quantidade</span>
                <span className="text-right">Valor médio</span>
                <span className="text-right">Valor total</span>
              </div>
              {estoque.map((item) => {
                const valorMedio =
                  item.quantidade > 0
                    ? Number(item.valorTotal) / item.quantidade
                    : 0;
                return (
                  <div
                    key={item.id}
                    className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 py-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{item.catalogoItem.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.catalogoItem.unidade}
                      </p>
                    </div>
                    <span className="text-right tabular-nums">{item.quantidade}</span>
                    <span className="text-right tabular-nums">
                      {formatCurrency(valorMedio)}
                    </span>
                    <span className="text-right font-semibold tabular-nums">
                      {formatCurrency(Number(item.valorTotal))}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-display text-lg font-semibold leading-none tracking-tight">
            Produção da rodada
          </h2>
        </CardHeader>
        <CardContent>
          {producao.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma produção registrada nesta rodada.
            </p>
          ) : (
            <ul className="divide-y">
              {producao.map((item, indice) => (
                <li
                  key={`${item.catalogoItem.nome}-${indice}`}
                  className="flex items-center justify-between gap-3 py-3 text-sm"
                >
                  <span>{item.catalogoItem.nome}</span>
                  <Badge variant="secondary">
                    {item.quantidade} {item.catalogoItem.unidade}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
