"use server";

import { revalidatePath } from "next/cache";

import type { MercadoActionState } from "@/lib/mercado";
import { formatCurrency } from "@/lib/utils";
import {
  comprarItemSchema,
  registrarProducaoSchema,
} from "@/lib/validations/mercado";
import { requireUser } from "@/server/auth/session";
import { getEmpresaDoUsuario } from "@/server/services/empresa-service";
import {
  comprarItem,
  MercadoError,
  registrarProducaoItem,
} from "@/server/services/mercado-service";

function revalidarMercado() {
  revalidatePath("/mercado");
  revalidatePath("/estoque");
  revalidatePath("/historico");
  revalidatePath("/painel");
  revalidatePath("/financeiro");
  revalidatePath("/alertas");
}

async function getContextoMercado() {
  const user = await requireUser();

  if (user.role !== "STUDENT") {
    return { ok: false as const, erro: "Apenas estudantes podem realizar compras." };
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

export async function comprarItemAction(
  _estadoAnterior: MercadoActionState,
  formData: FormData,
): Promise<MercadoActionState> {
  const contexto = await getContextoMercado();

  if (!contexto.ok) {
    return { status: "error", message: contexto.erro, submittedAt: Date.now() };
  }

  const validacao = comprarItemSchema.safeParse({
    catalogoItemId: formData.get("catalogoItemId"),
    quantidade: formData.get("quantidade"),
  });

  if (!validacao.success) {
    const campos = validacao.error.flatten().fieldErrors;
    return {
      status: "error",
      message: campos.catalogoItemId?.[0] ?? "Revise os dados da compra.",
      fieldErrors: campos,
      submittedAt: Date.now(),
    };
  }

  try {
    const resultado = await comprarItem({
      empresaId: contexto.empresa.id,
      empresaTipo: contexto.empresa.tipo,
      userId: contexto.user.id,
      catalogoItemId: validacao.data.catalogoItemId,
      quantidade: validacao.data.quantidade,
    });

    revalidarMercado();

    const melhoria =
      resultado.item.categoria === "MELHORIA"
        ? ` Capacidade de produção: ${resultado.capacidadeProducao}.`
        : "";
    return {
      status: "success",
      message: `Compra confirmada: ${resultado.quantidade}× ${resultado.item.nome}, ${formatCurrency(resultado.valorTotal)} debitados. Novo saldo: ${formatCurrency(resultado.saldo)}. Estoque do item: ${resultado.estoqueQuantidade} un.${melhoria}`,
      submittedAt: Date.now(),
    };
  } catch (error) {
    if (error instanceof MercadoError) {
      return { status: "error", message: error.message, submittedAt: Date.now() };
    }

    throw error;
  }
}

export async function registrarProducaoAction(
  _estadoAnterior: MercadoActionState,
  formData: FormData,
): Promise<MercadoActionState> {
  const contexto = await getContextoMercado();

  if (!contexto.ok) {
    return { status: "error", message: contexto.erro, submittedAt: Date.now() };
  }

  const validacao = registrarProducaoSchema.safeParse({
    catalogoItemId: formData.get("catalogoItemId"),
    quantidade: formData.get("quantidade"),
  });

  if (!validacao.success) {
    const campos = validacao.error.flatten().fieldErrors;
    return {
      status: "error",
      message: campos.catalogoItemId?.[0] ?? "Revise a quantidade informada.",
      fieldErrors: campos,
      submittedAt: Date.now(),
    };
  }

  try {
    const resultado = await registrarProducaoItem({
      empresaId: contexto.empresa.id,
      empresaTipo: contexto.empresa.tipo,
      userId: contexto.user.id,
      catalogoItemId: validacao.data.catalogoItemId,
      quantidade: validacao.data.quantidade,
    });

    revalidarMercado();

    return {
      status: "success",
      message: `Produção registrada: ${resultado.quantidade} unidades. Capacidade usada nesta rodada: ${resultado.capacidadeUsada}/${resultado.capacidadeTotal}.`,
      submittedAt: Date.now(),
    };
  } catch (error) {
    if (error instanceof MercadoError) {
      return { status: "error", message: error.message, submittedAt: Date.now() };
    }

    throw error;
  }
}
