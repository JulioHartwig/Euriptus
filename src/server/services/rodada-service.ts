import { proximaCompetencia } from "@/lib/rodada";
import { prisma } from "@/lib/prisma";
import {
  criarRodada,
  findRodadaAberta,
  findUltimaRodada,
  getUltimoNumero,
  listRodadas,
} from "@/server/repositories/rodada-repository";

export class RodadaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RodadaError";
  }
}

export function getRodadaAberta() {
  return findRodadaAberta();
}

export async function getRodadaAbertaId() {
  const r = await findRodadaAberta();
  return r?.id ?? null;
}

export async function getRodadaAtualInfo() {
  const aberta = await findRodadaAberta();
  if (aberta) {
    return {
      numero: aberta.numero,
      competencia: aberta.competencia,
      status: aberta.status as "ABERTA",
    };
  }
  const ultima = await findUltimaRodada();
  if (!ultima) return null;
  return {
    numero: ultima.numero,
    competencia: ultima.competencia,
    status: ultima.status as "FECHADA",
  };
}

export function getRodadas() {
  return listRodadas();
}

export async function abrirRodada(userId: string) {
  const aberta = await findRodadaAberta();
  if (aberta) throw new RodadaError("Já existe uma rodada aberta. Feche-a antes de abrir outra.");
  const [max, ultima] = await Promise.all([getUltimoNumero(), findUltimaRodada()]);
  const numero = (max._max.numero ?? 0) + 1;
  const competencia = proximaCompetencia(ultima?.competencia ?? null);
  return criarRodada(numero, userId, competencia);
}

export async function fecharEProcessarRodada(userId: string) {
  const aberta = await findRodadaAberta();
  if (!aberta) throw new RodadaError("Não há rodada aberta para fechar.");

  const [paramSal, paramImp] = await Promise.all([
    prisma.parametroEconomico.findUnique({ where: { nome: "SALARIO_MINIMO" } }),
    prisma.parametroEconomico.findUnique({ where: { nome: "IMPOSTO_PERCENTUAL" } }),
  ]);
  const salarioMin = paramSal ? Number(paramSal.valor) : 0;
  const impostoPct = paramImp ? Number(paramImp.valor) : 0;

  await prisma.$transaction(async (tx) => {
    const fechou = await tx.rodada.updateMany({
      where: { id: aberta.id, status: "ABERTA" },
      data: { status: "FECHADA", fechadaEm: new Date(), fechadaPorUserId: userId },
    });
    if (fechou.count === 0) throw new Error("JA_FECHADA");

    const empresas = await tx.empresa.findMany({
      select: {
        id: true,
        custosFixos: { where: { ativo: true }, select: { descricao: true, valor: true } },
        emprestimos: {
          where: { status: "ATIVO" },
          select: {
            id: true,
            parcelas: {
              where: { status: "PENDENTE", vencimento: { lte: new Date() } },
              select: { id: true, numero: true, valor: true },
              orderBy: { numero: "asc" },
            },
          },
        },
      },
    });

    for (const emp of empresas) {
      // custos fixos
      for (const c of emp.custosFixos) {
        const valor = Number(c.valor);
        if (valor <= 0) continue;
        await tx.empresa.update({ where: { id: emp.id }, data: { saldo: { decrement: valor } } });
        await tx.transacao.create({
          data: {
            empresaId: emp.id, tipo: "DESPESA", descricao: `Custo fixo: ${c.descricao}`,
            valor, rodadaId: aberta.id, criadoPorUserId: userId,
          },
        });
      }
      // salário mínimo
      if (salarioMin > 0) {
        await tx.empresa.update({ where: { id: emp.id }, data: { saldo: { decrement: salarioMin } } });
        await tx.transacao.create({
          data: {
            empresaId: emp.id, tipo: "SALARIO", descricao: "Salário mínimo (processamento da rodada)",
            valor: salarioMin, rodadaId: aberta.id, criadoPorUserId: userId,
          },
        });
      }
      // imposto sobre receitas da rodada
      const receitas = await tx.transacao.aggregate({
        where: { empresaId: emp.id, rodadaId: aberta.id, tipo: "RECEITA" },
        _sum: { valor: true },
      });
      const base = Number(receitas._sum.valor ?? 0);
      const imposto = Math.round(base * impostoPct * 100) / 100;
      if (imposto > 0) {
        await tx.empresa.update({ where: { id: emp.id }, data: { saldo: { decrement: imposto } } });
        await tx.transacao.create({
          data: {
            empresaId: emp.id, tipo: "IMPOSTO", descricao: "Imposto sobre receitas da rodada",
            valor: imposto, rodadaId: aberta.id, criadoPorUserId: userId,
          },
        });
      }
      // pagamento automático das parcelas vencidas no mês, quando há saldo
      for (const empst of emp.emprestimos) {
        for (const parcela of empst.parcelas) {
          const valor = Number(parcela.valor);
          const pagou = await tx.empresa.updateMany({
            where: { id: emp.id, saldo: { gte: valor } },
            data: { saldo: { decrement: valor } },
          });
          if (pagou.count === 0) continue;

          await tx.parcelaEmprestimo.update({
            where: { id: parcela.id },
            data: {
              status: "PAGA",
              valorPago: valor,
              pagaEm: new Date(),
              pagaPorUserId: userId,
            },
          });
          await tx.transacao.create({
            data: {
              empresaId: emp.id,
              tipo: "PAGAMENTO_EMPRESTIMO",
              descricao: `Pagamento automático da parcela ${parcela.numero} (fechamento da rodada)`,
              valor,
              rodadaId: aberta.id,
              criadoPorUserId: userId,
            },
          });

          const pendentes = await tx.parcelaEmprestimo.count({
            where: { emprestimoId: empst.id, status: "PENDENTE" },
          });
          if (pendentes === 0) {
            await tx.emprestimo.update({
              where: { id: empst.id },
              data: { status: "QUITADO", quitadoEm: new Date() },
            });
          }
        }
      }
    }
  }).catch((e) => {
    if (e instanceof Error && e.message === "JA_FECHADA") throw new RodadaError("A rodada já foi fechada.");
    throw e;
  });

  return aberta;
}
