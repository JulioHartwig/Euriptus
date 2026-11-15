import type { Metadata } from "next";
import { Wallet } from "lucide-react";

import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = {
  title: "Financeiro",
};

export default function FinanceiroPage() {
  return (
    <PagePlaceholder
      title="Financeiro"
      description="Entenda para onde vai o dinheiro da empresa: custos fixos, impostos e salários."
      icon={Wallet}
      upcoming={[
        "Extrato de entradas e saídas por rodada",
        "Custos fixos, impostos e folha de pagamento",
        "Resumo de receitas, despesas e saldo consolidado",
        "Alertas de caixa para evitar decisões inviáveis",
      ]}
    />
  );
}
