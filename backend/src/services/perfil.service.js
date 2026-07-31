// Ajuste este require ao mesmo estilo do seu auth.service.js.
// Se lá for "const { prisma } = require(...)", use a mesma forma aqui.
const prisma = require("../config/prisma.js");

// Busca os dados do perfil do usuário logado.
// Hoje o banco só tem nome, email e criadoEm — o resto é preenchido
// quando existirem os modelos de Progresso, Conquistas, Ranking e Itens.
async function buscarPerfil(usuarioId) {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { id: true, nome: true, email: true, criadoEm: true },
  });

  if (!usuario) {
    const erro = new Error("Usuário não encontrado.");
    erro.status = 404;
    throw erro;
  }

  // @usuário provisório derivado do e-mail (parte antes do @).
  // Futuro: coluna própria "nomeUsuario" na fase de personalização.
  const nomeUsuario = usuario.email.split("@")[0];

  return {
    id: usuario.id,
    nome: usuario.nome,
    nomeUsuario,
    membroDesde: usuario.criadoEm,

    // ---- Ainda sem fonte de dados no banco (placeholders honestos) ----
    conquistas: 0, // TODO: sistema de conquistas
    acertos: 0, // TODO: modelo Progresso
    diasOfensiva: 0, // TODO: streak de dias (modelo Progresso)
    ranking: { posicao: null }, // TODO: consulta de ranking
    itensDestaque: [], // TODO: inventário do usuário
  };
}

module.exports = { buscarPerfil };