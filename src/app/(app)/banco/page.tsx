import type { Metadata } from "next";
import { Landmark } from "lucide-react";

import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = {
  title: "Banco",
};

export default function BancoPage() {
  return (
    <PagePlaceholder
      title="Banco"
      description="Acesse linhas de crédito para investir na empresa e acompanhe suas obrigações."
      icon={Landmark}
      upcoming={[
        "Solicitação de empréstimos e financiamentos",
        "Taxas de juros definidas pelo professor",
        "Parcelas, vencimentos e impacto no caixa",
        "Histórico de contratos ativos e quitados",
      ]}
    />
  );
}
