-- Itens exclusivos do Baú Real (só saem no baú do Desafio do Rei). Coluna
-- nova com padrão false — não altera nem apaga dados.
ALTER TABLE "itens" ADD COLUMN "exclusivoRei" BOOLEAN NOT NULL DEFAULT false;
