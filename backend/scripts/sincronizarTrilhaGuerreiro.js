// scripts/sincronizarTrilhaGuerreiro.js
//
// Cria (ou atualiza) a trilha "guerreiro" (difícil) a partir da trilha
// "iniciante": cada desafio iniciante ganha uma cópia com os mesmos
// enunciado, exercício, XP base e recompensa, mas SEM dica. Ver
// src/services/trilhaGuerreiro.service.js.
//
// Não mexe nos desafios iniciante nem em progresso de ninguém, então é
// seguro rodar no banco em uso — e rodar de novo sempre que o conteúdo
// iniciante mudar fora do painel de admin (seed, scripts de portal).
//
// Uso:
//   npm run trilha:guerreiro -- --simular   -> só mostra o que mudaria
//   npm run trilha:guerreiro                -> grava

const prisma = require("../src/config/prisma");
const { sincronizarTrilhaGuerreiro } = require("../src/services/trilhaGuerreiro.service");

const simular = process.argv.includes("--simular");

async function main() {
  const resultado = await sincronizarTrilhaGuerreiro({ simular });
  for (const { mundoId, numero, titulo, acao } of resultado) {
    console.log(`${simular ? "[simulação] " : ""}Guerreiro ${mundoId}/${numero}: ${acao} "${titulo}".`);
  }
  console.log(`\n${resultado.length} desafio(s) ${simular ? "seriam espelhados" : "espelhados"} na trilha guerreiro.`);
  if (simular) console.log("Nada foi gravado. Rode sem --simular para aplicar.");
}

main()
  .catch((erro) => {
    console.error("Erro ao sincronizar a trilha guerreiro:", erro);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
