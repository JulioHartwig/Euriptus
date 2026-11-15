import type { EmpresaTipo } from "@prisma/client";
import { Factory, Sprout, Store, Truck } from "lucide-react";

import { cn } from "@/lib/utils";

const icones = {
  PRODUTOR: Sprout,
  LOGISTICA: Truck,
  BENEFICIAMENTO: Factory,
  VENDA: Store,
} satisfies Record<EmpresaTipo, typeof Sprout>;

export function EmpresaIcon({
  tipo,
  className,
}: {
  tipo: EmpresaTipo;
  className?: string;
}) {
  const Icon = icones[tipo];
  return <Icon aria-hidden="true" className={cn("h-5 w-5", className)} />;
}
