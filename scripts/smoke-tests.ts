import assert from "node:assert/strict";
import { CatalogoItemCategoria } from "@prisma/client";

import {
  adicionarMeses,
  arredondarValor,
  calcularDescontoQuitacao,
  calcularLimiteEmprestimo,
  calcularTotalDevido,
  calcularValorParcela,
  calcularValorResgate,
} from "../src/lib/banco";
import { CAPACIDADE_BASE_POR_TIPO } from "../src/lib/empresa";
import { TRANSACAO_SINAL } from "../src/lib/financeiro";
import { totalCompra } from "../src/lib/mercado";
import { formatarCompetencia, proximaCompetencia } from "../src/lib/rodada";
import { firstName, getInitials } from "../src/lib/utils";
import { solicitarEmprestimoSchema } from "../src/lib/validations/banco";
import { comprarItemSchema } from "../src/lib/validations/mercado";
import { criarPropostaSchema } from "../src/lib/validations/negociacao";
import { catalogoSchema } from "../src/lib/validations/professor";

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (e) {
    console.error(`not ok - ${name}`);
    throw e;
  }
}

test("arredondarValor arredonda centavos", () => {
  assert.equal(arredondarValor(10.005), 10.01);
  assert.equal(arredondarValor(10.004), 10);
});

test("calcula limite de empréstimo (3x saldo, mínimo 0)", () => {
  assert.equal(calcularLimiteEmprestimo(1000), 3000);
  assert.equal(calcularLimiteEmprestimo(-50), 0);
});

test("empréstimo parcelado calcula total e valor da parcela", () => {
  assert.equal(calcularTotalDevido(1000, 0.02), 1020);
  assert.equal(calcularTotalDevido(1000, 0.02, 3), 1060);
  assert.equal(calcularValorParcela(1060, 3), 353.33);
});

test("quitação e resgate antecipado usam as taxas corretas", () => {
  assert.equal(calcularDescontoQuitacao(1000, 0.05), 50);
  assert.equal(calcularValorResgate(500, 0.01), 505);
  assert.equal(calcularValorResgate(500, 0.01, true, 0.05), 475);
});

test("adicionarMeses ajusta meses mais curtos", () => {
  const janeiro = new Date("2026-01-31T12:30:00.000Z");
  const fevereiro = adicionarMeses(janeiro, 1);
  assert.equal(fevereiro.toISOString(), "2026-02-28T12:30:00.000Z");
});

test("competência mensal avança um mês e é formatada em pt-BR", () => {
  const competencia = proximaCompetencia(new Date("2026-01-15T10:00:00.000Z"));
  assert.equal(competencia.toISOString(), "2026-02-01T00:00:00.000Z");
  assert.equal(formatarCompetencia(competencia), "02/2026");
  assert.equal(formatarCompetencia(null, 7), "Rodada 7");
});

test("capacidade-base cobre as quatro etapas", () => {
  assert.deepEqual(CAPACIDADE_BASE_POR_TIPO, {
    PRODUTOR: 100,
    LOGISTICA: 60,
    BENEFICIAMENTO: 80,
    VENDA: 70,
  });
});

test("totalCompra arredonda corretamente", () => {
  assert.equal(totalCompra(19.99, 3), 59.97);
  assert.equal(totalCompra(0, 10), 0);
});

test("TRANSACAO_SINAL cobre os tipos de lançamento", () => {
  assert.equal(TRANSACAO_SINAL.RECEITA, 1);
  assert.equal(TRANSACAO_SINAL.DESPESA, -1);
  assert.equal(TRANSACAO_SINAL.PAGAMENTO_EMPRESTIMO, -1);
  assert.equal(TRANSACAO_SINAL.RESGATE, 1);
});

test("getInitials e firstName", () => {
  assert.equal(getInitials("Ana Produtora"), "AP");
  assert.equal(getInitials("Professor"), "PR");
  assert.equal(firstName("Carlos Logística"), "Carlos");
});

test("criarPropostaSchema valida e normaliza", () => {
  const ok = criarPropostaSchema.safeParse({
    empresaDestinoId: "emp1",
    catalogoItemId: "item1",
    quantidade: "2",
    valorTotal: "10,50",
    mensagem: "  oi  ",
  });
  assert.equal(ok.success, true);
  if (ok.success) {
    assert.equal(ok.data.quantidade, 2);
    assert.equal(ok.data.valorTotal, 10.5);
    assert.equal(ok.data.mensagem, "oi");
  }

  const bad = criarPropostaSchema.safeParse({
    empresaDestinoId: "emp1",
    catalogoItemId: "item1",
    quantidade: 0,
    valorTotal: -1,
  });
  assert.equal(bad.success, false);
});

test("comprarItemSchema aceita strings e limita a quantidade", () => {
  const ok = comprarItemSchema.safeParse({ catalogoItemId: "item1", quantidade: "3" });
  assert.equal(ok.success, true);
  if (ok.success) assert.equal(ok.data.quantidade, 3);

  assert.equal(
    comprarItemSchema.safeParse({ catalogoItemId: "item1", quantidade: "1000" }).success,
    false,
  );
});

test("solicitarEmprestimoSchema limita a 12 parcelas", () => {
  const ok = solicitarEmprestimoSchema.safeParse({ valor: "1000,50", parcelas: "6" });
  assert.equal(ok.success, true);
  if (ok.success) {
    assert.equal(ok.data.valor, 1000.5);
    assert.equal(ok.data.parcelas, 6);
  }

  assert.equal(
    solicitarEmprestimoSchema.safeParse({ valor: "100", parcelas: "13" }).success,
    false,
  );
});

test("catalogoSchema aceita melhorias com capacidade e marketing", () => {
  const ok = catalogoSchema.safeParse({
    nome: "Campanha de marketing",
    descricao: "Aumenta a receita das vendas realizadas.",
    unidade: "campanha",
    preco: "1300.00",
    empresaTipo: "VENDA",
    categoria: "MELHORIA",
    aumentoCapacidade: "10",
    aumentoMarketing: "0.10",
    ativo: "on",
  });
  assert.equal(ok.success, true);
  if (ok.success) {
    assert.equal(ok.data.categoria, CatalogoItemCategoria.MELHORIA);
    assert.equal(ok.data.aumentoCapacidade, 10);
    assert.equal(ok.data.aumentoMarketing, 0.1);
    assert.equal(ok.data.ativo, true);
  }

  assert.equal(
    catalogoSchema.safeParse({
      nome: "Item inválido",
      descricao: "Descrição válida para teste.",
      unidade: "un",
      preco: "0",
      empresaTipo: "",
      categoria: "INSUMO",
      aumentoCapacidade: "0",
      aumentoMarketing: "0",
      ativo: "on",
    }).success,
    false,
  );
});

console.log("smoke tests passed");
