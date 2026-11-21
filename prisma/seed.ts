import {
  CatalogoItemCategoria,
  EmpresaTipo,
  NoticiaTipo,
  PrismaClient,
  Role,
  TransacaoTipo,
} from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const SENHA_DEMO = process.env.SEED_PASSWORD ?? "senha123";

/**
 * Notícias de demonstração.
 *
 * São globais (não pertencem a uma empresa) e servem para a área "Notícias do
 * mercado" do painel. Nesta etapa são apenas conteúdo estático: ainda não há
 * eventos econômicos nem edição pelo professor.
 *
 * Como `Noticia` não tem campo único, a idempotência é feita por título:
 * notícias já existentes não são duplicadas nem sobrescritas.
 */
const NOTICIAS: Array<{
  titulo: string;
  corpo: string;
  tipo: NoticiaTipo;
}> = [
  {
    titulo: "Bem-vindos à primeira partida do Euriptus",
    tipo: NoticiaTipo.AVISO,
    corpo: [
      "Cada grupo administra uma empresa da cadeia produtiva do café: produção, logística, beneficiamento ou venda.",
      "Vocês começarão com um saldo em caixa e deverão comprar suprimentos, negociar com as outras empresas e acompanhar os custos ao longo das rodadas.",
      "Fiquem de olho nesta área: as notícias do mercado e os avisos do professor aparecem aqui.",
    ].join("\n\n"),
  },
  {
    titulo: "Cotação do café sobe no mercado interno",
    tipo: NoticiaTipo.MERCADO,
    corpo: [
      "O preço da saca de café subiu nos últimos dias por causa da menor oferta no mercado interno.",
      "Para quem vende café, o momento pode ser bom para fechar negócios. Para quem compra, vale comparar as propostas com calma antes de aceitar.",
      "Notícia de exemplo do cenário inicial: os efeitos reais de preço serão aplicados quando os eventos econômicos forem implementados.",
    ].join("\n\n"),
  },
  {
    titulo: "Combustível mais caro pressiona o transporte",
    tipo: NoticiaTipo.EVENTO,
    corpo: [
      "O aumento do diesel encarece o deslocamento de cargas entre as etapas da cadeia.",
      "Empresas que dependem de transporte devem considerar esse custo nas próximas negociações.",
      "Notícia de exemplo: ainda não há variação automática de preços nesta versão do simulador.",
    ].join("\n\n"),
  },
];

async function criarNoticiasDeDemonstracao() {
  let criadas = 0;

  for (const noticia of NOTICIAS) {
    const existente = await prisma.noticia.findFirst({
      where: { titulo: noticia.titulo },
      select: { id: true },
    });

    if (!existente) {
      await prisma.noticia.create({ data: noticia });
      criadas += 1;
    }
  }

  return criadas;
}

/**
 * Parâmetros econômicos globais.
 * Percentuais ficam como fração: 0,08 = 8%. `create` apenas se não existir,
 * para que uma futura edição pelo professor não seja sobrescrita pelo seed.
 */
const PARAMETROS_ECONOMICOS = [
  {
    nome: "JUROS_MENSAL",
    valor: "0.0200",
    descricao: "Juros mensal sobre empréstimos e base para rendimento de investimentos.",
  },
  {
    nome: "IMPOSTO_PERCENTUAL",
    valor: "0.0800",
    descricao: "Imposto aplicado sobre a receita da empresa.",
  },
  {
    nome: "SALARIO_MINIMO",
    valor: "1518.0000",
    descricao: "Salário mínimo mensal de referência, em reais.",
  },
  {
    nome: "DESCONTO_QUITACAO",
    valor: "0.0500",
    descricao: "Desconto concedido na quitação antecipada de empréstimos.",
  },
  {
    nome: "TAXA_RESGATE_ANTECIPADO",
    valor: "0.0500",
    descricao: "Taxa cobrada no resgate de investimento na mesma rodada da aplicação.",
  },
] as const;

