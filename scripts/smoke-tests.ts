import assert from "node:assert/strict";

import { calcularLimiteEmprestimo, calcularTotalDevido, calcularValorResgate, arredondarValor } from "../src/lib/banco";
import { getInitials, firstName } from "../src/lib/utils";
import { criarPropostaSchema } from "../src/lib/validations/negociacao";

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

test("calcula total devido e resgate", () => {
  assert.equal(calcularTotalDevido(1000, 0.02), 1020);
  assert.equal(calcularValorResgate(500, 0.01), 505);
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

console.log("smoke tests passed");
