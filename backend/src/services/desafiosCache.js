// Lista leve dos desafios (sem o conteúdo/gabarito) guardada em memória.
// Várias rotas precisam só de "quais desafios existem e quantas etapas cada
// um tem" (progresso, baús, trava de desbloqueio) e isso quase nunca muda.
// Sem o cache, cada chamada baixava do banco o JSON completo de todos os
// desafios — e na Vercel o banco fica a uma viagem de rede de distância.
//
// Mudou um desafio pelo painel de admin? desafio.service.js chama
// limparCacheDesafios(); nas outras instâncias vale o TTL.
const prisma = require("../config/prisma");
const { totalDeEtapas } = require("./etapas.service");

const TTL_MS = 60 * 1000;
let cache = null;
let validoAte = 0;
let carregando = null;

async function carregar() {
  const desafios = await prisma.desafio.findMany({
    orderBy: [{ mundoId: "asc" }, { dificuldade: "asc" }, { numero: "asc" }],
    select: { id: true, mundoId: true, dificuldade: true, numero: true, alternativas: true },
  });
  return desafios.map(({ alternativas, ...resto }) => ({
    ...resto,
    totalEtapas: totalDeEtapas(alternativas),
  }));
}

// [{ id, mundoId, dificuldade, numero, totalEtapas }], ordenada por
// mundo, dificuldade e número.
async function listarDesafiosResumo() {
  if (cache && validoAte > Date.now()) return cache;
  // várias requisições simultâneas compartilham a mesma consulta
  if (!carregando) {
    carregando = carregar()
      .then((lista) => {
        cache = lista;
        validoAte = Date.now() + TTL_MS;
        return lista;
      })
      .finally(() => {
        carregando = null;
      });
  }
  return carregando;
}

function limparCacheDesafios() {
  cache = null;
  validoAte = 0;
}

module.exports = { listarDesafiosResumo, limparCacheDesafios };
