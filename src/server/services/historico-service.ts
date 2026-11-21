import { formatarCompetencia } from "@/lib/rodada";
import { listProducoesDaEmpresa } from "@/server/repositories/mercado-repository";
import { getExtrato } from "@/server/services/financeiro-service";

export type HistoricoEntry = {
  id: string;
  tipo: string;
  descricao: string;
  valor: number | null;
  quantidade: number | null;
  rodada: string | null;
  autor: string;
  criadoEm: string;
  sinal: -1 | 0 | 1;
};

const SINAL_POR_TIPO: Record<string, -1 | 1> = {
  RECEITA: 1,
  DESPESA: -1,
  IMPOSTO: -1,
  SALARIO: -1,
  JUROS: -1,
  EMPRESTIMO: 1,
  INVESTIMENTO: -1,
  RESGATE: 1,
  PAGAMENTO_EMPRESTIMO: -1,
};

/** Linha do tempo unificada: lançamentos financeiros e produção por rodada. */
export async function getHistorico(
  empresaId: string,
  limite = 100,
): Promise<HistoricoEntry[]> {
  const [transacoes, producoes] = await Promise.all([
    getExtrato(empresaId, limite),
    listProducoesDaEmpresa(empresaId, limite),
  ]);

  const entradas: HistoricoEntry[] = transacoes.map((transacao) => ({
    id: transacao.id,
    tipo: transacao.tipo,
    descricao: transacao.descricao,
    valor: Number(transacao.valor),
    quantidade: transacao.quantidade,
    rodada: transacao.rodada
      ? formatarCompetencia(transacao.rodada.competencia, transacao.rodada.numero)
      : null,
    autor: transacao.criadoPor.nome,
    criadoEm: transacao.criadoEm.toISOString(),
    sinal: SINAL_POR_TIPO[transacao.tipo] ?? 0,
  }));

  const producoesEntries: HistoricoEntry[] = producoes.map((producao) => ({
    id: producao.id,
    tipo: "PRODUCAO",
    descricao: `Produção: ${producao.catalogoItem.nome}`,
    valor: null,
    quantidade: producao.quantidade,
    rodada: formatarCompetencia(
      producao.rodada.competencia,
      producao.rodada.numero,
    ),
    autor: producao.criadoPor.nome,
    criadoEm: producao.criadoEm.toISOString(),
    sinal: 0,
  }));

  return [...entradas, ...producoesEntries]
    .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
    .slice(0, limite);
}
