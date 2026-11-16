-- CreateTable
CREATE TABLE "EventoTemplate" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "tipoNoticia" "NoticiaTipo" NOT NULL DEFAULT 'EVENTO',
    "impactoTexto" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventoTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventoAtivo" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "rodadaId" TEXT,
    "noticiaId" TEXT,
    "disparadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disparadoPorUserId" TEXT NOT NULL,

    CONSTRAINT "EventoAtivo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventoTemplate_ativo_idx" ON "EventoTemplate"("ativo");

-- CreateIndex
CREATE INDEX "EventoAtivo_templateId_idx" ON "EventoAtivo"("templateId");

-- CreateIndex
CREATE INDEX "EventoAtivo_rodadaId_idx" ON "EventoAtivo"("rodadaId");

-- CreateIndex
CREATE INDEX "EventoAtivo_disparadoEm_idx" ON "EventoAtivo"("disparadoEm");

-- AddForeignKey
ALTER TABLE "EventoAtivo" ADD CONSTRAINT "EventoAtivo_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "EventoTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoAtivo" ADD CONSTRAINT "EventoAtivo_rodadaId_fkey" FOREIGN KEY ("rodadaId") REFERENCES "Rodada"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoAtivo" ADD CONSTRAINT "EventoAtivo_noticiaId_fkey" FOREIGN KEY ("noticiaId") REFERENCES "Noticia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoAtivo" ADD CONSTRAINT "EventoAtivo_disparadoPorUserId_fkey" FOREIGN KEY ("disparadoPorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
