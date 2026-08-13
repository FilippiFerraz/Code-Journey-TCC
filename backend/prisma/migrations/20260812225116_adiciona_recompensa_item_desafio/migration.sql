-- AlterTable
ALTER TABLE "desafios" ADD COLUMN     "itemRecompensaId" INTEGER;

-- AddForeignKey
ALTER TABLE "desafios" ADD CONSTRAINT "desafios_itemRecompensaId_fkey" FOREIGN KEY ("itemRecompensaId") REFERENCES "itens"("id") ON DELETE SET NULL ON UPDATE CASCADE;
