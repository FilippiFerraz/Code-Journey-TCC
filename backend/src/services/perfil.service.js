// Ajuste este require ao mesmo estilo do seu auth.service.js.
// Se lá for "const { prisma } = require(...)", use a mesma forma aqui.
const prisma = require("../config/prisma.js");

// Quantidade de itens em destaque mostrados no perfil (os equipados mais
// recentes primeiro — ver Perfil.jsx, seção "Itens em destaque").
const LIMITE_ITENS_DESTAQUE = 3;

// Busca os dados do perfil do usuário logado.
async function buscarPerfil(usuarioId) {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { id: true, nome: true, email: true, criadoEm: true, xpTotal: true },
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

  // Posição = 1 + quantos usuários têm mais XP. Simples e correto pro
  // tamanho do app hoje; se a base de usuários crescer muito, isso merece
  // virar uma coluna materializada em vez de contar a cada requisição.
  const usuariosComXpMaior = await prisma.usuario.count({
    where: { xpTotal: { gt: usuario.xpTotal } },
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

    conquistas: 0, // TODO: sistema de conquistas ainda não existe no schema
    acertos,
    diasOfensiva: 0, // TODO: streak de dias — precisa agrupar Progresso.dataConclusao por dia
    ranking: { posicao: usuariosComXpMaior + 1 },
    itensDestaque: itensEquipados.map(({ item }) => ({
      id: item.id,
      nome: item.nome,
      icone: item.icone,
    })),
  };
}

module.exports = { buscarPerfil };