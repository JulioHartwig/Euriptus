import { z } from "zod";

export const comprarItemSchema = z.object({
  catalogoItemId: z
    .string({ error: "Item inválido." })
    .min(1, "Item inválido."),
  quantidade: z.preprocess(
    (valor) => {
      if (typeof valor === "string") {
        const normalizado = valor.trim();
        return normalizado === "" ? undefined : Number(normalizado);
      }
      return valor;
    },
    z
      .number({ error: "Informe uma quantidade válida." })
      .int("A quantidade deve ser um número inteiro.")
      .min(1, "A quantidade mínima é 1.")
      .max(999, "A quantidade máxima por compra é 999."),
  ),
});

export const registrarProducaoSchema = comprarItemSchema;

export type ComprarItemInput = z.infer<typeof comprarItemSchema>;
export type RegistrarProducaoInput = z.infer<typeof registrarProducaoSchema>;
