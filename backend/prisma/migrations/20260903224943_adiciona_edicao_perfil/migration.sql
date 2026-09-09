-- AlterTable
ALTER TABLE "itens_personagem" ADD COLUMN     "destaque" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "rankingVisivel" BOOLEAN NOT NULL DEFAULT true;
