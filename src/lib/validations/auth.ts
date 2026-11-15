import { z } from "zod";

/**
 * Validação compartilhada entre a tela de login e o `authorize` do NextAuth.
 * Normalizamos o e-mail para evitar duplicidade por caixa/espaços.
 */
export const loginSchema = z.object({
  email: z
    .string({ error: "Informe seu e-mail." })
    .trim()
    .toLowerCase()
    .min(1, "Informe seu e-mail.")
    .email("Informe um e-mail válido.")
    .max(254, "E-mail muito longo."),
  password: z
    .string({ error: "Informe sua senha." })
    .min(1, "Informe sua senha.")
    .max(128, "Senha muito longa."),
});

export type LoginInput = z.infer<typeof loginSchema>;
