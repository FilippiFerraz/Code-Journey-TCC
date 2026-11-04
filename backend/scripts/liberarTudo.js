// scripts/liberarTudo.js
//
// Libera o jogo inteiro pra uma conta de teste: marca TODOS os desafios como
// concluídos (o que abre todos os portais, os minijogos do mapa e deixa os
// baús prontos pra abrir) e coloca no inventário todos os itens do jogo.
// Mesma operação do botão "Liberar tudo" do painel de administração — as
// regras estão em src/services/liberacao.service.js.
//
// Uso:
//   npm run conta:liberar-tudo -- <email>

require("dotenv").config();
const prisma = require("../src/config/prisma");
const { liberarTudo } = require("../src/services/liberacao.service");

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    console.error("Uso: npm run conta:liberar-tudo -- <email>");
    process.exitCode = 1;
    return;
  }

  const usuario = await prisma.usuario.findUnique({ where: { email }, select: { id: true, nome: true } });
  if (!usuario) {
    console.error(`Nenhuma conta com o e-mail ${email}.`);
    process.exitCode = 1;
    return;
  }

  const r = await liberarTudo(usuario.id);
  console.log(
    `${usuario.nome}: ${r.desafiosLiberados} desafios liberados agora (${r.totalDesafios} no jogo), ` +
      `${r.itensNovos} itens novos (${r.totalItens} no jogo).`
  );
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
