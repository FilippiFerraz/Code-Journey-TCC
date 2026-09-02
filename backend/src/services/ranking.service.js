const prisma = require("../config/prisma");

// Quantos jogadores aparecem na lista principal (ver Ranking.jsx).
const LIMITE_RANKING = 50;

// Posição = 1 + quantos usuários têm mais XP. Simples e correto pro tamanho
// do app hoje; se a base de usuários crescer muito, isso merece virar uma
// coluna materializada em vez de contar a cada requisição.
// Reaproveitado por perfil.service.js pra manter a mesma regra nos dois lugares.
async function posicaoDoUsuario(xpTotal) {
  const usuariosComXpMaior = await prisma.usuario.count({
    where: { xpTotal: { gt: xpTotal } },
  });
  return usuariosComXpMaior + 1;
}

// Ranking global: os top N por XP, mais a posição de quem está pedindo
// (mesmo que ele não apareça na lista principal).
async function listarRanking(usuarioId) {
  const usuarioAtual = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { id: true, nome: true, xpTotal: true },
  });

  if (!usuarioAtual) {
    const erro = new Error("Usuário não encontrado.");
    erro.status = 404;
    throw erro;
  }

  const topUsuarios = await prisma.usuario.findMany({
    orderBy: { xpTotal: "desc" },
    select: { id: true, nome: true, xpTotal: true },
    take: LIMITE_RANKING,
  });

  return {
    eu: {
      id: usuarioAtual.id,
      nome: usuarioAtual.nome,
      xpTotal: usuarioAtual.xpTotal,
      posicao: await posicaoDoUsuario(usuarioAtual.xpTotal),
    },
    top: topUsuarios.map((usuario, indice) => ({
      id: usuario.id,
      nome: usuario.nome,
      xpTotal: usuario.xpTotal,
      posicao: indice + 1,
    })),
  };
}

module.exports = { listarRanking, posicaoDoUsuario };
