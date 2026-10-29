// scripts/criarDesafiosPortal2.js
//
// Cadastra (ou atualiza) só os desafios 1, 3, 4, 5 e 6 do Portal 2 (ver
// prisma/desafios/portal2.js). Não mexe em nenhum outro desafio, item,
// recompensa ou progresso, então é seguro rodar no banco que já está em
// uso (ao contrário do seed completo, que regrava tudo).
//
// Desafios que já existem mantêm o id (o progresso dos jogadores continua
// ligado a eles) e o item de recompensa já configurado.
//
// Uso:
//   npm run desafios:portal2 -- --simular   -> só mostra o que mudaria
//   npm run desafios:portal2                -> grava

const prisma = require("../src/config/prisma");
const { validarAlternativas } = require("../src/services/etapas.service");
const desafiosPortal2 = require("../prisma/desafios/portal2");

const simular = process.argv.includes("--simular");

async function main() {
  // Confere todo o conteúdo antes de gravar qualquer coisa — mesmo cuidado
  // do seed.js.
  for (const desafio of desafiosPortal2) {
    try {
      validarAlternativas(desafio.alternativas);
    } catch (erro) {
      throw new Error(`Desafio ${desafio.mundoId}/${desafio.numero} (${desafio.titulo}): ${erro.message}`);
    }
  }

  for (const desafio of desafiosPortal2) {
    const chave = {
      mundoId: desafio.mundoId,
      dificuldade: desafio.dificuldade,
      numero: desafio.numero,
    };
    const atual = await prisma.desafio.findUnique({
      where: { mundoId_dificuldade_numero: chave },
      select: { titulo: true },
    });
    const acao = atual ? `atualiza "${atual.titulo}" ->` : "cria";

    if (simular) {
      console.log(`[simulação] Desafio 2/${desafio.numero}: ${acao} "${desafio.titulo}".`);
      continue;
    }

    await prisma.desafio.upsert({
      where: { mundoId_dificuldade_numero: chave },
      update: desafio,
      create: desafio,
    });
    console.log(`Desafio 2/${desafio.numero}: ${acao} "${desafio.titulo}" — salvo.`);
  }

  if (simular) console.log("\nNada foi gravado. Rode sem --simular para aplicar.");
}

main()
  .catch((erro) => {
    console.error("Erro ao cadastrar os desafios do Portal 2:", erro);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
