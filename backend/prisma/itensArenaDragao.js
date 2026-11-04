// Coleção "Draconiana": as recompensas dos 6 desafios do Portal 3 (Arena do
// Dragão, trilha iniciante) — `desafio` é o número do desafio que dá o item
// ao ser concluído pela primeira vez. Não são exclusivos de baú (podem ser
// escolhidos como recompensa no painel de admin).
// Entram no seed.js junto dos outros itens; ficam num arquivo próprio pra
// poderem ser cadastrados sozinhos num banco que já está em uso
// (scripts/cadastrarItensArenaDragao.js).
// Camadas geradas por `npm run itens:arena-dragao` no frontend, a partir das
// artes em frontend/arte-original/itens-arena-dragao. As manoplas usam o
// slot "luvas".
module.exports = [
  {
    desafio: 1,
    nome: "Elmo Draconiano",
    tipo: "capacete",
    raridade: "raro",
    descricao: "Elmo de escamas roxas com chifres de dragão — quem o usa enxerga o escopo de cada variável.",
    icone: "🪖",
    imagemUrl: "capacete/elmo-draconiano",
    bonusDefesa: 4,
    bonusAtaque: 1,
  },
  {
    desafio: 2,
    nome: "Manoplas Draconianas",
    tipo: "luvas",
    raridade: "raro",
    descricao: "Manoplas com garras de dragão: nada escapa do que elas agarram — nem as variáveis de uma closure.",
    icone: "🧤",
    imagemUrl: "luvas/manoplas-draconianas",
    bonusDefesa: 2,
    bonusAtaque: 3,
  },
  {
    desafio: 3,
    nome: "Botas Draconianas",
    tipo: "botas",
    raridade: "raro",
    descricao: "Botas de couro com escamas e garras douradas, firmes em qualquer encadeamento de arrays.",
    icone: "🥾",
    imagemUrl: "botas/botas-draconianas",
    bonusDefesa: 4,
    bonusAtaque: 1,
  },
  {
    desafio: 4,
    nome: "Couraça Draconiana",
    tipo: "peitoral",
    raridade: "epico",
    descricao: "Couraça de escamas roxas com ombreiras douradas — aguenta qualquer volta do event loop.",
    icone: "🛡️",
    imagemUrl: "peitoral/couraca-draconiana",
    bonusDefesa: 9,
    bonusAtaque: 0,
  },
  {
    desafio: 5,
    nome: "Escudo Draconiano",
    tipo: "escudo",
    raridade: "epico",
    descricao: "Escudo com a face do dragão gravada: rebate == e deixa passar só o ===.",
    icone: "🐲",
    imagemUrl: "escudo/escudo-draconiano",
    bonusDefesa: 8,
    bonusAtaque: 1,
  },
  {
    desafio: 6,
    nome: "Espada Draconiana",
    tipo: "arma",
    raridade: "lendario",
    descricao: "Lâmina de ametista forjada no fogo do Dragão do Código — a recompensa de quem o derrota.",
    icone: "⚔️",
    imagemUrl: "arma/espada-draconiana",
    bonusDefesa: 0,
    bonusAtaque: 10,
  },
];
