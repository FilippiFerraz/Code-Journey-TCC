-- CreateTable
CREATE TABLE "baus_mundo" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "mundoId" INTEGER NOT NULL,
    "dificuldade" TEXT NOT NULL,
    "itemGanhoId" INTEGER NOT NULL,
    "abertoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "baus_mundo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "baus_mundo_usuarioId_mundoId_dificuldade_key" ON "baus_mundo"("usuarioId", "mundoId", "dificuldade");

-- AddForeignKey
ALTER TABLE "baus_mundo" ADD CONSTRAINT "baus_mundo_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "baus_mundo" ADD CONSTRAINT "baus_mundo_itemGanhoId_fkey" FOREIGN KEY ("itemGanhoId") REFERENCES "itens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
