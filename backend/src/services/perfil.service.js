// Ajuste este require ao mesmo estilo do seu auth.service.js.
// Se lá for "const { prisma } = require(...)", use a mesma forma aqui.
const prisma = require("../config/prisma.js");
const { posicaoDoUsuario } = require("./ranking.service.js");

// Quantidade de itens em destaque mostrados no perfil (os equipados mais
// recentes primeiro — ver Perfil.jsx, seção "Itens em destaque").
const LIMITE_ITENS_DESTAQUE = 3;

// Itens equipados de um personagem, no formato usado em "itensDestaque" —
// compartilhado por buscarPerfil (dono) e buscarPerfilPublico (visita).
async function montarItensDestaque(personagem) {
  const itensEquipados = personagem
    ? await prisma.itemPersonagem.findMany({
        where: { personagemId: personagem.id, equipado: true },
        include: { item: true },
        orderBy: { obtidoEm: "desc" },
        take: LIMITE_ITENS_DESTAQUE,
      })
    : [];

  return itensEquipados.map(({ item }) => ({
    id: item.id,
    nome: item.nome,
    icone: item.icone,
    // chave do sprite do item — ver frontend/src/data/spritesPersonagem.js
    imagemUrl: item.imagemUrl,
  }));
}

// TODOS os itens equipados (sem o limite de itensDestaque), com o slot
// (tipo) — é o que o frontend precisa pra montar o guerreiro em camadas
// (AvatarPersonagem.jsx), inclusive no perfil de outro jogador.
async function montarItensEquipados(personagem) {
  if (!personagem) return [];
  const equipados = await prisma.itemPersonagem.findMany({
    where: { personagemId: personagem.id, equipado: true },
    include: { item: { select: { tipo: true, imagemUrl: true } } },
  });
  return equipados.map(({ item }) => ({ tipo: item.tipo, imagemUrl: item.imagemUrl }));
}

// Busca os dados do perfil do usuário logado.
async function buscarPerfil(usuarioId) {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: {
      id: true,
      nome: true,
      email: true,
      criadoEm: true,
      xpTotal: true,
      tutorialVisto: true,
      role: true,
    },
  });

  if (!usuario) {
    const erro = new Error("Usuário não encontrado.");
    erro.status = 404;
    throw erro;
  }

  // @usuário provisório derivado do e-mail (parte antes do @).
  // Futuro: coluna própria "nomeUsuario" na fase de personalização.
  const nomeUsuario = usuario.email.split("@")[0];

  const acertos = await prisma.progresso.count({
    where: { usuarioId, concluido: true },
  });

  const personagem = await prisma.personagem.findUnique({ where: { usuarioId } });
  const itensDestaque = await montarItensDestaque(personagem);
  const itensEquipados = await montarItensEquipados(personagem);

  return {
    id: usuario.id,
    nome: usuario.nome,
    nomeUsuario,
    membroDesde: usuario.criadoEm,
    tutorialVisto: usuario.tutorialVisto,
    role: usuario.role,

    acertos,
    diasOfensiva: 0, // TODO: streak de dias — precisa agrupar Progresso.dataConclusao por dia
    ranking: { posicao: await posicaoDoUsuario(usuario.xpTotal) },
    itensDestaque,
    itensEquipados,
  };
}

// Busca jogadores pelo nome (contém, sem diferenciar maiúsculas/minúsculas)
// pra popular a barra de pesquisa da Home. Nunca inclui o próprio usuário
// logado no resultado — ele já tem a própria tela de Perfil.
const LIMITE_BUSCA = 20;

async function buscarUsuariosPorNome(usuarioIdAtual, termo) {
  const termoLimpo = (termo ?? "").trim();
  if (!termoLimpo) return [];

  const usuarios = await prisma.usuario.findMany({
    where: {
      nome: { contains: termoLimpo, mode: "insensitive" },
      id: { not: usuarioIdAtual },
    },
    select: { id: true, nome: true, email: true },
    orderBy: { nome: "asc" },
    take: LIMITE_BUSCA,
  });

  return usuarios.map((usuario) => ({
    id: usuario.id,
    nome: usuario.nome,
    // mesmo @handle provisório usado em buscarPerfil (derivado do e-mail)
    nomeUsuario: usuario.email.split("@")[0],
  }));
}

// Perfil de OUTRO usuário, visto a partir da busca da Home — mesmo formato
// de buscarPerfil, mas sem e-mail/tutorialVisto/role, e a posição no
// ranking respeita Usuario.rankingVisivel (se o dono do perfil escondeu a
// posição, quem visita não vê — mas ele próprio sempre vê a sua, em
// buscarPerfil).
async function buscarPerfilPublico(usuarioId) {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: {
      id: true,
      nome: true,
      email: true,
      criadoEm: true,
      xpTotal: true,
      rankingVisivel: true,
    },
  });

  if (!usuario) {
    const erro = new Error("Usuário não encontrado.");
    erro.status = 404;
    throw erro;
  }

  const nomeUsuario = usuario.email.split("@")[0];

  const acertos = await prisma.progresso.count({
    where: { usuarioId, concluido: true },
  });

  const personagem = await prisma.personagem.findUnique({ where: { usuarioId } });
  const itensDestaque = await montarItensDestaque(personagem);
  // Pra Perfil.jsx montar o guerreiro de QUEM está sendo visitado, não o de
  // quem está olhando.
  const itensEquipados = await montarItensEquipados(personagem);

  return {
    id: usuario.id,
    nome: usuario.nome,
    nomeUsuario,
    membroDesde: usuario.criadoEm,

    acertos,
    diasOfensiva: 0,
    ranking: {
      posicao: usuario.rankingVisivel ? await posicaoDoUsuario(usuario.xpTotal) : null,
    },
    itensDestaque,
    itensEquipados,
  };
}

// Marca que o jogador já viu o tutorial guiado da Home. Chamado quando ele
// termina (ou fecha) o TutorialHome.jsx.
async function marcarTutorialVisto(usuarioId) {
  await prisma.usuario.update({
    where: { id: usuarioId },
    data: { tutorialVisto: true },
  });
}

module.exports = {
  buscarPerfil,
  marcarTutorialVisto,
  buscarUsuariosPorNome,
  buscarPerfilPublico,
};