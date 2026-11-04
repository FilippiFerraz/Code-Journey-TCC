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
  // Os itens são buscados pelo dono (usuarioId) ao mesmo tempo que o
  // personagem, em vez de esperar o personagem ficar pronto. Personagem
  // recém-criado não tem item nenhum, então a lista vazia também está certa.
  const [personagem, itens] = await Promise.all([
    buscarOuCriarPersonagem(usuarioId),
    prisma.itemPersonagem.findMany({
      where: { personagem: { usuarioId } },
      include: { item: true },
      orderBy: { obtidoEm: "desc" },
    }),
  ]);

  return { ...personagem, itens };
}

async function atualizarPersonagem(usuarioId, { nome, imagemUrl, aparencia }) {
  const personagem = await buscarOuCriarPersonagem(usuarioId);

  const dados = {};
  if (nome !== undefined) {
    if (!nome.trim()) throw erroDeValidacao("Nome não pode ficar vazio.");
    dados.nome = nome.trim();
  }
  if (imagemUrl !== undefined) dados.imagemUrl = imagemUrl;
  // já validada na rota (APARENCIAS em validacoes/esquemas.js)
  if (aparencia !== undefined) dados.aparencia = aparencia;

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
const TIPOS_EQUIPAVEIS = ["capacete", "peitoral", "arma", "costas", "botas", "escudo", "luvas"];

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
// primeiro acesso). Recompensas NUNCA acumulam: cada item é único no
// inventário, então quem já tem o item continua com 1 — refazer um desafio
// ou o baú sortear um item repetido não gera cópias. Vale também pra quem
// concluiu um desafio antes de ele ganhar esse item (pelo seed ou pelo
// painel de admin): recebe ao refazer, ou via `npm run recompensas:sincronizar`.
// Devolve { quantidade, concedido } — concedido = false quando já tinha.
// Usado pela recompensa de desafio (progresso.service) e pelo baú de fim
// de mundo (bau.service).
async function concederItemSeNaoTiver(usuarioId, itemId) {
  const personagem = await buscarOuCriarPersonagem(usuarioId);
  const chave = { personagemId_itemId: { personagemId: personagem.id, itemId } };

  const existente = await prisma.itemPersonagem.findUnique({ where: chave });
  if (existente) return { quantidade: existente.quantidade, concedido: false };

  // upsert (e não create): duas respostas simultâneas não estouram a
  // restrição única de (personagemId, itemId) nem criam cópia.
  const criado = await prisma.itemPersonagem.upsert({
    where: chave,
    update: {},
    create: { personagemId: personagem.id, itemId },
  });
  return { quantidade: criado.quantidade, concedido: true };
}

module.exports = {
  buscarOuCriarPersonagem,
  concederItemSeNaoTiver,
  buscarPersonagem,
  atualizarPersonagem,
  equiparItem,
  desequiparItem,
};
