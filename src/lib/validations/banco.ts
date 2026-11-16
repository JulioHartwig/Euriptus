import { z } from "zod";

/**
 * Valor monetário em reais, com no máximo duas casas decimais.
 * Aceita vírgula como separador decimal para facilitar o preenchimento manual,
 * embora o campo `type="number"` do navegador envie ponto.
 */
const valorMonetarioSchema = z.preprocess(
  (valor) => {
    if (typeof valor === "string") {
      const normalizado = valor.trim().replace(",", ".");
      return normalizado === "" ? undefined : Number(normalizado);
    }

    return valor;
  },
  z
    .number({ error: "Informe um valor válido." })
    .positive("O valor deve ser maior que zero.")
    .max(1_000_000_000, "Valor acima do limite permitido.")
    .refine(
      (valor) => Math.abs(valor * 100 - Math.round(valor * 100)) < 1e-6,
      "Use no máximo duas casas decimais.",
    ),
);

export const solicitarEmprestimoSchema = z.object({
  valor: valorMonetarioSchema,
});

export const aplicarInvestimentoSchema = z.object({
  valor: valorMonetarioSchema,
});

export const resgatarInvestimentoSchema = z.object({
  investimentoId: z
    .string({ error: "Investimento inválido." })
    .min(1, "Investimento inválido."),
});

export type SolicitarEmprestimoInput = z.infer<typeof solicitarEmprestimoSchema>;
export type AplicarInvestimentoInput = z.infer<typeof aplicarInvestimentoSchema>;
export type ResgatarInvestimentoInput = z.infer<typeof resgatarInvestimentoSchema>;
