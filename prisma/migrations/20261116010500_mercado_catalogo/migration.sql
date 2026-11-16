-- CreateTable
CREATE TABLE "CatalogoItem" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "unidade" TEXT NOT NULL,
    "preco" DECIMAL(14,2) NOT NULL,
    "empresaTipo" "EmpresaTipo",
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CatalogoItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstoqueItem" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "catalogoItemId" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL DEFAULT 0,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EstoqueItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CatalogoItem_ativo_empresaTipo_idx" ON "CatalogoItem"("ativo", "empresaTipo");

-- CreateIndex
CREATE INDEX "EstoqueItem_empresaId_idx" ON "EstoqueItem"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "EstoqueItem_empresaId_catalogoItemId_key" ON "EstoqueItem"("empresaId", "catalogoItemId");

-- AddForeignKey
ALTER TABLE "EstoqueItem" ADD CONSTRAINT "EstoqueItem_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstoqueItem" ADD CONSTRAINT "EstoqueItem_catalogoItemId_fkey" FOREIGN KEY ("catalogoItemId") REFERENCES "CatalogoItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
