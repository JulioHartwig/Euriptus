import type { Metadata } from "next";
import { TrendingUp } from "lucide-react";

import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = {
  title: "Mercado",
};

export default function MercadoPage() {
  return (
    <PagePlaceholder
      title="Mercado"
      description="Acompanhe as condições do mercado do café e os eventos econômicos que afetam toda a cadeia."
      icon={TrendingUp}
      upcoming={[
        "Cotação do café e variações ao longo das rodadas",
        "Notícias e eventos disparados pelo professor",
        "Impactos de combustível, juros e câmbio nas empresas",
        "Histórico de preços para apoiar as decisões dos grupos",
      ]}
    />
  );
}
