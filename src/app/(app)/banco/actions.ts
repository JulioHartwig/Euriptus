"use server";

import { revalidatePath } from "next/cache";

import type { BancoActionState } from "@/lib/banco";
import { formatCurrency } from "@/lib/utils";
import {
  aplicarInvestimentoSchema,
  pagarParcelaSchema,
  quitarEmprestimoSchema,
  resgatarInvestimentoSchema,
  solicitarEmprestimoSchema,
} from "@/lib/validations/banco";
import { requireUser } from "@/server/auth/session";
import { getEmpresaDoUsuario } from "@/server/services/empresa-service";
import {
  aplicarInvestimento,
  BancoError,
  pagarParcela,
  quitarEmprestimo,
  resgatarInvestimento,
  solicitarEmprestimo,
} from "@/server/services/banco-service";

function revalidarPaginasDoBanco() {
  revalidatePath("/banco");
  revalidatePath("/painel");
  revalidatePath("/financeiro");
  revalidatePath("/historico");
  revalidatePath("/estoque");
  revalidatePath("/alertas");
}

/**
 * Contexto comum das ações do Banco: sessão válida, papel STUDENT e empresa
 * vinculada. As Server Actions são o limite de confiança — a página também
 * valida, mas a autorização nunca depende apenas da interface.
 */
async function getContextoDoBanco() {
  const user = await requireUser();

  if (user.role !== "STUDENT") {
    return {
      ok: false as const,
      erro: "Apenas estudantes podem contratar empréstimos ou investir.",
    };
  }

  const empresa = await getEmpresaDoUsuario(user.id);

  if (!empresa) {
    return {
      ok: false as const,
      erro: "Sua conta ainda não está vinculada a uma empresa.",
    };
  }

  return { ok: true as const, user, empresa };
}

export async function solicitarEmprestimoAction(
  _estadoAnterior: BancoActionState,
  formData: FormData,
): Promise<BancoActionState> {
  const contexto = await getContextoDoBanco();

  if (!contexto.ok) {
    return {
      status: "error",
      message: contexto.erro,
      submittedAt: Date.now(),
    };
  }

  const validacao = solicitarEmprestimoSchema.safeParse({
    valor: formData.get("valor"),
    parcelas: formData.get("parcelas") ?? 1,
  });

  if (!validacao.success) {
    return {
      status: "error",
      message: "Revise os dados do empréstimo.",
      fieldErrors: validacao.error.flatten().fieldErrors,
      submittedAt: Date.now(),
    };
  }

  try {
    const resultado = await solicitarEmprestimo({
      empresaId: contexto.empresa.id,
      userId: contexto.user.id,
      valor: validacao.data.valor,
      parcelas: validacao.data.parcelas,
    });

    revalidarPaginasDoBanco();

    return {
      status: "success",
      message: `Empréstimo de ${formatCurrency(resultado.emprestimo.valorPrincipal)} contratado em ${resultado.numeroParcelas}x de ${formatCurrency(resultado.valorParcela)}. Total: ${formatCurrency(resultado.totalDevido)}.`,
      submittedAt: Date.now(),
    };
  } catch (error) {
    if (error instanceof BancoError) {
      return {
        status: "error",
        message: error.message,
        submittedAt: Date.now(),
      };
    }

    throw error;
  }
}

export async function pagarParcelaAction(
  _estadoAnterior: BancoActionState,
  formData: FormData,
): Promise<BancoActionState> {
  const contexto = await getContextoDoBanco();

  if (!contexto.ok) {
    return {
      status: "error",
      message: contexto.erro,
      submittedAt: Date.now(),
    };
  }

  const validacao = pagarParcelaSchema.safeParse({
    parcelaId: formData.get("parcelaId"),
  });

  if (!validacao.success) {
    return {
      status: "error",
      message: "Parcela inválida.",
      submittedAt: Date.now(),
    };
  }

  try {
    await pagarParcela({
      empresaId: contexto.empresa.id,
      userId: contexto.user.id,
      parcelaId: validacao.data.parcelaId,
    });

    revalidarPaginasDoBanco();

    return {
      status: "success",
      message: "Parcela paga e lançamento registrado no histórico.",
      submittedAt: Date.now(),
    };
  } catch (error) {
    if (error instanceof BancoError) {
      return {
        status: "error",
        message: error.message,
        submittedAt: Date.now(),
      };
    }

    throw error;
  }
}

