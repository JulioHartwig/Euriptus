-- CreateEnum
CREATE TYPE "TransacaoTipo" AS ENUM ('RECEITA', 'DESPESA', 'IMPOSTO', 'SALARIO', 'JUROS', 'EMPRESTIMO', 'INVESTIMENTO');

-- CreateTable
CREATE TABLE "Transacao" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "tipo" "TransacaoTipo" NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(14,2) NOT NULL,
    "rodadaId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criadoPorUserId" TEXT NOT NULL,

    CONSTRAINT "Transacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustoFixo" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(14,2) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CustoFixo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParametroEconomico" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "valor" DECIMAL(14,4) NOT NULL,
    "descricao" TEXT NOT NULL,

    CONSTRAINT "ParametroEconomico_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Transacao_empresaId_criadoEm_idx" ON "Transacao"("empresaId", "criadoEm");

-- CreateIndex
CREATE INDEX "Transacao_empresaId_tipo_idx" ON "Transacao"("empresaId", "tipo");

-- CreateIndex
CREATE INDEX "Transacao_rodadaId_idx" ON "Transacao"("rodadaId");

-- CreateIndex
CREATE INDEX "CustoFixo_empresaId_ativo_idx" ON "CustoFixo"("empresaId", "ativo");

-- CreateIndex
CREATE UNIQUE INDEX "ParametroEconomico_nome_key" ON "ParametroEconomico"("nome");

-- AddForeignKey
ALTER TABLE "Transacao" ADD CONSTRAINT "Transacao_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transacao" ADD CONSTRAINT "Transacao_criadoPorUserId_fkey" FOREIGN KEY ("criadoPorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustoFixo" ADD CONSTRAINT "CustoFixo_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
