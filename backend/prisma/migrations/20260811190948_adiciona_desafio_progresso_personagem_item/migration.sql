-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "codigoExpiraEm" TIMESTAMP(3),
ADD COLUMN     "codigoRecuperacao" TEXT,
ADD COLUMN     "xpTotal" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "desafios" (
    "id" SERIAL NOT NULL,
    "mundoId" INTEGER NOT NULL,
    "dificuldade" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "enunciado" TEXT NOT NULL,
    "dica" TEXT,
    "alternativas" JSONB NOT NULL,
    "xpConcedido" INTEGER NOT NULL DEFAULT 10,
    "tipoRecompensa" TEXT,
    "nomeRecompensa" TEXT,
    "descricaoRecompensa" TEXT,
    "iconeRecompensa" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "desafios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "progresso" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "desafioId" INTEGER NOT NULL,
    "concluido" BOOLEAN NOT NULL DEFAULT false,
    "tentativas" INTEGER NOT NULL DEFAULT 0,
    "xpGanho" INTEGER NOT NULL DEFAULT 0,
    "dataConclusao" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "progresso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personagens" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL DEFAULT 'Guerreiro',
    "nivel" INTEGER NOT NULL DEFAULT 1,
    "vidaAtual" INTEGER NOT NULL DEFAULT 100,
    "vidaMax" INTEGER NOT NULL DEFAULT 100,
    "imagemUrl" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "personagens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "raridade" TEXT NOT NULL DEFAULT 'comum',
    "descricao" TEXT,
    "icone" TEXT,
    "imagemUrl" TEXT,
    "bonusAtaque" INTEGER NOT NULL DEFAULT 0,
    "bonusDefesa" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "itens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_personagem" (
    "id" SERIAL NOT NULL,
    "personagemId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "quantidade" INTEGER NOT NULL DEFAULT 1,
    "equipado" BOOLEAN NOT NULL DEFAULT false,
    "obtidoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "itens_personagem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "desafios_mundoId_dificuldade_numero_key" ON "desafios"("mundoId", "dificuldade", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "progresso_usuarioId_desafioId_key" ON "progresso"("usuarioId", "desafioId");

-- CreateIndex
CREATE UNIQUE INDEX "personagens_usuarioId_key" ON "personagens"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "itens_personagem_personagemId_itemId_key" ON "itens_personagem"("personagemId", "itemId");

-- AddForeignKey
ALTER TABLE "progresso" ADD CONSTRAINT "progresso_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progresso" ADD CONSTRAINT "progresso_desafioId_fkey" FOREIGN KEY ("desafioId") REFERENCES "desafios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personagens" ADD CONSTRAINT "personagens_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_personagem" ADD CONSTRAINT "itens_personagem_personagemId_fkey" FOREIGN KEY ("personagemId") REFERENCES "personagens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_personagem" ADD CONSTRAINT "itens_personagem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "itens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