/**
 * Catálogo fixo de suprimentos para a Etapa 5 (Mercado).
 * Cada item pode ser restrito a um tipo de empresa; preço fixo em reais.
 * Seed idempotente por nome.
 */
const CATALOGO: Array<{
  nome: string;
  descricao: string;
  unidade: string;
  preco: string;
  empresaTipo: EmpresaTipo | null;
  categoria?: CatalogoItemCategoria;
  aumentoCapacidade?: number;
  aumentoMarketing?: string;
}> = [
  {
    nome: "Mudas de café",
    descricao: "Mudas selecionadas para plantio e renovação do cafezal.",
    unidade: "lote (50 mudas)",
    preco: "450.00",
    empresaTipo: EmpresaTipo.PRODUTOR,
  },
  {
    nome: "Adubo e defensivos",
    descricao: "Insumos básicos para manejo e proteção da lavoura.",
    unidade: "saco",
    preco: "180.00",
    empresaTipo: EmpresaTipo.PRODUTOR,
  },
  {
    nome: "Combustível para transporte",
    descricao: "Diesel para deslocamento e entrega das cargas.",
    unidade: "tanque",
    preco: "320.00",
    empresaTipo: EmpresaTipo.LOGISTICA,
  },
  {
    nome: "Embalagens para frete",
    descricao: "Caixas e proteção para acondicionar grãos no transporte.",
    unidade: "pacote",
    preco: "90.00",
    empresaTipo: EmpresaTipo.LOGISTICA,
  },
  {
    nome: "Sacos de juta",
    descricao: "Embalagem para armazenamento dos grãos beneficiados.",
    unidade: "fardo (20 un.)",
    preco: "140.00",
    empresaTipo: EmpresaTipo.BENEFICIAMENTO,
  },
  {
    nome: "Serviço de torra",
    descricao: "Torra e preparo padrão de um lote de grãos.",
    unidade: "lote",
    preco: "600.00",
    empresaTipo: EmpresaTipo.BENEFICIAMENTO,
  },
  {
    nome: "Embalagens para varejo",
    descricao: "Pacotes rotulados para venda ao consumidor.",
    unidade: "pacote (100 un.)",
    preco: "250.00",
    empresaTipo: EmpresaTipo.VENDA,
  },
  {
    nome: "Material de divulgação",
    descricao: "Cartazes e materiais simples para ponto de venda.",
    unidade: "kit",
    preco: "120.00",
    empresaTipo: EmpresaTipo.VENDA,
  },

  // Produtos/serviços registrados na produção mensal de cada etapa.
  {
    nome: "Café em grãos",
    descricao: "Produção de café em grãos pronta para a próxima etapa.",
    unidade: "saca",
    preco: "400.00",
    empresaTipo: EmpresaTipo.PRODUTOR,
    categoria: CatalogoItemCategoria.PRODUTO,
  },
  {
    nome: "Serviço de transporte",
    descricao: "Viagem de transporte entre as etapas da cadeia.",
    unidade: "viagem",
    preco: "500.00",
    empresaTipo: EmpresaTipo.LOGISTICA,
    categoria: CatalogoItemCategoria.PRODUTO,
  },
  {
    nome: "Café beneficiado",
    descricao: "Lote de grãos processado e pronto para distribuição.",
    unidade: "lote",
    preco: "700.00",
    empresaTipo: EmpresaTipo.BENEFICIAMENTO,
    categoria: CatalogoItemCategoria.PRODUTO,
  },
  {
    nome: "Café pronto para venda",
    descricao: "Pacote de café embalado para o consumidor final.",
    unidade: "pacote",
    preco: "80.00",
    empresaTipo: EmpresaTipo.VENDA,
    categoria: CatalogoItemCategoria.PRODUTO,
  },

  // Melhorias: ampliam a capacidade mensal ou o marketing da empresa de venda.
  {
    nome: "Ampliação de área",
    descricao: "Incorpora nova área de cultivo à produção mensal.",
    unidade: "implantação",
    preco: "1500.00",
    empresaTipo: EmpresaTipo.PRODUTOR,
    categoria: CatalogoItemCategoria.MELHORIA,
    aumentoCapacidade: 30,
  },
  {
    nome: "Tecnologia de irrigação",
    descricao: "Sistema de irrigação que aumenta a produtividade da lavoura.",
    unidade: "sistema",
    preco: "1200.00",
    empresaTipo: EmpresaTipo.PRODUTOR,
    categoria: CatalogoItemCategoria.MELHORIA,
    aumentoCapacidade: 20,
  },
  {
    nome: "Adubo de alto rendimento",
    descricao: "Tratamento que eleva o limite de produção do cafezal.",
    unidade: "aplicação",
    preco: "900.00",
    empresaTipo: EmpresaTipo.PRODUTOR,
    categoria: CatalogoItemCategoria.MELHORIA,
    aumentoCapacidade: 25,
  },
  {
    nome: "Aquisição de veículos",
    descricao: "Amplia a frota disponível para prestações de serviço.",
    unidade: "veículo",
    preco: "2000.00",
    empresaTipo: EmpresaTipo.LOGISTICA,
    categoria: CatalogoItemCategoria.MELHORIA,
    aumentoCapacidade: 25,
  },
  {
    nome: "Roteirização inteligente",
    descricao: "Otimiza rotas e aumenta viagens possíveis por mês.",
    unidade: "sistema",
    preco: "1100.00",
    empresaTipo: EmpresaTipo.LOGISTICA,
    categoria: CatalogoItemCategoria.MELHORIA,
    aumentoCapacidade: 15,
  },
  {
    nome: "Nova máquina de beneficiamento",
    descricao: "Equipamento adicional para processar mais lotes por mês.",
    unidade: "máquina",
    preco: "2200.00",
    empresaTipo: EmpresaTipo.BENEFICIAMENTO,
    categoria: CatalogoItemCategoria.MELHORIA,
    aumentoCapacidade: 30,
  },
  {
    nome: "Automação da torra",
    descricao: "Automação que eleva o limite de beneficiamento mensal.",
    unidade: "sistema",
    preco: "1600.00",
    empresaTipo: EmpresaTipo.BENEFICIAMENTO,
    categoria: CatalogoItemCategoria.MELHORIA,
    aumentoCapacidade: 20,
  },
  {
    nome: "Campanha de marketing",
    descricao: "Aumenta a capacidade de vendas e a receita das vendas realizadas.",
    unidade: "campanha",
    preco: "1300.00",
    empresaTipo: EmpresaTipo.VENDA,
    categoria: CatalogoItemCategoria.MELHORIA,
    aumentoCapacidade: 10,
    aumentoMarketing: "0.1000",
  },
  {
    nome: "Ampliação do ponto de venda",
    descricao: "Aumenta o limite de atendimentos da empresa de venda.",
    unidade: "obra",
    preco: "1800.00",
    empresaTipo: EmpresaTipo.VENDA,
    categoria: CatalogoItemCategoria.MELHORIA,
    aumentoCapacidade: 20,
  },
];

