-- CreateEnum
CREATE TYPE "StatusParcela" AS ENUM ('PENDENTE', 'PAGA');

-- CreateEnum
CREATE TYPE "CatalogoItemCategoria" AS ENUM ('INSUMO', 'PRODUTO', 'MELHORIA');

-- AlterEnum
ALTER TYPE "TransacaoTipo" ADD VALUE 'PAGAMENTO_EMPRESTIMO';

-- AlterTable
ALTER TABLE "CatalogoItem" ADD COLUMN     "aumentoCapacidade" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "aumentoMarketing" DECIMAL(14,4) NOT NULL DEFAULT 0,
ADD COLUMN     "categoria" "CatalogoItemCategoria" NOT NULL DEFAULT 'INSUMO';

-- AlterTable
ALTER TABLE "Empresa" ADD COLUMN     "capacidadeProducao" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "multiplicadorMarketing" DECIMAL(14,4) NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Emprestimo" ADD COLUMN     "descontoAplicado" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "numeroParcelas" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "quitadoEm" TIMESTAMP(3),
ADD COLUMN     "rodadaCriacaoId" TEXT,
ADD COLUMN     "valorParcela" DECIMAL(14,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "EstoqueItem" ADD COLUMN     "valorTotal" DECIMAL(14,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Investimento" ADD COLUMN     "rodadaCriacaoId" TEXT,
ADD COLUMN     "taxaResgateAplicada" DECIMAL(14,4);

-- AlterTable
ALTER TABLE "Rodada" ADD COLUMN     "competencia" TIMESTAMP(3);

-- Backfill: cada rodada existente passa a representar o mês em que foi aberta.
UPDATE "Rodada" SET "competencia" = date_trunc('month', "abertaEm") WHERE "competencia" IS NULL;

-- CreateTable
CREATE TABLE "ParcelaEmprestimo" (
    "id" TEXT NOT NULL,
    "emprestimoId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "valor" DECIMAL(14,2) NOT NULL,
    "vencimento" TIMESTAMP(3) NOT NULL,
    "status" "StatusParcela" NOT NULL DEFAULT 'PENDENTE',
    "valorPago" DECIMAL(14,2),
    "pagaEm" TIMESTAMP(3),
    "pagaPorUserId" TEXT,

    CONSTRAINT "ParcelaEmprestimo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProducaoRodada" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "rodadaId" TEXT NOT NULL,
    "catalogoItemId" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "capacidadeAplicada" INTEGER NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criadoPorUserId" TEXT NOT NULL,

    CONSTRAINT "ProducaoRodada_pkey" PRIMARY KEY ("id")
);

-- Backfill: contratos antigos viram parcela única com vencimento em um mês.
UPDATE "Emprestimo" SET "valorParcela" = "totalDevido" WHERE "valorParcela" = 0;

INSERT INTO "ParcelaEmprestimo"
  ("id", "emprestimoId", "numero", "valor", "vencimento", "status", "valorPago", "pagaEm", "pagaPorUserId")
SELECT
  'parcela_legacy_' || e."id",
  e."id",
  1,
  e."totalDevido",
  e."criadoEm" + INTERVAL '1 month',
  CASE WHEN e."status" = 'QUITADO' THEN 'PAGA'::"StatusParcela" ELSE 'PENDENTE'::"StatusParcela" END,
  CASE WHEN e."status" = 'QUITADO' THEN e."totalDevido" ELSE NULL END,
  CASE WHEN e."status" = 'QUITADO' THEN e."criadoEm" ELSE NULL END,
  CASE WHEN e."status" = 'QUITADO' THEN e."criadoPorUserId" ELSE NULL END
FROM "Emprestimo" e;

UPDATE "Emprestimo" SET "quitadoEm" = "criadoEm" WHERE "status" = 'QUITADO' AND "quitadoEm" IS NULL;

-- CreateIndex
CREATE INDEX "ParcelaEmprestimo_status_vencimento_idx" ON "ParcelaEmprestimo"("status", "vencimento");

-- CreateIndex
CREATE UNIQUE INDEX "ParcelaEmprestimo_emprestimoId_numero_key" ON "ParcelaEmprestimo"("emprestimoId", "numero");

-- CreateIndex
CREATE INDEX "ProducaoRodada_rodadaId_idx" ON "ProducaoRodada"("rodadaId");

-- CreateIndex
CREATE UNIQUE INDEX "ProducaoRodada_empresaId_rodadaId_catalogoItemId_key" ON "ProducaoRodada"("empresaId", "rodadaId", "catalogoItemId");

-- CreateIndex
CREATE INDEX "CatalogoItem_categoria_idx" ON "CatalogoItem"("categoria");

-- CreateIndex
CREATE INDEX "Emprestimo_rodadaCriacaoId_idx" ON "Emprestimo"("rodadaCriacaoId");

-- CreateIndex
CREATE UNIQUE INDEX "Rodada_competencia_key" ON "Rodada"("competencia");

-- CreateIndex
CREATE INDEX "Rodada_competencia_idx" ON "Rodada"("competencia");

-- AddForeignKey
ALTER TABLE "Emprestimo" ADD CONSTRAINT "Emprestimo_rodadaCriacaoId_fkey" FOREIGN KEY ("rodadaCriacaoId") REFERENCES "Rodada"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParcelaEmprestimo" ADD CONSTRAINT "ParcelaEmprestimo_emprestimoId_fkey" FOREIGN KEY ("emprestimoId") REFERENCES "Emprestimo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParcelaEmprestimo" ADD CONSTRAINT "ParcelaEmprestimo_pagaPorUserId_fkey" FOREIGN KEY ("pagaPorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investimento" ADD CONSTRAINT "Investimento_rodadaCriacaoId_fkey" FOREIGN KEY ("rodadaCriacaoId") REFERENCES "Rodada"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProducaoRodada" ADD CONSTRAINT "ProducaoRodada_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProducaoRodada" ADD CONSTRAINT "ProducaoRodada_rodadaId_fkey" FOREIGN KEY ("rodadaId") REFERENCES "Rodada"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProducaoRodada" ADD CONSTRAINT "ProducaoRodada_catalogoItemId_fkey" FOREIGN KEY ("catalogoItemId") REFERENCES "CatalogoItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProducaoRodada" ADD CONSTRAINT "ProducaoRodada_criadoPorUserId_fkey" FOREIGN KEY ("criadoPorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
