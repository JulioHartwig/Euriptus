import type { EmpresaTipo } from "@prisma/client";
import { ArrowRight } from "lucide-react";

import { EmpresaIcon } from "@/components/empresa-icon";
import {
  EMPRESA_TIPO_DESCRICAO,
  EMPRESA_TIPO_LABEL,
  EMPRESA_TIPOS,
} from "@/lib/empresa";
import { cn } from "@/lib/utils";

export function CadeiaProdutiva({ atual }: { atual: EmpresaTipo }) {
  const indiceAtual = EMPRESA_TIPOS.indexOf(atual);

  return (
    <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Etapas da cadeia produtiva do café">
      {EMPRESA_TIPOS.map((tipo, index) => {
        const ativo = tipo === atual;
        const concluido = index < indiceAtual;

        return (
          <li key={tipo} className="relative">
            <div
              className={cn(
                "flex h-full flex-col gap-3 rounded-lg border p-4 transition-colors",
                ativo
                  ? "border-primary/30 bg-primary text-primary-foreground shadow-sm"
                  : concluido
                    ? "border-primary/15 bg-secondary/70"
                    : "bg-card",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-md",
                    ativo
                      ? "bg-white/15 text-white"
                      : "bg-secondary text-primary",
                  )}
                >
                  <EmpresaIcon tipo={tipo} />
                </span>
                <span
                  className={cn(
                    "text-[0.68rem] font-semibold uppercase tracking-[0.16em]",
                    ativo ? "text-amber-200" : "text-muted-foreground",
                  )}
                >
                  Etapa {index + 1}
                </span>
              </div>
              <div>
                <p className="font-semibold">{EMPRESA_TIPO_LABEL[tipo]}</p>
                <p
                  className={cn(
                    "mt-1 text-xs leading-relaxed",
                    ativo ? "text-primary-foreground/75" : "text-muted-foreground",
                  )}
                >
                  {EMPRESA_TIPO_DESCRICAO[tipo]}
                </p>
              </div>
              {ativo && (
                <span className="mt-auto inline-flex w-fit items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-[0.68rem] font-semibold text-emerald-950">
                  Sua etapa
                  <ArrowRight aria-hidden="true" className="h-3 w-3" />
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
