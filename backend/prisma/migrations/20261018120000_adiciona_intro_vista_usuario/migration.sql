-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "introVista" BOOLEAN NOT NULL DEFAULT false;

-- Contas que já existiam não precisam ver a introdução: ela é só pra quem
-- cria a conta a partir de agora.
UPDATE "usuarios" SET "introVista" = true;
