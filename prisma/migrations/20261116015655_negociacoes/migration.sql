-- CreateEnum
CREATE TYPE "PropostaStatus" AS ENUM ('PENDENTE', 'ACEITA', 'RECUSADA', 'CANCELADA');

-- CreateTable
CREATE TABLE "Proposta" (
    "id" TEXT NOT NULL,
    "empresaOrigemId" TEXT NOT NULL,
    "empresaDestinoId" TEXT NOT NULL,
    "catalogoItemId" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "valorTotal" DECIMAL(14,2) NOT NULL,
    "mensagem" TEXT,
    "status" "PropostaStatus" NOT NULL DEFAULT 'PENDENTE',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criadoPorUserId" TEXT NOT NULL,
    "respondidoEm" TIMESTAMP(3),
    "respondidoPorUserId" TEXT,

    CONSTRAINT "Proposta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Proposta_empresaOrigemId_status_idx" ON "Proposta"("empresaOrigemId", "status");

-- CreateIndex
CREATE INDEX "Proposta_empresaDestinoId_status_idx" ON "Proposta"("empresaDestinoId", "status");

-- CreateIndex
CREATE INDEX "Proposta_criadoEm_idx" ON "Proposta"("criadoEm");

-- AddForeignKey
ALTER TABLE "Proposta" ADD CONSTRAINT "Proposta_empresaOrigemId_fkey" FOREIGN KEY ("empresaOrigemId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposta" ADD CONSTRAINT "Proposta_empresaDestinoId_fkey" FOREIGN KEY ("empresaDestinoId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposta" ADD CONSTRAINT "Proposta_catalogoItemId_fkey" FOREIGN KEY ("catalogoItemId") REFERENCES "CatalogoItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposta" ADD CONSTRAINT "Proposta_criadoPorUserId_fkey" FOREIGN KEY ("criadoPorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposta" ADD CONSTRAINT "Proposta_respondidoPorUserId_fkey" FOREIGN KEY ("respondidoPorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
