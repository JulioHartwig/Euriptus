import { z } from "zod";

const valorMonetario = z.preprocess(
  (v) => (typeof v === "string" ? (v.trim() === "" ? undefined : Number(v.replace(",", "."))) : v),
  z.number({ error: "Informe um valor válido." }).positive("O valor deve ser maior que zero.").max(1_000_000_000),
);

export const criarPropostaSchema = z.object({
  empresaDestinoId: z.string({ error: "Selecione a empresa destinatária." }).min(1),
  catalogoItemId: z.string({ error: "Selecione o item." }).min(1),
  quantidade: z.preprocess(
    (v) => (typeof v === "string" ? (v.trim() === "" ? undefined : Number(v)) : v),
    z.number({ error: "Informe a quantidade." }).int("Quantidade inteira.").min(1).max(999),
  ),
  valorTotal: valorMonetario,
  mensagem: z.string().trim().max(280).optional().or(z.literal("")),
});

export const responderPropostaSchema = z.object({
  propostaId: z.string().min(1),
});

export type CriarPropostaInput = z.infer<typeof criarPropostaSchema>;
