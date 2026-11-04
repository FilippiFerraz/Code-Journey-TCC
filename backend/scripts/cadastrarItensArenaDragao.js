// scripts/cadastrarItensArenaDragao.js
//
// Cadastra a coleção "Draconiana" (ver prisma/itensArenaDragao.js) num banco
// que já está em uso, sem rodar o seed inteiro (que também regrava os
// desafios e desfaria edições feitas pelo painel de admin), e liga cada item
// como recompensa do seu desafio do Portal 3 (trilha iniciante).
//
// Com um e-mail, também coloca os 6 itens no inventário dessa conta (sem
// equipar e sem duplicar).
//
// Só cria o item que ainda não existe (procura pelo nome); item que já
// existe não é alterado. Pode rodar quantas vezes quiser.
//
// Uso:
//   npm run itens:arena-dragao                      -> cadastra e liga aos desafios
//   npm run itens:arena-dragao -- seu@email.com     -> ...e libera pra essa conta

require("dotenv").config();
const prisma = require("../src/config/prisma");
const { concederItemSeNaoTiver } = require("../src/services/personagem.service");
const { limparCacheDesafios } = require("../src/services/desafiosCache");
const itens = require("../prisma/itensArenaDragao");

const MUNDO_ID = 3;
const DIFICULDADE = "iniciante";

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  const usuario = email
    ? await prisma.usuario.findUnique({ where: { email }, select: { id: true, nome: true } })
    : null;
  if (email && !usuario) {
    console.error(`Nenhuma conta com o e-mail ${email}.`);
    process.exitCode = 1;
    return;
  }

  for (const { desafio: numero, ...dados } of itens) {
    let item = await prisma.item.findFirst({ where: { nome: dados.nome } });
    if (item) {
      console.log(`Já existe: ${dados.nome} (id ${item.id})`);
    } else {
      item = await prisma.item.create({ data: dados });
      console.log(`Cadastrado: ${item.nome} (id ${item.id})`);
    }

    const { count } = await prisma.desafio.updateMany({
      where: { mundoId: MUNDO_ID, dificuldade: DIFICULDADE, numero },
      data: { itemRecompensaId: item.id },
    });
    console.log(
      count
        ? `  recompensa do desafio ${MUNDO_ID}/${numero}`
        : `  (desafio ${MUNDO_ID}/${numero} não existe no banco — recompensa não ligada)`
    );

    if (usuario) {
      const { concedido } = await concederItemSeNaoTiver(usuario.id, item.id);
      console.log(concedido ? `  liberado pra ${usuario.nome}` : `  ${usuario.nome} já tinha`);
    }
  }
  limparCacheDesafios();
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
