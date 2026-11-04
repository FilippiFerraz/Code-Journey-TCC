// Ajuste este require ao mesmo estilo do seu auth.service.js.
// Se lá for "const { prisma } = require(...)", use a mesma forma aqui.
const prisma = require("../config/prisma.js");
const { escaparLike } = require("../utils/busca.js");
const { posicaoDoUsuario } = require("./ranking.service.js");
const { resumoJogador } = require("./resumoJogador.service.js");

// Quantidade de itens em destaque mostrados no perfil (os equipados mais
// recentes primeiro — ver Perfil.jsx, seção "Itens em destaque").
const LIMITE_ITENS_DESTAQUE = 3;

// @usuário exibido no perfil e na busca. Antes era a parte do e-mail antes
// do @ — visível pra QUALQUER jogador logado (busca da Home, perfil público),
// o que expunha parte do e-mail de todo mundo (dado pessoal; muitos jogadores
// são menores de idade). Agora sai do nome + id: único e sem dado de contato.
function handleDoUsuario(usuario) {
  const base = String(usuario.nome ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 20);
  return (base || "jogador") + usuario.id;
}

// Itens equipados de um usuário, numa consulta só e filtrando direto pelo dono
// (antes: buscar o personagem, depois os itens em destaque, depois os
// equipados — três idas ao banco, uma depois da outra).
function buscarEquipados(usuarioId) {
  return prisma.itemPersonagem.findMany({
    where: { equipado: true, personagem: { usuarioId } },
    include: { item: true },
    orderBy: { obtidoEm: "desc" },
  });
}

// Itens em "itensDestaque" — compartilhado por buscarPerfil (dono) e
// buscarPerfilPublico (visita).
function itensDestaqueDe(equipados) {
  return equipados.slice(0, LIMITE_ITENS_DESTAQUE).map(({ item }) => ({
    id: item.id,
    nome: item.nome,
    icone: item.icone,
    // chave do sprite do item — ver frontend/src/data/spritesPersonagem.js
    imagemUrl: item.imagemUrl,
  }));
}

// TODOS os itens equipados (sem o limite de itensDestaque), com o slot
// (tipo) — é o que o frontend precisa pra montar o guerreiro em camadas
// (AvatarPersonagem.jsx), inclusive no perfil de outro jogador. Nome e
// raridade vão pro tooltip dos slots do Card de Perfil (PerfilJogadorCard.jsx).
function itensEquipadosDe(equipados) {
  return equipados.map(({ item }) => ({
    tipo: item.tipo,
    imagemUrl: item.imagemUrl,
    nome: item.nome,
    raridade: item.raridade,
    icone: item.icone,
  }));
}

// Busca os dados do perfil do usuário logado.
async function buscarPerfil(usuarioId) {
  // Consultas independentes saem juntas (antes: uma depois da outra).
  const [usuario, acertos, equipados] = await Promise.all([
    prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        id: true,
        nome: true,
        email: true,
        criadoEm: true,
        xpTotal: true,
        moedas: true,
        tutorialVisto: true,
        introVista: true,
        role: true,
        // aparência do herói (Personagem.aparencia), na mesma consulta
        personagem: { select: { aparencia: true } },
      },
    }),
    prisma.progresso.count({ where: { usuarioId, concluido: true } }),
    buscarEquipados(usuarioId),
  ]);

  if (!usuario) {
    const erro = new Error("Usuário não encontrado.");
    erro.status = 404;
    throw erro;
  }

  const nomeUsuario = handleDoUsuario(usuario);

  const [posicao, resumo] = await Promise.all([
    posicaoDoUsuario(usuario.xpTotal),
    resumoJogador(usuario.id, usuario.xpTotal, usuario.moedas),
  ]);

  return {
    id: usuario.id,
    nome: usuario.nome,
    nomeUsuario,
    membroDesde: usuario.criadoEm,
    tutorialVisto: usuario.tutorialVisto,
    introVista: usuario.introVista,
    role: usuario.role,
    // null = ainda não escolheu (a Home abre EscolherAparencia.jsx)
    aparencia: usuario.personagem?.aparencia ?? null,

    acertos,
    // nivel, diasOfensiva, ouro, cristais e titulo — ver resumoJogador.service.js
    ...resumo,
    ranking: { posicao },
    itensDestaque: itensDestaqueDe(equipados),
    itensEquipados: itensEquipadosDe(equipados),
  };
}

// Busca jogadores pelo nome (contém, sem diferenciar maiúsculas/minúsculas)
// pra popular a barra de pesquisa da Home. Nunca inclui o próprio usuário
// logado no resultado — ele já tem a própria tela de Perfil.
const LIMITE_BUSCA = 20;

async function buscarUsuariosPorNome(usuarioIdAtual, termo) {
  const termoLimpo = (termo ?? "").trim();
  if (!termoLimpo) return [];

  const termoEscapado = escaparLike(termoLimpo);

  const usuarios = await prisma.usuario.findMany({
    where: {
      nome: { contains: termoEscapado, mode: "insensitive" },
      id: { not: usuarioIdAtual },
    },
    select: { id: true, nome: true },
    orderBy: { nome: "asc" },
    take: LIMITE_BUSCA,
  });

  return usuarios.map((usuario) => ({
    id: usuario.id,
    nome: usuario.nome,
    nomeUsuario: handleDoUsuario(usuario),
  }));
}

// Perfil de OUTRO usuário, visto a partir da busca da Home — mesmo formato
// de buscarPerfil, mas sem e-mail/tutorialVisto/role, e a posição no
// ranking respeita Usuario.rankingVisivel (se o dono do perfil escondeu a
// posição, quem visita não vê — mas ele próprio sempre vê a sua, em
// buscarPerfil).
async function buscarPerfilPublico(usuarioId) {
  const [usuario, acertos, equipados] = await Promise.all([
    prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        id: true,
        nome: true,
        criadoEm: true,
        xpTotal: true,
        moedas: true,
        rankingVisivel: true,
        // aparência do herói (Personagem.aparencia), na mesma consulta
        personagem: { select: { aparencia: true } },
      },
    }),
    prisma.progresso.count({ where: { usuarioId, concluido: true } }),
    buscarEquipados(usuarioId),
  ]);

  if (!usuario) {
    const erro = new Error("Usuário não encontrado.");
    erro.status = 404;
    throw erro;
  }

  const nomeUsuario = handleDoUsuario(usuario);
  const [posicao, resumo] = await Promise.all([
    usuario.rankingVisivel ? posicaoDoUsuario(usuario.xpTotal) : null,
    resumoJogador(usuario.id, usuario.xpTotal, usuario.moedas),
  ]);

  return {
    id: usuario.id,
    nome: usuario.nome,
    nomeUsuario,
    membroDesde: usuario.criadoEm,

    acertos,
    ...resumo,
    ranking: { posicao },
    // aparencia e itensEquipados: pra Perfil.jsx montar o guerreiro de QUEM está sendo
    // visitado, não o de quem está olhando.
    aparencia: usuario.personagem?.aparencia ?? null,
    itensDestaque: itensDestaqueDe(equipados),
    itensEquipados: itensEquipadosDe(equipados),
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

// Marca que o jogador já assistiu a cutscene de introdução. Chamado quando
// ela termina (ou é pulada) — ver IntroCutscene.jsx.
async function marcarIntroVista(usuarioId) {
  await prisma.usuario.update({
    where: { id: usuarioId },
    data: { introVista: true },
  });
}

module.exports = {
  buscarPerfil,
  marcarTutorialVisto,
  marcarIntroVista,
  buscarUsuariosPorNome,
  buscarPerfilPublico,
};