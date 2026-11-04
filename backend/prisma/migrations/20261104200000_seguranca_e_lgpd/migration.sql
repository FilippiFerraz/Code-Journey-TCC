-- Segurança: limite de tentativas por código de 6 dígitos e versão das
-- sessões (invalidar tokens ao redefinir a senha). Só acrescenta colunas
-- com padrão 0 — não apaga nem altera dados existentes.
ALTER TABLE "usuarios" ADD COLUMN "codigoRecuperacaoTentativas" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "usuarios" ADD COLUMN "codigoVerificacaoTentativas" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "usuarios" ADD COLUMN "codigoTrocaEmailTentativas" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "usuarios" ADD COLUMN "sessaoVersao" INTEGER NOT NULL DEFAULT 0;

-- LGPD: registro do aceite dos Termos de Uso / Política de Privacidade.
-- Colunas opcionais — contas antigas ficam com null.
ALTER TABLE "usuarios" ADD COLUMN "termosAceitosEm" TIMESTAMP(3);
ALTER TABLE "usuarios" ADD COLUMN "termosVersao" TEXT;
