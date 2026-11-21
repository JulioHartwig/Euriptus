import type { Metadata } from "next";
import { Building2, GraduationCap } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { EMPRESA_TIPO_LABEL } from "@/lib/empresa";
import { requireUser } from "@/server/auth/session";
import { getEmpresaDoUsuario } from "@/server/services/empresa-service";
import {
  getCapacidade,
  getCatalogo,
  getEstoque,
  getEstoqueTotal,
  getProdutos,
} from "@/server/services/mercado-service";

import { MercadoView } from "./mercado-view";

export const metadata: Metadata = {
  title: "Mercado",
};

export default async function MercadoPage() {
  const user = await requireUser();

  if (user.role === "TEACHER") {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Mercado"
          title="Mercado e catálogo"
          description="Você está logado como professor. As compras pertencem às empresas."
        />
        <Alert variant="info">
          <GraduationCap aria-hidden="true" className="h-4 w-4" />
          <AlertTitle>Visão do professor</AlertTitle>
          <AlertDescription>
            O catálogo e as compras são feitos pelos estudantes em suas empresas. A gestão do
            catálogo chega nas próximas iterações.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const empresa = await getEmpresaDoUsuario(user.id);

  if (!empresa) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Mercado"
          title="Mercado e catálogo"
          description="Compre suprimentos e acompanhe o estoque da empresa."
        />
        <Alert variant="warning">
          <Building2 aria-hidden="true" className="h-4 w-4" />
          <AlertTitle>Sua conta ainda não está vinculada a uma empresa</AlertTitle>
          <AlertDescription>
            Peça ao professor para vincular seu usuário a uma empresa.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const [catalogo, estoque, estoqueTotal, capacidade, produtos] =
    await Promise.all([
      getCatalogo(empresa.tipo),
      getEstoque(empresa.id),
      getEstoqueTotal(empresa.id),
      getCapacidade(empresa.id, empresa.tipo),
      Promise.resolve(getProdutos(empresa.tipo)),
    ]);

  return (
    <MercadoView
      empresa={{
        nome: empresa.nome,
        saldo: Number(empresa.saldo),
        tipoLabel: EMPRESA_TIPO_LABEL[empresa.tipo],
      }}
      catalogo={catalogo.map((item) => ({
        id: item.id,
        nome: item.nome,
        descricao: item.descricao,
        unidade: item.unidade,
        preco: Number(item.preco),
        empresaTipo: item.empresaTipo,
        categoria: item.categoria,
        aumentoCapacidade: item.aumentoCapacidade,
        aumentoMarketing: Number(item.aumentoMarketing),
      }))}
      estoque={estoque.map((item) => ({
        id: item.id,
        quantidade: item.quantidade,
        valorTotal: Number(item.valorTotal),
        nome: item.catalogoItem.nome,
        unidade: item.catalogoItem.unidade,
        preco: Number(item.catalogoItem.preco),
      }))}
      estoqueTotal={estoqueTotal.quantidade}
      estoqueValorTotal={estoqueTotal.valorTotal}
      capacidade={capacidade}
      produtos={produtos.map((produto) => ({
        id: produto.id,
        nome: produto.nome,
        unidade: produto.unidade,
      }))}
    />
  );
}
