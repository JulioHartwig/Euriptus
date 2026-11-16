-- CreateEnum
CREATE TYPE "NoticiaTipo" AS ENUM ('MERCADO', 'EVENTO', 'AVISO');

-- CreateTable
CREATE TABLE "Noticia" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "corpo" TEXT NOT NULL,
    "tipo" "NoticiaTipo" NOT NULL DEFAULT 'MERCADO',
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Noticia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Noticia_ativa_criadoEm_idx" ON "Noticia"("ativa", "criadoEm");

-- CreateIndex
CREATE INDEX "Noticia_tipo_idx" ON "Noticia"("tipo");
