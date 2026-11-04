// scripts/resetBaus.js
//
// Apaga baús de fim de mundo já abertos (tabela baus_mundo), só pra poder
// testar a abertura de novo em dev — a linha em BauMundo é o que trava um
// usuário de reabrir a mesma trilha (ver backend/src/services/bau.service.js).
// O progresso dos desafios não é mexido: a trilha continua concluída, então
// o baú volta a aparecer disponível em Home.jsx assim que a linha some.
//
// Uso:
//   npm run reset:baus                       -> reseta os baús de TODOS os usuários
//   npm run reset:baus -- seu@email.com       -> reseta só os baús desse usuário

const prisma = require("../src/config/prisma");

async function main() {
  const email = process.argv[2];
  const where = email ? { usuario: { email } } : {};

  const { count } = await prisma.bauMundo.deleteMany({ where });

  console.log(
    email
      ? `${count} baú(s) resetado(s) para ${email}.`
      : `${count} baú(s) resetado(s) para todos os usuários.`
  );
}

main()
  .catch((erro) => {
    console.error("Erro ao resetar baús:", erro);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
