const prisma = require("../config/prisma");

function erroDeValidacao(mensagem) {
  const erro = new Error(mensagem);
  erro.status = 400;
  return erro;
}

function erroNaoEncontrado(mensagem) {
  const erro = new Error(mensagem);
  erro.status = 404;
  return erro;
}

// Cria o personagem padrão no primeiro acesso, assim o frontend nunca
// precisa tratar "personagem ainda não existe" como caso especial.
async function buscarOuCriarPersonagem(usuarioId) {
  const personagem = await prisma.personagem.findUnique({ where: { usuarioId } });
  if (personagem) return personagem;
  return prisma.personagem.create({ data: { usuarioId } });
}

async function buscarPersonagem(usuarioId) {
  const personagem = await buscarOuCriarPersonagem(usuarioId);

  const itens = await prisma.itemPersonagem.findMany({
    where: { personagemId: personagem.id },
    include: { item: true },
    orderBy: { obtidoEm: "desc" },
  });

  return { ...personagem, itens };
}

async function atualizarPersonagem(usuarioId, { nome, imagemUrl }) {
  const personagem = await buscarOuCriarPersonagem(usuarioId);

  const dados = {};
  if (nome !== undefined) {
    if (!nome.trim()) throw erroDeValidacao("Nome não pode ficar vazio.");
    dados.nome = nome.trim();
  }
  if (imagemUrl !== undefined) dados.imagemUrl = imagemUrl;

  return prisma.personagem.update({ where: { id: personagem.id }, data: dados });
}

async function buscarItemDoPersonagem(personagemId, itemPersonagemId) {
  const idItemPersonagem = Number(itemPersonagemId);

  if (!Number.isInteger(idItemPersonagem)) {
    throw erroDeValidacao("Item de inventário inválido.");
  }

  const itemPersonagem = await prisma.itemPersonagem.findUnique({
    where: { id: idItemPersonagem },
    include: { item: true },
  });

  if (!itemPersonagem || itemPersonagem.personagemId !== personagemId) {
    throw erroNaoEncontrado("Item não encontrado no inventário do personagem.");
  }

  return itemPersonagem;
}

// Tipos de item (Item.tipo) que têm slot no personagem — mesmos slots de
// EditarPersonagem.jsx. Itens de outros tipos podem existir no inventário,
// mas não podem ser equipados.
const TIPOS_EQUIPAVEIS = ["capacete", "peitoral", "arma", "costas"];

// Equipa um item, desequipando antes qualquer outro item do mesmo slot
// (Item.tipo) — EditarPersonagem.jsx só tem uma posição por slot.
async function equiparItem(usuarioId, itemPersonagemId) {
  const personagem = await buscarOuCriarPersonagem(usuarioId);
  const itemPersonagem = await buscarItemDoPersonagem(personagem.id, itemPersonagemId);

  if (!TIPOS_EQUIPAVEIS.includes(itemPersonagem.item.tipo)) {
    throw erroDeValidacao("Este item não pode ser equipado.");
  }

  await prisma.$transaction([
    prisma.itemPersonagem.updateMany({
      where: {
        personagemId: personagem.id,
        equipado: true,
        item: { tipo: itemPersonagem.item.tipo },
      },
      data: { equipado: false },
    }),
    prisma.itemPersonagem.update({
      where: { id: itemPersonagem.id },
      data: { equipado: true },
    }),
  ]);

  return prisma.itemPersonagem.findUnique({
    where: { id: itemPersonagem.id },
    include: { item: true },
  });
}

async function desequiparItem(usuarioId, itemPersonagemId) {
  const personagem = await buscarOuCriarPersonagem(usuarioId);
  const itemPersonagem = await buscarItemDoPersonagem(personagem.id, itemPersonagemId);

  return prisma.itemPersonagem.update({
    where: { id: itemPersonagem.id },
    data: { equipado: false },
    include: { item: true },
  });
}

// Adiciona um item ao inventário do personagem (cria o personagem se for o
// primeiro acesso) — se ele já tinha esse item, só soma quantidade em vez
// de duplicar a linha em ItemPersonagem. Devolve a quantidade que ficou.
// Usado pela recompensa de desafio (progresso.service) e pelo baú de fim
// de mundo (bau.service).
async function concederItem(usuarioId, itemId) {
  const personagem = await buscarOuCriarPersonagem(usuarioId);

  const itemPersonagem = await prisma.itemPersonagem.upsert({
    where: { personagemId_itemId: { personagemId: personagem.id, itemId } },
    update: { quantidade: { increment: 1 } },
    create: { personagemId: personagem.id, itemId },
  });

  return itemPersonagem.quantidade;
}

module.exports = {
  buscarOuCriarPersonagem,
  concederItem,
  buscarPersonagem,
  atualizarPersonagem,
  equiparItem,
  desequiparItem,
};
