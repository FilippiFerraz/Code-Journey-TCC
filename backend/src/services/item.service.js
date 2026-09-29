const prisma = require("../config/prisma");

// Catálogo de itens do jogo (tabela "itens"), só leitura — usado pela
// roleta do Baú da Sorte (frontend/src/pages/BauDaSorte) pra montar a fita
// com os itens reais. O sorteio de verdade continua no backend
// (bau.service.js); esta lista é só o que aparece girando.
async function listarItens() {
  return prisma.item.findMany({
    select: {
      id: true,
      nome: true,
      tipo: true,
      raridade: true,
      descricao: true,
      icone: true,
      imagemUrl: true,
    },
    orderBy: { id: "asc" },
  });
}

module.exports = { listarItens };
