-- CreateEnum
CREATE TYPE "RodadaStatus" AS ENUM ('ABERTA', 'FECHADA');

-- CreateTable
CREATE TABLE "Rodada" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "status" "RodadaStatus" NOT NULL DEFAULT 'ABERTA',
    "abertaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "abertaPorUserId" TEXT NOT NULL,
    "fechadaEm" TIMESTAMP(3),
    "fechadaPorUserId" TEXT,

    CONSTRAINT "Rodada_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Rodada_numero_key" ON "Rodada"("numero");

-- CreateIndex
CREATE INDEX "Rodada_status_idx" ON "Rodada"("status");

-- AddForeignKey
ALTER TABLE "Transacao" ADD CONSTRAINT "Transacao_rodadaId_fkey" FOREIGN KEY ("rodadaId") REFERENCES "Rodada"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rodada" ADD CONSTRAINT "Rodada_abertaPorUserId_fkey" FOREIGN KEY ("abertaPorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rodada" ADD CONSTRAINT "Rodada_fechadaPorUserId_fkey" FOREIGN KEY ("fechadaPorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
