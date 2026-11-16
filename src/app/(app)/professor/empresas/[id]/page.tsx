import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Landmark, Package, Receipt, Users } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EMPRESA_TIPO_LABEL } from "@/lib/empresa";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { requireTeacher } from "@/server/auth/session";
import { getEmpresaConsolidada } from "@/server/services/empresa-admin-service";

export const metadata: Metadata = { title: "Detalhe da empresa" };

export default async function EmpresaDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  await requireTeacher();
  const { id } = await params;
  const empresa = await getEmpresaConsolidada(id);
  if (!empresa) notFound();

  const dividaAtiva = empresa.emprestimos
    .filter((e) => e.status === "ATIVO")
    .reduce((s, e) => s + Number(e.totalDevido), 0);
  const investidoAtivo = empresa.investimentos
    .filter((i) => i.status === "ATIVO")
    .reduce((s, i) => s + Number(i.valorAplicado), 0);
  const estoqueTotal = empresa.estoque.reduce((s, i) => s + i.quantidade, 0);
  const propostas = [...empresa.propostasEnviadas, ...empresa.propostasRecebidas].sort(
    (a, b) => b.criadoEm.getTime() - a.criadoEm.getTime(),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Professor"
        title={empresa.nome}
        description={`${EMPRESA_TIPO_LABEL[empresa.tipo]} · visão consolidada`}
        actions={
          <Button asChild variant="outline">
            <Link href="/professor/empresas"><ArrowLeft className="h-4 w-4" />Voltar</Link>
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Saldo</CardTitle></CardHeader><CardContent><p className="font-display text-2xl font-semibold">{formatCurrency(empresa.saldo)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Dívida ativa</CardTitle></CardHeader><CardContent><p className="font-display text-2xl font-semibold">{formatCurrency(dividaAtiva)}</p><p className="text-xs text-muted-foreground">Empréstimos ativos</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Investido</CardTitle></CardHeader><CardContent><p className="font-display text-2xl font-semibold">{formatCurrency(investidoAtivo)}</p><p className="text-xs text-muted-foreground">Aplicações ativas</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Estoque</CardTitle></CardHeader><CardContent><p className="font-display text-2xl font-semibold">{estoqueTotal}</p><p className="text-xs text-muted-foreground">Itens no total</p></CardContent></Card>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Users className="h-4 w-4" />Usuários</CardTitle><CardDescription>{empresa.usuarios.length} vinculado(s)</CardDescription></CardHeader>
          <CardContent>
            {empresa.usuarios.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum usuário vinculado.</p> : (
              <ul className="space-y-2">{empresa.usuarios.map((u) => (
                <li key={u.id} className="flex items-center justify-between gap-2 text-sm"><span>{u.nome} <span className="text-muted-foreground">({u.email})</span></span><Badge variant="outline">{u.role}</Badge></li>
              ))}</ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Package className="h-4 w-4" />Estoque</CardTitle><CardDescription>Itens da empresa</CardDescription></CardHeader>
          <CardContent>
            {empresa.estoque.length === 0 ? <p className="text-sm text-muted-foreground">Sem itens em estoque.</p> : (
              <ul className="space-y-2">{empresa.estoque.map((i) => (
                <li key={i.id} className="flex items-center justify-between text-sm"><span>{i.catalogoItem.nome}</span><span className="font-medium">{i.quantidade} {i.catalogoItem.unidade}</span></li>
              ))}</ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Landmark className="h-4 w-4" />Empréstimos e investimentos</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Empréstimos</p>
              {empresa.emprestimos.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum.</p> : (
                <ul className="space-y-2">{empresa.emprestimos.map((e) => (
                  <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span>Principal {formatCurrency(e.valorPrincipal)} · devido {formatCurrency(e.totalDevido)}</span>
                    <Badge variant={e.status === "ATIVO" ? "default" : "secondary"}>{e.status}</Badge>
                  </li>
                ))}</ul>
              )}
            </div>
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Investimentos</p>
              {empresa.investimentos.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum.</p> : (
                <ul className="space-y-2">{empresa.investimentos.map((i) => (
                  <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span>Aplicado {formatCurrency(i.valorAplicado)}{i.valorResgate ? ` · resgate ${formatCurrency(i.valorResgate)}` : ""}</span>
                    <Badge variant={i.status === "ATIVO" ? "default" : "secondary"}>{i.status}</Badge>
                  </li>
                ))}</ul>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Receipt className="h-4 w-4" />Negociações (propostas)</CardTitle><CardDescription>Enviadas e recebidas (recentes)</CardDescription></CardHeader>
          <CardContent>
            {propostas.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma proposta.</p> : (
              <ul className="space-y-2">{propostas.slice(0, 12).map((p) => {
                const enviada = "empresaDestino" in p;
                const contraparte = enviada ? p.empresaDestino.nome : p.empresaOrigem.nome;
                const prefixo = enviada ? "→" : "←";
                return (
                  <li key={p.id} className="text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{p.status}</Badge>
                      <span>{prefixo} {contraparte}</span>
                    </div>
                    <p className="text-muted-foreground">{p.quantidade} {p.catalogoItem.unidade} de {p.catalogoItem.nome} · {formatCurrency(p.valorTotal)}</p>
                  </li>
                );
              })}</ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Transações recentes</CardTitle><CardDescription>Últimos 30 lançamentos</CardDescription></CardHeader>
        <CardContent>
          {empresa.transacoes.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma transação.</p> : (
            <div className="-mx-6 overflow-x-auto">
              <table className="w-full min-w-[40rem] text-sm">
                <thead><tr className="border-y bg-muted/40 text-left"><th className="px-6 py-2 font-medium">Data</th><th className="px-3 py-2 font-medium">Tipo</th><th className="px-3 py-2 font-medium">Descrição</th><th className="px-3 py-2 font-medium">Autor</th><th className="px-6 py-2 text-right font-medium">Valor</th></tr></thead>
                <tbody>{empresa.transacoes.map((t) => (
                  <tr key={t.id} className="border-b last:border-0">
                    <td className="px-6 py-2 text-muted-foreground">{formatDateTime(t.criadoEm)}</td>
                    <td className="px-3 py-2"><Badge variant="outline">{t.tipo}</Badge></td>
                    <td className="px-3 py-2">{t.descricao}</td>
                    <td className="px-3 py-2 text-muted-foreground">{t.criadoPor.nome}</td>
                    <td className="whitespace-nowrap px-6 py-2 text-right font-medium">{formatCurrency(t.valor)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
