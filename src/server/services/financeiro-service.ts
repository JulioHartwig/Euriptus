import {
  listCustosFixosDaEmpresa,
  listTransacoesDaEmpresa,
  somarTransacoesPorTipo,
} from "@/server/repositories/financeiro-repository";

export type ResumoFinanceiro = {
  receitas: number;
  despesas: number;
  impostos: number;
  salarios: number;
  /**
   * Resultado operacional do período:
   * receitas − despesas − impostos − salários.
   *
   * Juros, empréstimos e investimentos são movimentos financeiros e entram no
   * módulo Banco (Etapa 4) e no processamento de rodadas (Etapa 7).
   */
  resultado: number;
  totalLancamentos: number;
};

export async function getResumoFinanceiro(
  empresaId: string,
): Promise<ResumoFinanceiro> {
  const totais = await somarTransacoesPorTipo(empresaId);
  const porTipo = new Map(totais.map((item) => [item.tipo, item.total]));

  const receitas = porTipo.get("RECEITA") ?? 0;
  const despesas = porTipo.get("DESPESA") ?? 0;
  const impostos = porTipo.get("IMPOSTO") ?? 0;
  const salarios = porTipo.get("SALARIO") ?? 0;

  return {
    receitas,
    despesas,
    impostos,
    salarios,
    resultado: receitas - despesas - impostos - salarios,
    totalLancamentos: totais.reduce(
      (soma, item) => soma + item.quantidade,
      0,
    ),
  };
}

/** Extrato da empresa (mais recente primeiro). */
export function getExtrato(empresaId: string, limite = 50) {
  return listTransacoesDaEmpresa(empresaId, limite);
}

/** Custos fixos ativos da empresa. */
export function getCustosFixos(empresaId: string) {
  return listCustosFixosDaEmpresa(empresaId);
}
