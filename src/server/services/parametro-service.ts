import { listParametros, updateParametro } from "@/server/repositories/parametro-repository";

export class ParametroError extends Error {
  constructor(message: string) { super(message); this.name = "ParametroError"; }
}

export function getParametros() {
  return listParametros();
}

export async function salvarParametro(nome: string, valor: number, descricao: string) {
  if (!Number.isFinite(valor)) throw new ParametroError("Valor inválido.");
  return updateParametro(nome, { valor, descricao: descricao.trim() });
}
