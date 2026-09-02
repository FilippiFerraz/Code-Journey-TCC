// Ajuste este require ao mesmo estilo do seu auth.service.js.
// Se lá for "const { prisma } = require(...)", use a mesma forma aqui.
const prisma = require("../config/prisma.js");
const { posicaoDoUsuario } = require("./ranking.service.js");

// Quantidade de itens em destaque mostrados no perfil (os equipados mais
// recentes primeiro — ver Perfil.jsx, seção "Itens em destaque").
const LIMITE_ITENS_DESTAQUE = 3;

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

  const itensEquipados = personagem
    ? await prisma.itemPersonagem.findMany({
        where: { personagemId: personagem.id, equipado: true },
        include: { item: true },
        orderBy: { obtidoEm: "desc" },
        take: LIMITE_ITENS_DESTAQUE,
      })
    : [];

  return {
    id: usuario.id,
    nome: usuario.nome,
    nomeUsuario,
    membroDesde: usuario.criadoEm,
    tutorialVisto: usuario.tutorialVisto,
    role: usuario.role,

    conquistas: 0, // TODO: sistema de conquistas ainda não existe no schema
    acertos,
    diasOfensiva: 0, // TODO: streak de dias — precisa agrupar Progresso.dataConclusao por dia
    ranking: { posicao: await posicaoDoUsuario(usuario.xpTotal) },
    itensDestaque: itensEquipados.map(({ item }) => ({
      id: item.id,
      nome: item.nome,
      icone: item.icone,
      // nome do arquivo em frontend/src/assets/images — ver data/itemImagens.js,
      // que resolve isso pra imagem estática real (não é uma URL de verdade)
      imagemUrl: item.imagemUrl,
    })),
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

module.exports = { buscarPerfil, marcarTutorialVisto };