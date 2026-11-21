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
  parcelas: z.coerce
    .number({ error: "Informe a quantidade de parcelas." })
    .int("A quantidade de parcelas deve ser inteira.")
    .min(1, "Escolha ao menos 1 parcela.")
    .max(12, "O máximo é 12 parcelas."),
});

export const aplicarInvestimentoSchema = z.object({
  valor: valorMonetarioSchema,
});

export const resgatarInvestimentoSchema = z.object({
  investimentoId: z
    .string({ error: "Investimento inválido." })
    .min(1, "Investimento inválido."),
});

export const pagarParcelaSchema = z.object({
  parcelaId: z.string({ error: "Parcela inválida." }).min(1, "Parcela inválida."),
});

export const quitarEmprestimoSchema = z.object({
  emprestimoId: z
    .string({ error: "Empréstimo inválido." })
    .min(1, "Empréstimo inválido."),
});

export type SolicitarEmprestimoInput = z.infer<typeof solicitarEmprestimoSchema>;
export type AplicarInvestimentoInput = z.infer<typeof aplicarInvestimentoSchema>;
export type ResgatarInvestimentoInput = z.infer<typeof resgatarInvestimentoSchema>;
export type PagarParcelaInput = z.infer<typeof pagarParcelaSchema>;
export type QuitarEmprestimoInput = z.infer<typeof quitarEmprestimoSchema>;
