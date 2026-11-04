// O Prisma não escapa os curingas do LIKE/ILIKE do Postgres num filtro
// `contains`: sem isto, buscar "%" ou "_" casava com qualquer texto (a busca
// de jogadores da Home listava todo mundo). Usado nas buscas por texto.
function escaparLike(termo) {
  return termo.replace(/[\\%_]/g, "\\$&");
}

module.exports = { escaparLike };
