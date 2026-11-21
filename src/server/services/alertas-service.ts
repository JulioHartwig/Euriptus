import { CAPACIDADE_BASE_POR_TIPO } from "@/lib/empresa";
import { formatarCompetencia } from "@/lib/rodada";
import { formatCurrency } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

export type Alerta = {
  id: string;
  severidade: "urgente" | "atencao" | "info";
  titulo: string;
  descricao: string;
  href: string;
};

const LIMITE_SALDO_BAIXO = 100;

/** Alertas derivados do estado atual — não exigem persistência nem leitura. */
export async function getAlertas(usuario: {
  id: string;
  role: "STUDENT" | "TEACHER";
  empresaId: string | null;
  empresaTipo: "PRODUTOR" | "LOGISTICA" | "BENEFICIAMENTO" | "VENDA" | null;
}): Promise<Alerta[]> {
  if (usuario.role === "TEACHER") {
    return getAlertasProfessor();
  }

  if (!usuario.empresaId || !usuario.empresaTipo) {
    return [
      {
        id: "sem-empresa",
        severidade: "atencao",
        titulo: "Conta sem empresa",
        descricao: "Peça ao professor para vincular seu usuário a uma empresa.",
        href: "/painel",
      },
    ];
  }

  const empresaId = usuario.empresaId;
  const rodada = await prisma.rodada.findFirst({ where: { status: "ABERTA" } });
  const [empresa, parcelasVencidas, propostasPendentes, producao, produtos] =
    await Promise.all([
      prisma.empresa.findUnique({
        where: { id: empresaId },
        select: { saldo: true, capacidadeProducao: true },
      }),
      prisma.parcelaEmprestimo.count({
        where: {
          status: "PENDENTE",
          vencimento: { lt: new Date() },
          emprestimo: { empresaId },
        },
      }),
      prisma.proposta.count({
        where: { empresaDestinoId: empresaId, status: "PENDENTE" },
      }),
      prisma.producaoRodada.aggregate({
        where: {
          empresaId,
          rodadaId: rodada?.id ?? "__nenhuma__",
        },
        _sum: { quantidade: true },
      }),
      prisma.catalogoItem.findMany({
        where: {
          ativo: true,
          categoria: "PRODUTO",
          OR: [{ empresaTipo: null }, { empresaTipo: usuario.empresaTipo }],
        },
        select: { id: true, nome: true },
      }),
    ]);

  const alertas: Alerta[] = [];

  if (!rodada) {
    alertas.push({
      id: "sem-rodada",
      severidade: "atencao",
      titulo: "Nenhuma rodada aberta",
      descricao: "Aguarde o professor abrir a rodada para produzir e registrar operações.",
      href: "/painel",
    });
  } else if (empresa) {
    const capacidade =
      CAPACIDADE_BASE_POR_TIPO[usuario.empresaTipo] + empresa.capacidadeProducao;
    const usado = producao._sum.quantidade ?? 0;

    if (usado >= capacidade) {
      alertas.push({
        id: "capacidade-esgotada",
        severidade: "atencao",
        titulo: "Capacidade do mês esgotada",
        descricao: `Você usou ${usado} de ${capacidade} unidades. Compre melhorias no mercado para ampliar o limite.`,
        href: "/mercado",
      });
    }
  }

  if (parcelasVencidas > 0) {
    alertas.push({
      id: "parcelas-vencidas",
      severidade: "urgente",
      titulo:
        parcelasVencidas === 1
          ? "1 parcela de empréstimo vencida"
          : `${parcelasVencidas} parcelas de empréstimo vencidas`,
      descricao: "Pague no Banco para evitar atraso. Parcelas vencidas não são pagas automaticamente.",
      href: "/banco",
    });
  }

  if (empresa && Number(empresa.saldo) < LIMITE_SALDO_BAIXO) {
    alertas.push({
      id: "saldo-baixo",
      severidade: "atencao",
      titulo: "Saldo baixo",
      descricao: `Saldo atual de ${formatCurrency(Number(empresa.saldo))}. Considere uma venda ou empréstimo.`,
      href: "/financeiro",
    });
  }

  if (propostasPendentes > 0) {
    alertas.push({
      id: "propostas-pendentes",
      severidade: "info",
      titulo:
        propostasPendentes === 1
          ? "1 proposta aguardando sua resposta"
          : `${propostasPendentes} propostas aguardando sua resposta`,
      descricao: "Acesse Negociações para aceitar ou recusar.",
      href: "/negociacoes",
    });
  }

  if (produtos.length > 0 && rodada) {
    const estoqueProdutos = await prisma.estoqueItem.count({
      where: {
        empresaId,
        quantidade: { gt: 0 },
        catalogoItemId: { in: produtos.map((produto) => produto.id) },
      },
    });

    if (estoqueProdutos === 0) {
      alertas.push({
        id: "sem-produto-estoque",
        severidade: "info",
        titulo: "Sem produto em estoque",
        descricao:
          "Registre a produção no Mercado ou compre o produto para poder oferecer negociações.",
        href: "/mercado",
      });
    }
  }

  return alertas;
}

async function getAlertasProfessor(): Promise<Alerta[]> {
  const aberta = await prisma.rodada.findFirst({ where: { status: "ABERTA" } });
  const [eventosDaRodada, propostasPendentes] = await Promise.all([
    aberta
      ? prisma.eventoAtivo.count({ where: { rodadaId: aberta.id } })
      : Promise.resolve(0),
    prisma.proposta.count({ where: { status: "PENDENTE" } }),
  ]);

  const alertas: Alerta[] = [];

  if (!aberta) {
    alertas.push({
      id: "professor-sem-rodada",
      severidade: "atencao",
      titulo: "Nenhuma rodada aberta",
      descricao: "Abra a próxima rodada/mês para liberar as operações dos estudantes.",
      href: "/professor/rodadas",
    });
  } else {
    alertas.push({
      id: "professor-rodada-aberta",
      severidade: "info",
      titulo: `Rodada ${aberta.numero} aberta`,
      descricao: aberta.competencia
        ? `Competência de ${formatarCompetencia(aberta.competencia, aberta.numero)}.`
        : "Rodada em andamento.",
      href: "/professor/rodadas",
    });
  }

  if (eventosDaRodada > 0) {
    alertas.push({
      id: "professor-eventos",
      severidade: "info",
      titulo: `${eventosDaRodada} ${eventosDaRodada === 1 ? "evento na rodada" : "eventos na rodada"}`,
      descricao: "Eventos econômicos disparados nesta rodada podem afetar as empresas.",
      href: "/professor/eventos",
    });
  }

  if (propostasPendentes > 0) {
    alertas.push({
      id: "professor-propostas",
      severidade: "atencao",
      titulo: `${propostasPendentes} ${propostasPendentes === 1 ? "proposta pendente" : "propostas pendentes"}`,
      descricao: "Negociações aguardando aceite entre empresas.",
      href: "/professor",
    });
  }

  return alertas;
}
