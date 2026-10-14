-- Itens exclusivos do Baú do Dragão (só saem no baú da Batalha do Dragão).
-- Coluna nova com padrão false — não altera nem apaga dados.
ALTER TABLE "itens" ADD COLUMN "exclusivoDragao" BOOLEAN NOT NULL DEFAULT false;