export async function quitarEmprestimoAction(
  _estadoAnterior: BancoActionState,
  formData: FormData,
): Promise<BancoActionState> {
  const contexto = await getContextoDoBanco();

  if (!contexto.ok) {
    return {
      status: "error",
      message: contexto.erro,
      submittedAt: Date.now(),
    };
  }

  const validacao = quitarEmprestimoSchema.safeParse({
    emprestimoId: formData.get("emprestimoId"),
  });

  if (!validacao.success) {
    return {
      status: "error",
      message: "Empréstimo inválido.",
      submittedAt: Date.now(),
    };
  }

  try {
    const resultado = await quitarEmprestimo({
      empresaId: contexto.empresa.id,
      userId: contexto.user.id,
      emprestimoId: validacao.data.emprestimoId,
    });

    revalidarPaginasDoBanco();

    return {
      status: "success",
      message: `Quitação concluída: ${formatCurrency(resultado.valorPago)} pagos com ${formatCurrency(resultado.desconto)} de desconto.`,
      submittedAt: Date.now(),
    };
  } catch (error) {
    if (error instanceof BancoError) {
      return {
        status: "error",
        message: error.message,
        submittedAt: Date.now(),
      };
    }

    throw error;
  }
}

export async function aplicarInvestimentoAction(
  _estadoAnterior: BancoActionState,
  formData: FormData,
): Promise<BancoActionState> {
  const contexto = await getContextoDoBanco();

  if (!contexto.ok) {
    return {
      status: "error",
      message: contexto.erro,
      submittedAt: Date.now(),
    };
  }

  const validacao = aplicarInvestimentoSchema.safeParse({
    valor: formData.get("valor"),
  });

  if (!validacao.success) {
    return {
      status: "error",
      message: "Revise o valor informado.",
      fieldErrors: validacao.error.flatten().fieldErrors,
      submittedAt: Date.now(),
    };
  }

  try {
    const resultado = await aplicarInvestimento({
      empresaId: contexto.empresa.id,
      userId: contexto.user.id,
      valor: validacao.data.valor,
    });

    revalidarPaginasDoBanco();

    return {
      status: "success",
      message: `Aplicação de ${formatCurrency(resultado.investimento.valorAplicado)} realizada. Se resgatada nesta rodada, incidirá taxa de resgate antecipado; após 1 mês, resgate estimado de ${formatCurrency(resultado.valorResgatePrevisto)}.`,
      submittedAt: Date.now(),
    };
  } catch (error) {
    if (error instanceof BancoError) {
      return {
        status: "error",
        message: error.message,
        submittedAt: Date.now(),
      };
    }

    throw error;
  }
}

export async function resgatarInvestimentoAction(
  _estadoAnterior: BancoActionState,
  formData: FormData,
): Promise<BancoActionState> {
  const contexto = await getContextoDoBanco();

  if (!contexto.ok) {
    return {
      status: "error",
      message: contexto.erro,
      submittedAt: Date.now(),
    };
  }

  const validacao = resgatarInvestimentoSchema.safeParse({
    investimentoId: formData.get("investimentoId"),
  });

  if (!validacao.success) {
    return {
      status: "error",
      message: "Investimento inválido.",
      submittedAt: Date.now(),
    };
  }

  try {
    const resultado = await resgatarInvestimento({
      empresaId: contexto.empresa.id,
      userId: contexto.user.id,
      investimentoId: validacao.data.investimentoId,
    });

    revalidarPaginasDoBanco();

    return {
      status: "success",
      message: resultado.mesmaRodada
        ? `Resgate na mesma rodada: ${formatCurrency(resultado.valorResgate)} creditados, sem rendimento e com taxa de ${(resultado.taxaResgate * 100).toFixed(2).replace(".", ",")}%.`
        : `Resgate de ${formatCurrency(resultado.valorResgate)} com rendimento creditado no saldo.`,
      submittedAt: Date.now(),
    };
  } catch (error) {
    if (error instanceof BancoError) {
      return {
        status: "error",
        message: error.message,
        submittedAt: Date.now(),
      };
    }

    throw error;
  }
}
