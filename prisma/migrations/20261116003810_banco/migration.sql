-- CreateEnum
CREATE TYPE "StatusEmprestimo" AS ENUM ('ATIVO', 'QUITADO');

-- CreateEnum
CREATE TYPE "StatusInvestimento" AS ENUM ('ATIVO', 'RESGATADO');

-- AlterEnum
ALTER TYPE "TransacaoTipo" ADD VALUE 'RESGATE';

-- CreateTable
CREATE TABLE "Emprestimo" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "valorPrincipal" DECIMAL(14,2) NOT NULL,
    "taxaJurosMensal" DECIMAL(14,4) NOT NULL,
    "totalDevido" DECIMAL(14,2) NOT NULL,
    "status" "StatusEmprestimo" NOT NULL DEFAULT 'ATIVO',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criadoPorUserId" TEXT NOT NULL,

    CONSTRAINT "Emprestimo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Investimento" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "valorAplicado" DECIMAL(14,2) NOT NULL,
    "taxaRendimentoMensal" DECIMAL(14,4) NOT NULL,
    "valorResgate" DECIMAL(14,2),
    "status" "StatusInvestimento" NOT NULL DEFAULT 'ATIVO',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resgatadoEm" TIMESTAMP(3),
    "criadoPorUserId" TEXT NOT NULL,
    "resgatadoPorUserId" TEXT,

    CONSTRAINT "Investimento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Emprestimo_empresaId_status_idx" ON "Emprestimo"("empresaId", "status");

-- CreateIndex
CREATE INDEX "Emprestimo_empresaId_criadoEm_idx" ON "Emprestimo"("empresaId", "criadoEm");

-- CreateIndex
CREATE INDEX "Investimento_empresaId_status_idx" ON "Investimento"("empresaId", "status");

-- CreateIndex
CREATE INDEX "Investimento_empresaId_criadoEm_idx" ON "Investimento"("empresaId", "criadoEm");

-- AddForeignKey
ALTER TABLE "Emprestimo" ADD CONSTRAINT "Emprestimo_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Emprestimo" ADD CONSTRAINT "Emprestimo_criadoPorUserId_fkey" FOREIGN KEY ("criadoPorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investimento" ADD CONSTRAINT "Investimento_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investimento" ADD CONSTRAINT "Investimento_criadoPorUserId_fkey" FOREIGN KEY ("criadoPorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investimento" ADD CONSTRAINT "Investimento_resgatadoPorUserId_fkey" FOREIGN KEY ("resgatadoPorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
