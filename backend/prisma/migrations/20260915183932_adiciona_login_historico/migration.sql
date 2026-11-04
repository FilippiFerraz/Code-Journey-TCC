-- CreateTable
CREATE TABLE "login_historico" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER,
    "nomeUsuario" TEXT,
    "emailTentado" TEXT NOT NULL,
    "sucesso" BOOLEAN NOT NULL,
    "motivoFalha" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_historico_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "login_historico_usuarioId_idx" ON "login_historico"("usuarioId");

-- CreateIndex
CREATE INDEX "login_historico_emailTentado_idx" ON "login_historico"("emailTentado");

-- AddForeignKey
ALTER TABLE "login_historico" ADD CONSTRAINT "login_historico_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
