import type { Metadata } from "next";
import { Building2, GraduationCap } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { requireUser } from "@/server/auth/session";
import { getEmpresaDoUsuario } from "@/server/services/empresa-service";
import {
  getEmpresasDestino,
  getEstoqueDisponivel,
  getPropostas,
} from "@/server/services/negociacao-service";

import { NegociacoesView } from "./negociacoes-view";

export const metadata: Metadata = { title: "Negociações" };

export default async function NegociacoesPage() {
  const user = await requireUser();

  if (user.role === "TEACHER") {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Negociações"
          title="Negociações"
          description="Você está logado como professor. As negociações ocorrem entre empresas."
        />
        <Alert variant="info">
          <GraduationCap aria-hidden="true" className="h-4 w-4" />
          <AlertTitle>Visão do professor</AlertTitle>
          <AlertDescription>
            Propostas são enviadas e respondidas pelos estudantes. A visão consolidada chega nas próximas iterações.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const empresa = await getEmpresaDoUsuario(user.id);
  if (!empresa) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Negociações" title="Negociações" description="Propostas entre empresas." />
        <Alert variant="warning">
          <Building2 aria-hidden="true" className="h-4 w-4" />
          <AlertTitle>Sua conta não está vinculada a uma empresa</AlertTitle>
          <AlertDescription>Peça ao professor para vincular seu usuário a uma empresa.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const [destinos, estoque, propostas] = await Promise.all([
    getEmpresasDestino(empresa.id),
    getEstoqueDisponivel(empresa.id),
    getPropostas(empresa.id),
  ]);

  return (
    <NegociacoesView
      minhaEmpresaId={empresa.id}
      empresaNome={empresa.nome}
      saldo={Number(empresa.saldo)}
      destinos={destinos}
      estoque={estoque.map((e) => ({
        catalogoItemId: e.catalogoItemId,
        quantidade: e.quantidade,
        nome: e.catalogoItem.nome,
        unidade: e.catalogoItem.unidade,
      }))}
      propostas={propostas.map((p) => ({
        id: p.id,
        empresaOrigemId: p.empresaOrigemId,
        origem: p.empresaOrigem.nome,
        destino: p.empresaDestino.nome,
        item: p.catalogoItem.nome,
        unidade: p.catalogoItem.unidade,
        quantidade: p.quantidade,
        valorTotal: Number(p.valorTotal),
        mensagem: p.mensagem,
        status: p.status,
        criadoEm: p.criadoEm.toISOString(),
        criadoPor: p.criadoPor.nome,
        respondidoPor: p.respondidoPor?.nome ?? null,
      }))}
    />
  );
}
