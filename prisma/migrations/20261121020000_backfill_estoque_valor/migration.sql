-- Valoriza lotes de estoque criados antes do campo `valorTotal` existir,
-- usando o preço de catálogo vigente como referência.
UPDATE "EstoqueItem" e
SET "valorTotal" = e."quantidade" * COALESCE(c."preco", 0)
FROM "CatalogoItem" c
WHERE e."catalogoItemId" = c."id" AND e."valorTotal" = 0;
