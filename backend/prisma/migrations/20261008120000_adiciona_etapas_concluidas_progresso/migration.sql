-- Desafios com várias etapas (Portal 3): quantas etapas o jogador já venceu
-- neste desafio. Coluna nova com padrão 0 — não altera nem apaga dados.
ALTER TABLE "progresso" ADD COLUMN "etapasConcluidas" INTEGER NOT NULL DEFAULT 0;
