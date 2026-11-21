export type RodadaActionState =
  | { status: "idle" }
  | { status: "success"; message: string; submittedAt: number }
  | { status: "error"; message: string; submittedAt: number };

/** Retorna o primeiro dia do mês da competência, em UTC. */
export function primeiroDiaDoMes(data: Date) {
  return new Date(Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), 1));
}

/** Próxima competência mensal a partir da última rodada. */
export function proximaCompetencia(ultima: Date | null | undefined, agora = new Date()) {
  if (!ultima) return primeiroDiaDoMes(agora);
  const base = primeiroDiaDoMes(ultima);
  return new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 1));
}

/** Rótulo curto da rodada, ex.: "03/2026". */
export function formatarCompetencia(competencia: Date | null | undefined, numero?: number) {
  if (!competencia) return numero ? `Rodada ${numero}` : "—";

  return new Intl.DateTimeFormat("pt-BR", {
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(competencia);
}
