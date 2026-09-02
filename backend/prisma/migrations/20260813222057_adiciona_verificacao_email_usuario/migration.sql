-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "codigoVerificacao" TEXT,
ADD COLUMN     "codigoVerificacaoExpiraEm" TIMESTAMP(3),
ADD COLUMN     "emailVerificado" BOOLEAN NOT NULL DEFAULT false;
