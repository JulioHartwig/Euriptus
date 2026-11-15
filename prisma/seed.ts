import { EmpresaTipo, PrismaClient, Role } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const SENHA_DEMO = process.env.SEED_PASSWORD ?? "senha123";

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
  }> = [
    {
      nome: "Fazenda Boa Esperança",
      tipo: EmpresaTipo.PRODUTOR,
      saldo: "18500.00",
      usuario: { nome: "Ana Produtora", email: "produtor@euriptus.com" },
    },
    {
      nome: "Transportes Vale Verde",
      tipo: EmpresaTipo.LOGISTICA,
      saldo: "12000.00",
      usuario: { nome: "Lucas Logística", email: "logistica@euriptus.com" },
    },
    {
      nome: "Beneficiadora Grão de Ouro",
      tipo: EmpresaTipo.BENEFICIAMENTO,
      saldo: "27500.00",
      usuario: { nome: "Beatriz Beneficiamento", email: "beneficiamento@euriptus.com" },
    },
    {
      nome: "Café Aurora",
      tipo: EmpresaTipo.VENDA,
      saldo: "35000.00",
      usuario: { nome: "Vitor Vendas", email: "venda@euriptus.com" },
    },
  ];

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

    await prisma.user.upsert({
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

  console.info("Seed concluído.");
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
