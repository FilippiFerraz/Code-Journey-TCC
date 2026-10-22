-- Lojinha do Mago: moedas do jogador e itens consumíveis comprados.
-- Só acrescenta (coluna nova com padrão 0 e tabela nova) — não apaga dados.
ALTER TABLE "usuarios" ADD COLUMN "moedas" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "itens_loja_usuario" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "chave" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "itens_loja_usuario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "itens_loja_usuario_usuarioId_chave_key" ON "itens_loja_usuario"("usuarioId", "chave");

-- AddForeignKey
ALTER TABLE "itens_loja_usuario" ADD CONSTRAINT "itens_loja_usuario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Até aqui o "Ouro" do card de perfil era só o XP total (cosmético). A
-- partir de agora ele mostra estas moedas, que podem ser gastas — então
-- cada jogador começa com o mesmo ouro que já via, sem o número cair.
UPDATE "usuarios" SET "moedas" = "xpTotal";
