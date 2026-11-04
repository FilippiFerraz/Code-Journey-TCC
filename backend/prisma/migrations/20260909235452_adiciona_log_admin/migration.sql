-- CreateTable
CREATE TABLE "logs_admin" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "nomeUsuario" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidadeId" INTEGER,
    "descricao" TEXT,
    "alteracoes" JSONB,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_admin_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "logs_admin" ADD CONSTRAINT "logs_admin_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
