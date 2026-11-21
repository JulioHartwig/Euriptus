import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, GraduationCap, Landmark } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/server/auth/session";
import { getEmpresaDoUsuario } from "@/server/services/empresa-service";
import {
  getEmprestimos,
  getInvestimentos,
  getResumoBanco,
  getTaxasBanco,
} from "@/server/services/banco-service";

import { BancoView } from "./banco-view";

export const metadata: Metadata = {
  title: "Banco",
};

export default async function BancoPage() {
  const user = await requireUser();

  if (user.role === "TEACHER") {
    return <VisaoProfessor />;
  }

  const empresa = await getEmpresaDoUsuario(user.id);

  if (!empresa) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Banco"
          title="Banco"
          description="Empréstimos e investimentos da sua empresa."
        />
        <Alert variant="warning">
          <Building2 aria-hidden="true" className="h-4 w-4" />
          <AlertTitle>Sua conta ainda não está vinculada a uma empresa</AlertTitle>
          <AlertDescription>
            Peça ao professor para vincular seu usuário a uma empresa. As opções de
            crédito e investimento aparecerão aqui assim que o vínculo existir.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const [taxas, resumo, emprestimos, investimentos] = await Promise.all([
    getTaxasBanco(),
    getResumoBanco(empresa.id),
    getEmprestimos(empresa.id),
    getInvestimentos(empresa.id),
  ]);

  return (
    <BancoView
      empresa={{ nome: empresa.nome, saldo: Number(empresa.saldo) }}
      taxas={taxas}
      resumo={resumo}
      emprestimos={emprestimos.map((emprestimo) => ({
        id: emprestimo.id,
        valorPrincipal: Number(emprestimo.valorPrincipal),
        taxaJurosMensal: Number(emprestimo.taxaJurosMensal),
        totalDevido: Number(emprestimo.totalDevido),
        numeroParcelas: emprestimo.numeroParcelas,
        valorParcela: Number(emprestimo.valorParcela),
        descontoAplicado: Number(emprestimo.descontoAplicado),
        status: emprestimo.status,
        criadoEm: emprestimo.criadoEm.toISOString(),
        autor: emprestimo.criadoPor.nome,
        parcelas: emprestimo.parcelas.map((parcela) => ({
          id: parcela.id,
          numero: parcela.numero,
          valor: Number(parcela.valor),
          vencimento: parcela.vencimento.toISOString(),
          status: parcela.status,
          valorPago: parcela.valorPago === null ? null : Number(parcela.valorPago),
        })),
      }))}
      investimentos={investimentos.map((investimento) => ({
        id: investimento.id,
        valorAplicado: Number(investimento.valorAplicado),
        taxaRendimentoMensal: Number(investimento.taxaRendimentoMensal),
        valorResgate:
          investimento.valorResgate === null
            ? null
            : Number(investimento.valorResgate),
        taxaResgateAplicada:
          investimento.taxaResgateAplicada === null
            ? null
            : Number(investimento.taxaResgateAplicada),
        status: investimento.status,
        criadoEm: investimento.criadoEm.toISOString(),
        resgatadoEm: investimento.resgatadoEm?.toISOString() ?? null,
        autor: investimento.criadoPor.nome,
        resgatadoPor: investimento.resgatadoPor?.nome ?? null,
      }))}
    />
  );
}

function VisaoProfessor() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Banco"
        title="Banco"
        description="Você está logado como professor. As operações bancárias pertencem às empresas."
      />
      <Alert variant="info">
        <GraduationCap aria-hidden="true" className="h-4 w-4" />
        <AlertTitle>Visão do professor</AlertTitle>
        <AlertDescription>
          Empréstimos e investimentos são contratados pelos estudantes. A visão
          consolidada das empresas e suas dívidas chega nas próximas iterações.
        </AlertDescription>
      </Alert>
      <Button asChild>
        <Link href="/professor/banco">
          <Landmark aria-hidden="true" className="h-4 w-4" />
          Abrir banco das empresas
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}
