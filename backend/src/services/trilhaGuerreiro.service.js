// Trilha "guerreiro" (difícil) = espelho da trilha "iniciante".
//
// Os desafios do modo Guerreiro são OS MESMOS da trilha iniciante, mas cada
// um vive na própria linha de Desafio (dificuldade "guerreiro"). Assim todo
// o resto do jogo já funciona por trilha sem mudança nenhuma: progresso e
// desbloqueio separados, baú de fim de módulo próprio, "EM BREVE" na tela de
// dificuldade, etc. A cópia vai SEM dica (nem a do desafio nem a de cada
// etapa dos desafios de várias etapas).
//
// Quem mantém o espelho em dia:
// - scripts/sincronizarTrilhaGuerreiro.js (npm run trilha:guerreiro), que
//   cria/atualiza todas as cópias de uma vez;
// - desafio.service.js::atualizarDesafio, que repete na cópia qualquer
//   edição feita pelo painel de admin num desafio iniciante.
const prisma = require("../config/prisma");
const { REGRAS_DIFICULDADE } = require("../config/dificuldades");
const { temVariasEtapas } = require("./etapas.service");
const { limparCacheDesafios } = require("./desafiosCache");

const DIFICULDADE_GUERREIRO = "guerreiro";
const DIFICULDADE_ORIGEM = REGRAS_DIFICULDADE.guerreiro.espelhoDe;

// Conteúdo do desafio sem nenhuma dica (as etapas do portal 3 têm dica
// própria dentro de alternativas.etapas).
function alternativasSemDica(alternativas) {
  if (!temVariasEtapas(alternativas)) return alternativas;
  return {
    ...alternativas,
    etapas: alternativas.etapas.map(({ dica, ...etapa }) => etapa),
  };
}

// Campos copiados do desafio iniciante pro espelho guerreiro. O XP base é o
// mesmo — o multiplicador do modo Guerreiro é aplicado na hora de vencer
// (ver progresso.service.js), pra não depender do que está gravado aqui.
function dadosDoEspelho(origem) {
  return {
    titulo: origem.titulo,
    enunciado: origem.enunciado,
    dica: null,
    alternativas: alternativasSemDica(origem.alternativas),
    xpConcedido: origem.xpConcedido,
    tipoRecompensa: origem.tipoRecompensa,
    nomeRecompensa: origem.nomeRecompensa,
    descricaoRecompensa: origem.descricaoRecompensa,
    iconeRecompensa: origem.iconeRecompensa,
    itemRecompensaId: origem.itemRecompensaId,
  };
}

function chaveDoEspelho(origem) {
  return {
    mundoId: origem.mundoId,
    dificuldade: DIFICULDADE_GUERREIRO,
    numero: origem.numero,
  };
}

// Cria ou atualiza a cópia guerreiro de UM desafio iniciante. Desafios de
// outras trilhas são ignorados (devolve null). Desafios que já existem
// mantêm o id — o progresso dos jogadores continua ligado a eles.
async function espelharDesafio(origem, { limparCache = true } = {}) {
  if (origem.dificuldade !== DIFICULDADE_ORIGEM) return null;
  const chave = chaveDoEspelho(origem);
  const dados = dadosDoEspelho(origem);
  const salvo = await prisma.desafio.upsert({
    where: { mundoId_dificuldade_numero: chave },
    update: dados,
    create: { ...chave, ...dados },
  });
  if (limparCache) limparCacheDesafios();
  return salvo;
}

// Espelha todos os desafios iniciante. Com simular = true só devolve o que
// mudaria, sem gravar nada. Devolve [{ mundoId, numero, titulo, acao }].
async function sincronizarTrilhaGuerreiro({ simular = false } = {}) {
  const [origens, existentes] = await Promise.all([
    prisma.desafio.findMany({
      where: { dificuldade: DIFICULDADE_ORIGEM },
      orderBy: [{ mundoId: "asc" }, { numero: "asc" }],
    }),
    prisma.desafio.findMany({
      where: { dificuldade: DIFICULDADE_GUERREIRO },
      select: { mundoId: true, numero: true },
    }),
  ]);
  const jaExiste = new Set(existentes.map((d) => `${d.mundoId}/${d.numero}`));

  const resultado = [];
  for (const origem of origens) {
    const acao = jaExiste.has(`${origem.mundoId}/${origem.numero}`) ? "atualiza" : "cria";
    if (!simular) await espelharDesafio(origem, { limparCache: false });
    resultado.push({ mundoId: origem.mundoId, numero: origem.numero, titulo: origem.titulo, acao });
  }
  if (!simular) limparCacheDesafios();
  return resultado;
}

module.exports = {
  DIFICULDADE_GUERREIRO,
  alternativasSemDica,
  espelharDesafio,
  sincronizarTrilhaGuerreiro,
};
