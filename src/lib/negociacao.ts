import type { PropostaStatus } from "@prisma/client";

export const PROPOSTA_STATUS_LABEL: Record<PropostaStatus, string> = {
  PENDENTE: "Pendente",
  ACEITA: "Aceita",
  RECUSADA: "Recusada",
  CANCELADA: "Cancelada",
};

export const PROPOSTA_STATUS_BADGE: Record<PropostaStatus, "default" | "secondary" | "destructive" | "outline"> = {
  PENDENTE: "outline",
  ACEITA: "default",
  RECUSADA: "destructive",
  CANCELADA: "secondary",
};

export type NegociacaoActionState =
  | { status: "idle" }
  | { status: "success"; message: string; submittedAt: number }
  | { status: "error"; message: string; fieldErrors?: Record<string, string[] | undefined>; submittedAt: number };
