"use server";

import { revalidatePath } from "next/cache";

import type { BancoActionState } from "@/lib/banco";
import { formatCurrency } from "@/lib/utils";
import {
  aplicarInvestimentoSchema,
  resgatarInvestimentoSchema,
  solicitarEmprestimoSchema,
} from "@/lib/validations/banco";
import { requireUser } from "@/server/auth/session";
import { getEmpresaDoUsuario } from "@/server/services/empresa-service";
import {
  aplicarInvestimento,
  BancoError,
  resgatarInvestimento,
  solicitarEmprestimo,
} from "@/server/services/banco-service";

function revalidarPaginasDoBanco() {
  revalidatePath("/banco");
  revalidatePath("/painel");
  revalidatePath("/financeiro");
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
    const resultado = await solicitarEmprestimo({
      empresaId: contexto.empresa.id,
      userId: contexto.user.id,
      valor: validacao.data.valor,
    });

    revalidarPaginasDoBanco();

    return {
      status: "success",
      message: `Empréstimo de ${formatCurrency(resultado.emprestimo.valorPrincipal)} contratado. Total a pagar em 1 mês: ${formatCurrency(resultado.totalDevido)}.`,
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
      message: `Aplicação de ${formatCurrency(resultado.investimento.valorAplicado)} realizada. Resgate estimado em 1 mês: ${formatCurrency(resultado.valorResgatePrevisto)}.`,
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
      message: `Resgate de ${formatCurrency(resultado.valorResgate)} creditado no saldo.`,
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
