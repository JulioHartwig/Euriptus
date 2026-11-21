"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  BadgeDollarSign,
  CalendarDays,
  Check,
  Clock,
  Landmark,
  Loader2,
  PiggyBank,
  Scissors,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  arredondarValor,
  calcularLimiteEmprestimo,
  calcularTotalDevido,
  calcularValorParcela,
  calcularValorResgate,
  formatarTaxa,
  LIMITE_EMPRESTIMO_MULTIPLICADOR,
  MAX_PARCELAS_EMPRESTIMO,
} from "@/lib/banco";
import type { BancoActionState } from "@/lib/banco";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

import {
  aplicarInvestimentoAction,
  pagarParcelaAction,
  quitarEmprestimoAction,
  resgatarInvestimentoAction,
  solicitarEmprestimoAction,
} from "./actions";

export type ParcelaView = {
  id: string;
  numero: number;
  valor: number;
  vencimento: string;
  status: "PENDENTE" | "PAGA";
  valorPago: number | null;
};

export type EmprestimoView = {
  id: string;
  valorPrincipal: number;
  taxaJurosMensal: number;
  totalDevido: number;
  numeroParcelas: number;
  valorParcela: number;
  descontoAplicado: number;
  status: "ATIVO" | "QUITADO";
  criadoEm: string;
  autor: string;
  parcelas: ParcelaView[];
};

export type InvestimentoView = {
  id: string;
  valorAplicado: number;
  taxaRendimentoMensal: number;
  valorResgate: number | null;
  taxaResgateAplicada: number | null;
  status: "ATIVO" | "RESGATADO";
  criadoEm: string;
  resgatadoEm: string | null;
  autor: string;
  resgatadoPor: string | null;
};

export type TaxasBancoView = {
  jurosMensal: number;
  rendimentoMensal: number;
  descontoQuitacao: number;
  taxaResgateAntecipado: number;
};

export type BancoViewProps = {
  empresa: { nome: string; saldo: number };
  taxas: TaxasBancoView | null;
  resumo: {
    dividaTotal: number;
    emprestimosAtivos: number;
    totalAplicado: number;
    investimentosAtivos: number;
  };
  emprestimos: EmprestimoView[];
  investimentos: InvestimentoView[];
};

const ESTADO_INICIAL: BancoActionState = { status: "idle" };