async function criarCatalogo() {
  let criados = 0;

  for (const item of CATALOGO) {
    const existente = await prisma.catalogoItem.findFirst({
      where: { nome: item.nome },
      select: { id: true },
    });

    if (!existente) {
      await prisma.catalogoItem.create({ data: item });
      criados += 1;
    }
  }

  return criados;
}

type DadosFinanceiros = {
  custosFixos: Array<{ descricao: string; valor: string }>;
  transacoes: Array<{ tipo: TransacaoTipo; descricao: string; valor: string }>;
};

async function criarParametrosEconomicos() {
  let criados = 0;

  for (const parametro of PARAMETROS_ECONOMICOS) {
    const existente = await prisma.parametroEconomico.findUnique({
      where: { nome: parametro.nome },
      select: { id: true },
    });

    if (!existente) {
      await prisma.parametroEconomico.create({ data: parametro });
      criados += 1;
    }
  }

  return criados;
}

/**
 * Custos fixos e lançamentos iniciais de uma empresa.
 *
 * As transações do seed são um histórico ilustrativo do período: o saldo
 * inicial da empresa já representa o caixa depois desses lançamentos, por
 * isso elas não alteram `Empresa.saldo`. Assim, o seed continua idempotente e
 * não desfaz alterações de saldo feitas durante os testes.
 */
