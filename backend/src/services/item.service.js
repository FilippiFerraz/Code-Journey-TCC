const prisma = require("../config/prisma");

// Itens que podem sair no Baú da Sorte, só leitura — usado pela roleta
// (frontend/src/pages/BauDaSorte) pra montar a fita com os itens reais.
// filtro: a roleta de um baú especial (ver filtroItensBauEspecial em
// bau.service.js); sem ele, a do baú de módulo (Item.exclusivoBau). O
// sorteio de verdade continua no backend; esta lista é só o que aparece girando.
async function listarItens({ filtro = { exclusivoBau: true } } = {}) {
  return prisma.item.findMany({
    where: filtro,
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
