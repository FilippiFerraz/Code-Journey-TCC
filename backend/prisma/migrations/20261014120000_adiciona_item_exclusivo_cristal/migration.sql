-- Itens exclusivos do Baú de Cristal (só saem no baú do Desafio da Cachoeira
-- de Cristais). Coluna nova com padrão false — não altera nem apaga dados.
ALTER TABLE "itens" ADD COLUMN "exclusivoCristal" BOOLEAN NOT NULL DEFAULT false;