async function criarDadosFinanceiros(
  empresaId: string,
  userId: string,
  dados: DadosFinanceiros,
) {
  let custosCriados = 0;
  let transacoesCriadas = 0;

  for (const custo of dados.custosFixos) {
    const existente = await prisma.custoFixo.findFirst({
      where: { empresaId, descricao: custo.descricao },
      select: { id: true },
    });

    if (!existente) {
      await prisma.custoFixo.create({
        data: { empresaId, descricao: custo.descricao, valor: custo.valor },
      });
      custosCriados += 1;
    }
  }

  for (const transacao of dados.transacoes) {
    const existente = await prisma.transacao.findFirst({
      where: {
        empresaId,
        tipo: transacao.tipo,
        descricao: transacao.descricao,
      },
      select: { id: true },
    });

    if (!existente) {
      await prisma.transacao.create({
        data: { empresaId, criadoPorUserId: userId, ...transacao },
      });
      transacoesCriadas += 1;
    }
  }

  return { custosCriados, transacoesCriadas };
}

/**
 * Seed de desenvolvimento.
 *
 * É idempotente: pode ser executado novamente para restaurar empresas,
 * usuários e senhas de demonstração. Os saldos iniciais só são aplicados
 * na criação da empresa, para não apagar mudanças feitas durante testes.
 *
 * Em produção o seed é bloqueado por segurança. Use ALLOW_PROD_SEED=true
 * apenas se realmente quiser popular um ambiente de demonstração.
 */
