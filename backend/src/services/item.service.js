const prisma = require("../config/prisma");

// Itens que podem sair no Baú da Sorte, só leitura — usado pela roleta
// (frontend/src/pages/BauDaSorte) pra montar a fita com os itens reais.
// bauRei: a roleta do Baú Real (Item.exclusivoRei) em vez da do baú de
// módulo (Item.exclusivoBau). O sorteio de verdade continua no backend
// (bau.service.js); esta lista é só o que aparece girando.
async function listarItens({ bauRei = false } = {}) {
  return prisma.item.findMany({
    where: bauRei ? { exclusivoRei: true } : { exclusivoBau: true },
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
