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

// Equipa um item, desequipando antes qualquer outro item do mesmo slot
// (Item.tipo) — hoje EditarPersonagem.jsx só tem uma posição por slot
// (capacete, peitoral, sapato, arma, costas, acessorios).
async function equiparItem(usuarioId, itemPersonagemId) {
  const personagem = await buscarOuCriarPersonagem(usuarioId);
  const itemPersonagem = await buscarItemDoPersonagem(personagem.id, itemPersonagemId);

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

module.exports = {
  buscarOuCriarPersonagem,
  buscarPersonagem,
  atualizarPersonagem,
  equiparItem,
  desequiparItem,
};
