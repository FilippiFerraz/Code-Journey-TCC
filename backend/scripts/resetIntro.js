// scripts/resetIntro.js
//
// Volta Usuario.introVista para false, só pra poder ver a cutscene de
// introdução (frontend/src/components/IntroCutscene) de novo em dev — ela
// abre na Home sempre que o perfil vier com introVista = false.
//
// Obs.: o navegador também guarda uma marca local (localStorage
// "introVista:<id>", fallback pra quando o backend está fora do ar). Se a
// intro não aparecer depois do reset, limpe essa chave no DevTools.
//
// Uso:
//   npm run reset:intro -- seu@email.com   -> reseta só esse usuário
//   npm run reset:intro -- --todos         -> reseta TODOS os usuários

const prisma = require("../src/config/prisma");

async function main() {
  const alvo = process.argv[2];
  if (!alvo) {
    console.log("Informe o e-mail (npm run reset:intro -- seu@email.com) ou --todos.");
    process.exit(1);
  }
  const where = alvo === "--todos" ? {} : { email: alvo.trim().toLowerCase() };

  const { count } = await prisma.usuario.updateMany({ where, data: { introVista: false } });

  console.log(
    alvo === "--todos"
      ? `Intro resetada para ${count} usuário(s).`
      : `Intro resetada para ${alvo} (${count} conta encontrada).`
  );
}

main()
  .catch((erro) => {
    console.error("Erro ao resetar a intro:", erro);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
