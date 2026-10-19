// scripts/liberarTudo.js
//
// Libera o jogo inteiro pra uma conta de teste: marca TODOS os desafios como
// concluídos (o que abre todos os portais, os minijogos do mapa e deixa os
// baús prontos pra abrir) e coloca no inventário todos os itens do jogo.
//
// - Desafio que a conta já tinha concluído fica como está (XP e tempo dela).
// - Os concluídos por aqui não dão XP (xpGanho 0): a conta não sobe no
//   ranking por causa do script.
// - Desafio de várias etapas fica com todas as etapas vencidas.
// - Os baús NÃO são abertos: ficam disponíveis pra conta abrir no jogo.
// - Não duplica itens (concederItemSeNaoTiver). Pode rodar quantas vezes quiser.
//
// Uso:
//   npm run conta:liberar-tudo -- <email>

require("dotenv").config();
const prisma = require("../src/config/prisma");
const { concederItemSeNaoTiver } = require("../src/services/personagem.service");

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

  const desafios = await prisma.desafio.findMany({
    select: { id: true, mundoId: true, dificuldade: true, numero: true, titulo: true, alternativas: true },
    orderBy: [{ mundoId: "asc" }, { dificuldade: "asc" }, { numero: "asc" }],
  });

  let liberados = 0;
  for (const desafio of desafios) {
    const etapas = Array.isArray(desafio.alternativas?.etapas) ? desafio.alternativas.etapas.length : 0;
    const chave = { usuarioId_desafioId: { usuarioId: usuario.id, desafioId: desafio.id } };
    const atual = await prisma.progresso.findUnique({ where: chave, select: { concluido: true } });
    if (atual?.concluido) continue;
    await prisma.progresso.upsert({
      where: chave,
      update: { concluido: true, dataConclusao: new Date(), etapasConcluidas: etapas },
      create: {
        usuarioId: usuario.id,
        desafioId: desafio.id,
        concluido: true,
        tentativas: 1,
        xpGanho: 0,
        dataConclusao: new Date(),
        etapasConcluidas: etapas,
      },
    });
    liberados++;
    console.log(`+ desafio ${desafio.mundoId}/${desafio.dificuldade}/${desafio.numero} — ${desafio.titulo}`);
  }

  const itens = await prisma.item.findMany({ select: { id: true, nome: true }, orderBy: { id: "asc" } });
  let novos = 0;
  for (const item of itens) {
    const { concedido } = await concederItemSeNaoTiver(usuario.id, item.id);
    if (concedido) novos++;
  }

  console.log(
    `\n${usuario.nome}: ${liberados} desafios liberados agora (${desafios.length} no jogo), ` +
      `${novos} itens novos (${itens.length} no jogo).`
  );
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
