-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "nomeAlteradoEm" TIMESTAMP(3),
ADD COLUMN     "emailAlteradoEm" TIMESTAMP(3),
ADD COLUMN     "emailPendente" TEXT,
ADD COLUMN     "codigoTrocaEmail" TEXT,
ADD COLUMN     "codigoTrocaEmailExpiraEm" TIMESTAMP(3);
