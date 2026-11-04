// scripts/darTodosOsItens.js
//
// Coloca no inventário de uma conta TODOS os itens que existem no jogo —
// pra contas de teste/administração conferirem cada item no personagem.
// Não equipa nada e não duplica: quem já tem um item continua com 1
// (concederItemSeNaoTiver). Pode rodar quantas vezes quiser.
//
// Uso:
//   npm run itens:dar-todos -- <email>

require("dotenv").config();
const prisma = require("../src/config/prisma");
const { concederItemSeNaoTiver } = require("../src/services/personagem.service");

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    console.error("Uso: npm run itens:dar-todos -- <email>");
    process.exitCode = 1;
    return;
  }

  const usuario = await prisma.usuario.findUnique({ where: { email }, select: { id: true, nome: true } });
  if (!usuario) {
    console.error(`Nenhuma conta com o e-mail ${email}.`);
    process.exitCode = 1;
    return;
  }

  const itens = await prisma.item.findMany({ select: { id: true, nome: true }, orderBy: { id: "asc" } });
  let novos = 0;
  for (const item of itens) {
    const { concedido } = await concederItemSeNaoTiver(usuario.id, item.id);
    if (concedido) {
      novos++;
      console.log(`+ ${item.nome}`);
    }
  }
  console.log(`\n${usuario.nome}: ${novos} itens novos, ${itens.length - novos} já tinha (${itens.length} no jogo).`);
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