export function BancoView({
  empresa,
  taxas,
  resumo,
  emprestimos,
  investimentos,
}: BancoViewProps) {
  const limite = calcularLimiteEmprestimo(empresa.saldo);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Banco"
        title="Banco"
        description={`Crédito e aplicações financeiras de ${empresa.nome}.`}
        actions={
          <Badge variant="outline" className="gap-1.5 bg-card px-3 py-1.5">
            <Wallet aria-hidden="true" className="h-3.5 w-3.5 text-primary" />
            Saldo: {formatCurrency(empresa.saldo)}
          </Badge>
        }
      />

      {!taxas ? (
        <Alert variant="warning">
          <AlertCircle aria-hidden="true" className="h-4 w-4" />
          <AlertTitle>Taxas do banco não configuradas</AlertTitle>
          <AlertDescription>
            O parâmetro econômico <code className="font-mono text-xs">JUROS_MENSAL</code>{" "}
            não foi encontrado. Peça ao professor para rodar o seed ou configurar o
            parâmetro antes de contratar empréstimos e investimentos.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="info">
          <Landmark aria-hidden="true" className="h-4 w-4" />
          <AlertTitle>Como o banco funciona nesta etapa</AlertTitle>
          <AlertDescription>
            Empréstimos de até {LIMITE_EMPRESTIMO_MULTIPLICADOR}× o saldo atual são
            creditados na hora, com juros de {formatarTaxa(taxas.jurosMensal)} por mês
            de prazo. Você pode pagar cada parcela separadamente ou quitar o contrato
            com {formatarTaxa(taxas.descontoQuitacao)} de desconto. Aplicações rendem{" "}
            {formatarTaxa(taxas.rendimentoMensal)} ao mês; resgates na mesma rodada
            não rendem e pagam {formatarTaxa(taxas.taxaResgateAntecipado)} de taxa de
            resgate antecipado.
          </AlertDescription>
        </Alert>
      )}

      <section
        aria-label="Resumo do banco"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <h2 className="sr-only">Resumo do banco</h2>
        <ResumoCard
          titulo="Saldo disponível"
          valor={formatCurrency(empresa.saldo)}
          detalhe="Caixa atual da empresa"
          icon={Wallet}
        />
        <ResumoCard
          titulo="Limite de empréstimo"
          valor={formatCurrency(limite)}
          detalhe={`${LIMITE_EMPRESTIMO_MULTIPLICADOR}× o saldo atual`}
          icon={BadgeDollarSign}
        />
        <ResumoCard
          titulo="Dívida ativa"
          valor={formatCurrency(resumo.dividaTotal)}
          detalhe={
            resumo.emprestimosAtivos === 0
              ? "Nenhum contrato ativo"
              : `${resumo.emprestimosAtivos} ${resumo.emprestimosAtivos === 1 ? "contrato ativo" : "contratos ativos"}`
          }
          icon={Landmark}
          tom={resumo.dividaTotal > 0 ? "atencao" : "neutro"}
        />
        <ResumoCard
          titulo="Investimentos ativos"
          valor={formatCurrency(resumo.totalAplicado)}
          detalhe={
            resumo.investimentosAtivos === 0
              ? "Nenhuma aplicação ativa"
              : `${resumo.investimentosAtivos} ${resumo.investimentosAtivos === 1 ? "aplicação ativa" : "aplicações ativas"}`
          }
          icon={PiggyBank}
        />
      </section>

      {taxas && (
        <div className="grid gap-6 lg:grid-cols-2">
          <EmprestimoForm
            limite={limite}
            taxaJurosMensal={taxas.jurosMensal}
            saldo={empresa.saldo}
          />
          <InvestimentoForm
            saldo={empresa.saldo}
            taxaRendimentoMensal={taxas.rendimentoMensal}
            taxaResgateAntecipado={taxas.taxaResgateAntecipado}
          />
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <EmprestimosLista
          emprestimos={emprestimos}
          descontoQuitacao={taxas?.descontoQuitacao ?? 0}
        />
        <InvestimentosLista
          investimentos={investimentos}
          taxaResgateAntecipado={taxas?.taxaResgateAntecipado ?? 0}
        />
      </div>
    </div>
  );
}

function ResumoCard({
  titulo,
  valor,
  detalhe,
  icon: Icon,
  tom = "neutro",
}: {
  titulo: string;
  valor: string;
  detalhe: string;
  icon: LucideIcon;
  tom?: "neutro" | "atencao";
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <h3 className="text-sm font-medium text-muted-foreground">{titulo}</h3>
        <Icon aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p
          className={cn(
            "font-display text-2xl font-semibold tracking-tight sm:text-3xl",
            tom === "atencao" && "text-amber-700",
          )}
        >
          {valor}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{detalhe}</p>
      </CardContent>
    </Card>
  );
}

function EmprestimoForm({
  limite,
  taxaJurosMensal,
  saldo,
}: {
  limite: number;
  taxaJurosMensal: number;
  saldo: number;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const confirmando = useRef(false);
  const [valor, setValor] = useState("");
  const [parcelas, setParcelas] = useState(1);
  const [dialogoAberto, setDialogoAberto] = useState(false);
  const [estado, formAction, pendente] = useActionState(
    solicitarEmprestimoAction,
    ESTADO_INICIAL,
  );

  useEffect(() => {
    if (estado.status === "success") {
      toast.success(estado.message);
      setValor("");
      router.refresh();
    }
  }, [estado, router]);

  const valorNumerico = converterValor(valor);
  const valorValido =
    valorNumerico !== null &&
    valorNumerico > 0 &&
    valorNumerico <= limite &&
    saldo > 0;
  const totalDevido =
    valorValido && valorNumerico !== null
      ? calcularTotalDevido(valorNumerico, taxaJurosMensal, parcelas)
      : null;
  const valorDaParcela =
    totalDevido !== null ? calcularValorParcela(totalDevido, parcelas) : null;
  const erroCampo = estado.status === "error" ? estado.fieldErrors?.valor?.[0] : undefined;
  const erroGeral = estado.status === "error" && !erroCampo ? estado.message : null;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (confirmando.current) {
      return;
    }

    event.preventDefault();
    setDialogoAberto(true);
  }

  function confirmar() {
    confirmando.current = true;
    formRef.current?.requestSubmit();
    confirmando.current = false;
  }

  return (
    <Card>
      <CardHeader>
        <span className="mb-1 flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-primary">
          <BadgeDollarSign aria-hidden="true" className="h-4 w-4" />
        </span>
        <h2 className="font-display text-lg font-semibold leading-none tracking-tight">
          Solicitar empréstimo
        </h2>
        <CardDescription>
          Até {formatCurrency(limite)} ({LIMITE_EMPRESTIMO_MULTIPLICADOR}× o saldo) com
          juros de {formatarTaxa(taxaJurosMensal)} ao mês.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          ref={formRef}
          action={formAction}
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="emprestimo-valor">Valor do empréstimo</Label>
            <div className="relative">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
              >
                R$
              </span>
              <Input
                id="emprestimo-valor"
                name="valor"
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                max={limite}
                placeholder="0,00"
                value={valor}
                onChange={(event) => setValor(event.target.value)}
                className="pl-9"
                required
                disabled={pendente || limite <= 0}
                aria-invalid={Boolean(erroCampo || erroGeral)}
                aria-describedby={
                  erroCampo || erroGeral ? "emprestimo-erro" : "emprestimo-ajuda"
                }
              />
            </div>
            <p id="emprestimo-ajuda" className="text-xs text-muted-foreground">
              {saldo > 0
                ? `Saldo atual: ${formatCurrency(saldo)}. O valor entra no caixa imediatamente.`
                : "É necessário ter saldo positivo para contratar um empréstimo."}
            </p>
            {(erroCampo || erroGeral) && (
              <p id="emprestimo-erro" className="text-xs font-medium text-destructive">
                {erroCampo ?? erroGeral}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="emprestimo-parcelas">Quantidade de parcelas</Label>
            <select
              id="emprestimo-parcelas"
              name="parcelas"
              value={parcelas}
              onChange={(event) => setParcelas(Number(event.target.value))}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={pendente || limite <= 0}
            >
              {Array.from({ length: MAX_PARCELAS_EMPRESTIMO }, (_, indice) => {
                const numero = indice + 1;
                return (
                  <option key={numero} value={numero}>
                    {numero}x de {numero === 1 ? "1 mês" : `${numero} meses`}
                  </option>
                );
              })}
            </select>
            <p className="text-xs text-muted-foreground">
              Os juros incidem sobre cada mês de prazo. Cada parcela vence a cada
              mês, acompanhando as rodadas.
            </p>
          </div>

          <div className="space-y-1.5 rounded-lg border bg-muted/30 px-3 py-2.5 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Valor de cada parcela:</span>
              <span className="font-semibold">
                {valorDaParcela !== null ? formatCurrency(valorDaParcela) : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Total a pagar:</span>
              <span className="font-semibold">
                {totalDevido !== null ? formatCurrency(totalDevido) : "—"}
              </span>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={pendente || limite <= 0}>
            {pendente ? (
              <>
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                Contratando…
              </>
            ) : (
              <>
                Revisar empréstimo
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        <AlertDialog open={dialogoAberto} onOpenChange={setDialogoAberto}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar empréstimo</AlertDialogTitle>
              <AlertDialogDescription>
                O valor será creditado agora no saldo da empresa. A dívida inclui
                os juros de {parcelas} {parcelas === 1 ? "mês" : "meses"} de prazo.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <dl className="space-y-2 rounded-lg border bg-muted/30 p-4 text-sm">
              <LinhaResumo
                rotulo="Valor solicitado"
                valor={formatCurrency(valorNumerico ?? 0)}
              />
              <LinhaResumo
                rotulo="Parcelas"
                valor={`${parcelas}x de ${valorDaParcela !== null ? formatCurrency(valorDaParcela) : "—"}`}
              />
              <LinhaResumo
                rotulo="Juros por mês"
                valor={formatarTaxa(taxaJurosMensal)}
              />
              <LinhaResumo
                rotulo="Total a pagar"
                valor={totalDevido !== null ? formatCurrency(totalDevido) : "—"}
                destaque
              />
            </dl>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmar} disabled={!valorValido}>
                Contratar empréstimo
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

function InvestimentoForm({
  saldo,
  taxaRendimentoMensal,
  taxaResgateAntecipado,
}: {
  saldo: number;
  taxaRendimentoMensal: number;
  taxaResgateAntecipado: number;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const confirmando = useRef(false);
  const [valor, setValor] = useState("");
  const [dialogoAberto, setDialogoAberto] = useState(false);
  const [estado, formAction, pendente] = useActionState(
    aplicarInvestimentoAction,
    ESTADO_INICIAL,
  );

  useEffect(() => {
    if (estado.status === "success") {
      toast.success(estado.message);
      setValor("");
      router.refresh();
    }
  }, [estado, router]);

  const valorNumerico = converterValor(valor);
  const valorValido =
    valorNumerico !== null && valorNumerico > 0 && valorNumerico <= saldo;
  const resgatePrevisto =
    valorValido && valorNumerico !== null
      ? calcularValorResgate(valorNumerico, taxaRendimentoMensal)
      : null;
  const erroCampo = estado.status === "error" ? estado.fieldErrors?.valor?.[0] : undefined;
  const erroGeral = estado.status === "error" && !erroCampo ? estado.message : null;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (confirmando.current) {
      return;
    }

    event.preventDefault();
    setDialogoAberto(true);
  }

  function confirmar() {
    confirmando.current = true;
    formRef.current?.requestSubmit();
    confirmando.current = false;
  }

  return (
    <Card>
      <CardHeader>
        <span className="mb-1 flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-primary">
          <PiggyBank aria-hidden="true" className="h-4 w-4" />
        </span>
        <h2 className="font-display text-lg font-semibold leading-none tracking-tight">
          Aplicar investimento
        </h2>
        <CardDescription>
          Rendimento de {formatarTaxa(taxaRendimentoMensal)} ao mês sobre o valor
          aplicado.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          ref={formRef}
          action={formAction}
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="investimento-valor">Valor da aplicação</Label>
            <div className="relative">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
              >
                R$
              </span>
              <Input
                id="investimento-valor"
                name="valor"
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                max={saldo}
                placeholder="0,00"
                value={valor}
                onChange={(event) => setValor(event.target.value)}
                className="pl-9"
                required
                disabled={pendente || saldo <= 0}
                aria-invalid={Boolean(erroCampo || erroGeral)}
                aria-describedby={
                  erroCampo || erroGeral ? "investimento-erro" : "investimento-ajuda"
                }
              />
            </div>
            <p id="investimento-ajuda" className="text-xs text-muted-foreground">
              Saldo disponível: {formatCurrency(saldo)}. Resgates na mesma rodada não
              rendem e perdem {formatarTaxa(taxaResgateAntecipado)} do valor aplicado.
            </p>
            {(erroCampo || erroGeral) && (
              <p id="investimento-erro" className="text-xs font-medium text-destructive">
                {erroCampo ?? erroGeral}
              </p>
            )}
          </div>

          <div className="rounded-lg border bg-muted/30 px-3 py-2.5 text-sm">
            <span className="text-muted-foreground">Resgate estimado em 1 mês: </span>
            <span className="font-semibold">
              {resgatePrevisto !== null ? formatCurrency(resgatePrevisto) : "—"}
            </span>
          </div>

          <Button type="submit" className="w-full" disabled={pendente || saldo <= 0}>
            {pendente ? (
              <>
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                Aplicando…
              </>
            ) : (
              <>
                Revisar aplicação
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        <AlertDialog open={dialogoAberto} onOpenChange={setDialogoAberto}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar aplicação</AlertDialogTitle>
              <AlertDialogDescription>
                O valor será debitado do saldo e ficará aplicado até o resgate.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <dl className="space-y-2 rounded-lg border bg-muted/30 p-4 text-sm">
              <LinhaResumo
                rotulo="Valor aplicado"
                valor={formatCurrency(valorNumerico ?? 0)}
              />
              <LinhaResumo
                rotulo="Rendimento mensal"
                valor={formatarTaxa(taxaRendimentoMensal)}
              />
              <LinhaResumo
                rotulo="Resgate estimado"
                valor={resgatePrevisto !== null ? formatCurrency(resgatePrevisto) : "—"}
                destaque
              />
            </dl>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmar} disabled={!valorValido}>
                Aplicar valor
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

function EmprestimosLista({
  emprestimos,
  descontoQuitacao,
}: {
  emprestimos: EmprestimoView[];
  descontoQuitacao: number;
}) {
  return (
    <Card>
      <CardHeader>
        <h2 className="font-display text-lg font-semibold leading-none tracking-tight">
          Empréstimos
        </h2>
        <CardDescription>
          Contratos ativos e quitados, do mais recente para o mais antigo. Pague
          parcelas ou quite antecipadamente com desconto.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {emprestimos.length === 0 ? (
          <div className="flex min-h-32 flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 px-4 py-8 text-center">
            <Landmark aria-hidden="true" className="h-7 w-7 text-muted-foreground/50" />
            <p className="mt-3 text-sm font-medium">Nenhum empréstimo contratado</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Use o formulário acima para solicitar crédito.
            </p>
          </div>
        ) : (
          <ul className="divide-y">
            {emprestimos.map((emprestimo) => (
              <EmprestimoLinha
                key={emprestimo.id}
                emprestimo={emprestimo}
                descontoQuitacao={descontoQuitacao}
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function EmprestimoLinha({
  emprestimo,
  descontoQuitacao,
}: {
  emprestimo: EmprestimoView;
  descontoQuitacao: number;
}) {
  const router = useRouter();
  const [estadoPagamento, formActionPagamento, pendentePagamento] = useActionState(
    pagarParcelaAction,
    ESTADO_INICIAL,
  );
  const [estadoQuitacao, formActionQuitacao, pendenteQuitacao] = useActionState(
    quitarEmprestimoAction,
    ESTADO_INICIAL,
  );
  const [parcelaParaPagar, setParcelaParaPagar] = useState<ParcelaView | null>(null);
  const [dialogoQuitacao, setDialogoQuitacao] = useState(false);
  const formPagamentoRef = useRef<HTMLFormElement>(null);
  const formQuitacaoRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (estadoPagamento.status === "success") {
      toast.success(estadoPagamento.message);
      setParcelaParaPagar(null);
      router.refresh();
    } else if (estadoPagamento.status === "error") {
      toast.error(estadoPagamento.message);
    }
  }, [estadoPagamento, router]);

  useEffect(() => {
    if (estadoQuitacao.status === "success") {
      toast.success(estadoQuitacao.message);
      setDialogoQuitacao(false);
      router.refresh();
    } else if (estadoQuitacao.status === "error") {
      toast.error(estadoQuitacao.message);
    }
  }, [estadoQuitacao, router]);

  const pendentes = emprestimo.parcelas.filter(
    (parcela) => parcela.status === "PENDENTE",
  );
  const saldoDevedor = arredondarValor(
    pendentes.reduce((total, parcela) => total + parcela.valor, 0),
  );
  const desconto = arredondarValor(saldoDevedor * descontoQuitacao);
  const valorQuitacao = arredondarValor(saldoDevedor - desconto);

  return (
    <li className="py-4 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display text-base font-semibold">
              {formatCurrency(emprestimo.valorPrincipal)}
            </span>
            <Badge
              variant={emprestimo.status === "ATIVO" ? "default" : "secondary"}
            >
              {emprestimo.status === "ATIVO" ? "Ativo" : "Quitado"}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <CalendarDays aria-hidden="true" className="h-3 w-3" />
              {emprestimo.numeroParcelas}x
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Contratado em {formatDate(emprestimo.criadoEm)} por {emprestimo.autor}
          </p>
          <p className="text-xs text-muted-foreground">
            Juros de {formatarTaxa(emprestimo.taxaJurosMensal)} por mês · parcelas de{" "}
            {formatCurrency(emprestimo.valorParcela)}
          </p>
          {emprestimo.descontoAplicado > 0 && (
            <p className="mt-1 text-xs font-medium text-emerald-700">
              Desconto de {formatCurrency(emprestimo.descontoAplicado)} na quitação
              antecipada
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-[0.68rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Saldo devedor
          </p>
          <p
            className={cn(
              "mt-1 font-display text-base font-semibold",
              emprestimo.status === "ATIVO" && "text-amber-700",
            )}
          >
            {formatCurrency(
              emprestimo.status === "ATIVO" ? saldoDevedor : emprestimo.totalDevido,
            )}
          </p>
        </div>
      </div>

      <ul className="mt-3 space-y-1.5 rounded-lg border bg-muted/20 px-3 py-2.5">
        {emprestimo.parcelas.map((parcela) => (
          <li
            key={parcela.id}
            className="flex flex-wrap items-center justify-between gap-2 text-xs"
          >
            <span className="flex items-center gap-2 text-muted-foreground">
              {parcela.status === "PAGA" ? (
                <Check aria-hidden="true" className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Clock aria-hidden="true" className="h-3.5 w-3.5 text-amber-600" />
              )}
              Parcela {parcela.numero} · vence em {formatDate(parcela.vencimento)}
            </span>
            <span className="flex items-center gap-2">
              <span className="font-medium">
                {formatCurrency(parcela.valorPago ?? parcela.valor)}
              </span>
              {parcela.status === "PENDENTE" && emprestimo.status === "ATIVO" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => setParcelaParaPagar(parcela)}
                  disabled={pendentePagamento || pendenteQuitacao}
                >
                  Pagar
                </Button>
              )}
            </span>
          </li>
        ))}
      </ul>

      {emprestimo.status === "ATIVO" && pendentes.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            Quitação antecipada: {formatCurrency(valorQuitacao)} com{" "}
            {formatCurrency(desconto)} de desconto (
            {formatarTaxa(descontoQuitacao)}).
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setDialogoQuitacao(true)}
            disabled={pendentePagamento || pendenteQuitacao}
          >
            <Scissors aria-hidden="true" className="h-3.5 w-3.5" />
            Quitar com desconto
          </Button>
        </div>
      )}

      <form ref={formPagamentoRef} action={formActionPagamento}>
        <input type="hidden" name="parcelaId" value={parcelaParaPagar?.id ?? ""} />
      </form>
      <AlertDialog
        open={parcelaParaPagar !== null}
        onOpenChange={(aberto) => {
          if (!aberto) setParcelaParaPagar(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pagar parcela</AlertDialogTitle>
            <AlertDialogDescription>
              Confirme o pagamento da parcela {parcelaParaPagar?.numero}. O valor será
              debitado do saldo da empresa e registrado no histórico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <dl className="space-y-2 rounded-lg border bg-muted/30 p-4 text-sm">
            <LinhaResumo
              rotulo="Parcela"
              valor={parcelaParaPagar ? String(parcelaParaPagar.numero) : "—"}
            />
            <LinhaResumo
              rotulo="Valor"
              valor={
                parcelaParaPagar ? formatCurrency(parcelaParaPagar.valor) : "—"
              }
              destaque
            />
          </dl>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => formPagamentoRef.current?.requestSubmit()}
              disabled={pendentePagamento}
            >
              Pagar parcela
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <form ref={formQuitacaoRef} action={formActionQuitacao}>
        <input type="hidden" name="emprestimoId" value={emprestimo.id} />
      </form>
      <AlertDialog open={dialogoQuitacao} onOpenChange={setDialogoQuitacao}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Quitar empréstimo</AlertDialogTitle>
            <AlertDialogDescription>
              Todas as parcelas pendentes serão pagas agora com desconto por
              quitação antecipada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <dl className="space-y-2 rounded-lg border bg-muted/30 p-4 text-sm">
            <LinhaResumo
              rotulo="Saldo devedor"
              valor={formatCurrency(saldoDevedor)}
            />
            <LinhaResumo rotulo="Desconto" valor={formatCurrency(desconto)} />
            <LinhaResumo
              rotulo="Valor a pagar"
              valor={formatCurrency(valorQuitacao)}
              destaque
            />
          </dl>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => formQuitacaoRef.current?.requestSubmit()}
              disabled={pendenteQuitacao}
            >
              Quitar empréstimo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  );
}

function InvestimentosLista({
  investimentos,
  taxaResgateAntecipado,
}: {
  investimentos: InvestimentoView[];
  taxaResgateAntecipado: number;
}) {
  return (
    <Card>
      <CardHeader>
        <h2 className="font-display text-lg font-semibold leading-none tracking-tight">
          Investimentos
        </h2>
        <CardDescription>
          Aplicações ativas e resgatadas. Resgates na mesma rodada não rendem e
          perdem {formatarTaxa(taxaResgateAntecipado)}; após um mês, rendem{" "}
          {formatarTaxa(
            investimentos[0]?.taxaRendimentoMensal ?? 0,
          )} ao mês.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {investimentos.length === 0 ? (
          <div className="flex min-h-32 flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 px-4 py-8 text-center">
            <PiggyBank
              aria-hidden="true"
              className="h-7 w-7 text-muted-foreground/50"
            />
            <p className="mt-3 text-sm font-medium">Nenhuma aplicação realizada</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Use o formulário acima para investir parte do saldo.
            </p>
          </div>
        ) : (
          <ul className="divide-y">
            {investimentos.map((investimento) => (
              <InvestimentoLinha
                key={investimento.id}
                investimento={investimento}
                taxaResgateAntecipado={taxaResgateAntecipado}
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function InvestimentoLinha({
  investimento,
  taxaResgateAntecipado,
}: {
  investimento: InvestimentoView;
  taxaResgateAntecipado: number;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [dialogoAberto, setDialogoAberto] = useState(false);
  const [estado, formAction, pendente] = useActionState(
    resgatarInvestimentoAction,
    ESTADO_INICIAL,
  );

  useEffect(() => {
    if (estado.status === "success") {
      toast.success(estado.message);
      router.refresh();
    } else if (estado.status === "error") {
      toast.error(estado.message);
    }
  }, [estado, router]);

  const resgatePrevisto = calcularValorResgate(
    investimento.valorAplicado,
    investimento.taxaRendimentoMensal,
  );
  const resgateAntecipado = arredondarValor(
    investimento.valorAplicado * (1 - taxaResgateAntecipado),
  );

  function confirmar() {
    formRef.current?.requestSubmit();
  }

  return (
    <li className="flex flex-wrap items-start justify-between gap-3 py-4 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-display text-base font-semibold">
            {formatCurrency(investimento.valorAplicado)}
          </span>
          <Badge
            variant={investimento.status === "ATIVO" ? "default" : "secondary"}
          >
            {investimento.status === "ATIVO" ? "Ativo" : "Resgatado"}
          </Badge>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Aplicado em {formatDate(investimento.criadoEm)} por {investimento.autor}
        </p>
        <p className="text-xs text-muted-foreground">
          Rendimento de {formatarTaxa(investimento.taxaRendimentoMensal)} ao mês
        </p>
        {investimento.status === "RESGATADO" && investimento.resgatadoEm && (
          <p className="mt-1 text-xs text-muted-foreground">
            Resgatado em {formatDate(investimento.resgatadoEm)}
            {investimento.resgatadoPor ? ` por ${investimento.resgatadoPor}` : ""}
            {investimento.valorResgate !== null
              ? ` · ${formatCurrency(investimento.valorResgate)}`
              : ""}
            {investimento.taxaResgateAplicada !== null &&
            investimento.taxaResgateAplicada > 0
              ? ` · taxa de ${formatarTaxa(investimento.taxaResgateAplicada)}`
              : ""}
          </p>
        )}
      </div>

      <div className="flex flex-col items-end gap-2">
        <div className="text-right">
          <p className="text-[0.68rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            {investimento.status === "ATIVO" ? "Resgate previsto" : "Valor resgatado"}
          </p>
          <p className="mt-1 font-display text-base font-semibold">
            {formatCurrency(
              investimento.valorResgate ?? resgatePrevisto,
            )}
          </p>
        </div>

        {investimento.status === "ATIVO" && (
          <>
            <form ref={formRef} action={formAction}>
              <input
                type="hidden"
                name="investimentoId"
                value={investimento.id}
              />
            </form>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDialogoAberto(true)}
              disabled={pendente}
            >
              {pendente ? (
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
              ) : (
                <TrendingUp aria-hidden="true" className="h-4 w-4" />
              )}
              Resgatar
            </Button>

            <AlertDialog
              open={dialogoAberto}
              onOpenChange={setDialogoAberto}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar resgate</AlertDialogTitle>
                  <AlertDialogDescription>
                    Se o resgate ocorrer nesta mesma rodada, não há rendimento e
                    incide a taxa de resgate antecipado. Se ocorrer após um mês,
                    o valor volta com rendimento.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <dl className="space-y-2 rounded-lg border bg-muted/30 p-4 text-sm">
                  <LinhaResumo
                    rotulo="Valor aplicado"
                    valor={formatCurrency(investimento.valorAplicado)}
                  />
                  <LinhaResumo
                    rotulo={`Nesta rodada (taxa de ${formatarTaxa(taxaResgateAntecipado)})`}
                    valor={formatCurrency(resgateAntecipado)}
                  />
                  <LinhaResumo
                    rotulo="Após 1 mês (com rendimento)"
                    valor={formatCurrency(resgatePrevisto)}
                    destaque
                  />
                </dl>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={confirmar}>
                    Resgatar investimento
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </div>
    </li>
  );
}

function LinhaResumo({
  rotulo,
  valor,
  destaque = false,
}: {
  rotulo: string;
  valor: string;
  destaque?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{rotulo}</dt>
      <dd className={cn("font-medium", destaque && "text-base font-semibold")}>
        {valor}
      </dd>
    </div>
  );
}

/** Converte o texto do input em número; `null` quando ainda não é válido. */
function converterValor(valor: string) {
  if (valor.trim() === "") {
    return null;
  }

  const numero = Number(valor.replace(",", "."));

  return Number.isFinite(numero) ? numero : null;
}
