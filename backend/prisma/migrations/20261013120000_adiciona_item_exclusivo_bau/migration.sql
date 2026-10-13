-- Itens exclusivos do Baú da Sorte (só saem na roleta do baú de fim de
-- módulo). Coluna nova com padrão false — não altera nem apaga dados.
ALTER TABLE "itens" ADD COLUMN "exclusivoBau" BOOLEAN NOT NULL DEFAULT false;
