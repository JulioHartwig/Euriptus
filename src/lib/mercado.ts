/** Rótulos das categorias do catálogo. */
export const CATEGORIA_ITEM_LABEL = {
  INSUMO: "Insumo",
  PRODUTO: "Produto",
  MELHORIA: "Melhoria",
} as const;

/**
 * Estado compartilhado entre o formulário do Mercado e a Server Action.
 * `submittedAt` garante feedback a cada envio, mesmo com mensagens iguais.
 */
export type MercadoActionState =
  | { status: "idle" }
  | { status: "success"; message: string; submittedAt: number }
  | {
      status: "error";
      message: string;
      fieldErrors?: { catalogoItemId?: string[]; quantidade?: string[] };
      submittedAt: number;
    };

export function totalCompra(preco: number, quantidade: number) {
  return Math.round((preco * quantidade + Number.EPSILON) * 100) / 100;
}
