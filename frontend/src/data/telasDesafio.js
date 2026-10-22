// Quais desafios têm tela própria, com conteúdo fixo no frontend — e
// portanto quais NÃO têm e precisam ser jogados na tela genérica
// (DesafioEtapas, rota /etapas), que busca conteúdo e correção na API.
//
// Por que isso existe: o painel de admin cadastra desafios novos direto no
// banco, mas as telas antigas só conhecem o conteúdo escrito nelas. Sem
// esta lista, um desafio sem tela própria (ex: os desafios 3 a 6 do portal
// 2) caía no conteúdo do desafio 1 do portal 1: o jogador via a pergunta
// errada e, nos formatos diferentes, o servidor recusava a resposta — a
// tela mostrava vitória, mas o progresso nunca era salvo.
//
// Mudou o conteúdo fixo de alguma tela (ResolverDesafio, DesafioIntro,
// DesafioChefe, ResolverDesafioPocao, DesafioIntroPocao)? Ajuste aqui.
const TELAS_PROPRIAS = {
  // ResolverDesafio + DesafioIntro (múltipla escolha, blocos, cartas, dissertativa)
  resolver: { 1: [1, 2, 3, 4], 2: [1, 2] },
  // ResolverDesafioPocao + DesafioIntroPocao
  pocao: { 1: [5] },
  // DesafioChefe (o último desafio da trilha)
  chefe: { 1: [6] },
};

export function temTelaPropria(tela, mundoId, numero) {
  return TELAS_PROPRIAS[tela]?.[Number(mundoId)]?.includes(Number(numero)) ?? false;
}

// Rota de jogo de um desafio da lista (Desafios.jsx). `chefe` = último da
// trilha; `totalEtapas` vem do progresso da API.
export function rotaDoDesafio({ mundoId, dificuldade, numero, chefe, totalEtapas }) {
  const base = `${mundoId}/${dificuldade}/${numero}`;
  if (totalEtapas > 1) return `/etapas/${base}`;
  if (chefe) return temTelaPropria("chefe", mundoId, numero) ? `/desafio-chefe/${base}` : `/etapas/${base}`;
  if (temTelaPropria("pocao", mundoId, numero)) return `/desafio-pocao/${base}`;
  if (temTelaPropria("resolver", mundoId, numero)) return `/desafio/${base}`;
  return `/etapas/${base}`;
}