async function main() {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_PROD_SEED !== "true") {
    throw new Error(
      "Seed bloqueado em produção. Defina ALLOW_PROD_SEED=true para executar mesmo assim.",
    );
  }

  const passwordHash = await hash(SENHA_DEMO, 12);

  const empresas: Array<{
    nome: string;
    tipo: EmpresaTipo;
    saldo: string;
    usuario: { nome: string; email: string };
    financeiro: DadosFinanceiros;
  }> = [
    {
      nome: "Fazenda Boa Esperança",
      tipo: EmpresaTipo.PRODUTOR,
      saldo: "18500.00",
      usuario: { nome: "Ana Produtora", email: "produtor@euriptus.com" },
      financeiro: {
        custosFixos: [
          { descricao: "Arrendamento da fazenda", valor: "1200.00" },
          { descricao: "Manutenção de equipamentos", valor: "450.00" },
        ],
        transacoes: [
          {
            tipo: TransacaoTipo.RECEITA,
            descricao: "Venda de sacas de café",
            valor: "6200.00",
          },
          {
            tipo: TransacaoTipo.DESPESA,
            descricao: "Compra de insumos agrícolas",
            valor: "2100.00",
          },
        ],
      },
    },
    {
      nome: "Transportes Vale Verde",
      tipo: EmpresaTipo.LOGISTICA,
      saldo: "12000.00",
      usuario: { nome: "Lucas Logística", email: "logistica@euriptus.com" },
      financeiro: {
        custosFixos: [
          { descricao: "Seguro da frota", valor: "900.00" },
          { descricao: "Manutenção dos caminhões", valor: "700.00" },
        ],
        transacoes: [
          {
            tipo: TransacaoTipo.RECEITA,
            descricao: "Frete de café entre as etapas",
            valor: "3400.00",
          },
          {
            tipo: TransacaoTipo.DESPESA,
            descricao: "Combustível da frota",
            valor: "1100.00",
          },
        ],
      },
    },
    {
      nome: "Beneficiadora Grão de Ouro",
      tipo: EmpresaTipo.BENEFICIAMENTO,
      saldo: "27500.00",
      usuario: { nome: "Beatriz Beneficiamento", email: "beneficiamento@euriptus.com" },
      financeiro: {
        custosFixos: [
          { descricao: "Aluguel do galpão", valor: "1500.00" },
          { descricao: "Energia elétrica", valor: "800.00" },
        ],
        transacoes: [
          {
            tipo: TransacaoTipo.RECEITA,
            descricao: "Serviço de beneficiamento",
            valor: "5800.00",
          },
          {
            tipo: TransacaoTipo.DESPESA,
            descricao: "Compra de embalagens",
            valor: "1600.00",
          },
        ],
      },
    },
    {
      nome: "Café Aurora",
      tipo: EmpresaTipo.VENDA,
      saldo: "35000.00",
      usuario: { nome: "Vitor Vendas", email: "venda@euriptus.com" },
      financeiro: {
        custosFixos: [
          { descricao: "Aluguel da loja", valor: "1800.00" },
          { descricao: "Internet e sistemas", valor: "250.00" },
        ],
        transacoes: [
          {
            tipo: TransacaoTipo.RECEITA,
            descricao: "Venda de café torrado",
            valor: "7200.00",
          },
          {
            tipo: TransacaoTipo.DESPESA,
            descricao: "Compra de estoque para a loja",
            valor: "3800.00",
          },
        ],
      },
    },
  ];

  let custosCriados = 0;
  let transacoesCriadas = 0;

  for (const dados of empresas) {
    const empresa = await prisma.empresa.upsert({
      where: { nome: dados.nome },
      update: {},
      create: {
        nome: dados.nome,
        tipo: dados.tipo,
        saldo: dados.saldo,
      },
    });

    const usuario = await prisma.user.upsert({
      where: { email: dados.usuario.email },
      update: {
        nome: dados.usuario.nome,
        passwordHash,
        role: Role.STUDENT,
        empresaId: empresa.id,
      },
      create: {
        nome: dados.usuario.nome,
        email: dados.usuario.email,
        passwordHash,
        role: Role.STUDENT,
        empresaId: empresa.id,
      },
    });

    const financeiro = await criarDadosFinanceiros(
      empresa.id,
      usuario.id,
      dados.financeiro,
    );
    custosCriados += financeiro.custosCriados;
    transacoesCriadas += financeiro.transacoesCriadas;
  }

  await prisma.user.upsert({
    where: { email: "professor@euriptus.com" },
    update: {
      nome: "Professor Euriptus",
      passwordHash,
      role: Role.TEACHER,
      empresaId: null,
    },
    create: {
      nome: "Professor Euriptus",
      email: "professor@euriptus.com",
      passwordHash,
      role: Role.TEACHER,
    },
  });

  const noticiasCriadas = await criarNoticiasDeDemonstracao();
  const parametrosCriados = await criarParametrosEconomicos();
  const catalogoCriados = await criarCatalogo();

  console.info("Seed concluído.");
  console.info(
    `Notícias: ${noticiasCriadas} criada(s), ${NOTICIAS.length - noticiasCriadas} já existente(s).`,
  );
  console.info(
    `Parâmetros econômicos: ${parametrosCriados} criado(s), ${PARAMETROS_ECONOMICOS.length - parametrosCriados} já existente(s).`,
  );
  console.info(
    `Financeiro: ${custosCriados} custo(s) fixo(s) e ${transacoesCriadas} transação(ões) criados.`,
  );
  console.info(
    `Catálogo: ${catalogoCriados} item(ns) criado(s), ${CATALOGO.length - catalogoCriados} já existente(s).`,
  );
  if (!process.env.SEED_PASSWORD) {
    console.info(`Credenciais de demonstração (senha: ${SENHA_DEMO}):`);
  } else {
    console.info("Credenciais de demonstração (senha definida por SEED_PASSWORD):");
  }
  console.info("  professor@euriptus.com");
  for (const empresa of empresas) console.info(`  ${empresa.usuario.email}`);
}

main()
  .catch((error) => {
    console.error("Falha ao executar o seed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
