// scripts/criarDesafioIA.js
//
// Cadastra (ou atualiza) só o desafio dissertativo corrigido por IA — o
// desafio 2 do mundo 2 (ver prisma/desafios/desafioIA.js). Não mexe em
// nenhum outro desafio, item ou progresso, então é seguro rodar no banco
// que já está em uso (ao contrário do seed completo, que regrava tudo).
//
// Uso:
//   npm run desafio:ia

const prisma = require("../src/config/prisma");
const desafioIA = require("../prisma/desafios/desafioIA");

async function main() {
  const salvo = await prisma.desafio.upsert({
    where: {
      mundoId_dificuldade_numero: {
        mundoId: desafioIA.mundoId,
        dificuldade: desafioIA.dificuldade,
        numero: desafioIA.numero,
      },
    },
    update: desafioIA,
    create: desafioIA,
  });

  console.log(
    `Desafio "${salvo.titulo}" salvo (mundo ${salvo.mundoId}, ${salvo.dificuldade}, desafio ${salvo.numero}).`
  );
}

main()
  .catch((erro) => {
    console.error("Erro ao cadastrar o desafio de IA:", erro);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
