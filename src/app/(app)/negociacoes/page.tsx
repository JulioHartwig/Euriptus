import type { Metadata } from "next";
import { Handshake } from "lucide-react";

import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = {
  title: "Negociações",
};

export default function NegociacoesPage() {
  return (
    <PagePlaceholder
      title="Negociações"
      description="Envie e responda propostas formais de compra e venda entre as empresas da cadeia."
      icon={Handshake}
      upcoming={[
        "Criação de propostas com produto, quantidade, preço e prazo",
        "Aceite ou recusa formal, registrando quem executou a ação",
        "Validação de saldo antes de fechar qualquer negociação",
        "Histórico completo das propostas de cada empresa",
      ]}
    />
  );
}
