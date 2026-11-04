// Coleção "Guardião de Cristal": exclusivos do Baú de Cristal (só saem no
// baú ganho ao vencer o Desafio da Cachoeira de Cristais — ver
// abrirBauEspecial em src/services/bau.service.js). Entram no seed.js junto
// dos outros itens; ficam num arquivo próprio pra poderem ser cadastrados
// sozinhos num banco que já tem os outros dados.
// Camadas geradas por `npm run itens:cristal` no frontend, a partir das
// artes em frontend/arte-original/itens-cristal.
module.exports = [
  {
    nome: "Elmo do Guardião",
    tipo: "capacete",
    raridade: "lendario",
    descricao: "Elmo fechado do Guardião de Cristal — a pluma azul brilha quando um bug está por perto.",
    icone: "🪖",
    imagemUrl: "capacete/elmo-do-guardiao",
    bonusDefesa: 8,
    bonusAtaque: 2,
    exclusivoCristal: true,
  },
  {
    nome: "Capuz do Crepúsculo",
    tipo: "capacete",
    raridade: "epico",
    descricao: "Capuz de veludo com gola de pele: some nas sombras entre uma linha de código e outra.",
    icone: "🧥",
    imagemUrl: "capacete/capuz-do-crepusculo",
    bonusDefesa: 4,
    bonusAtaque: 3,
    exclusivoCristal: true,
  },
  {
    nome: "Machado Glacial",
    tipo: "arma",
    raridade: "lendario",
    descricao: "Lâmina de gelo eterno que parte qualquer laço infinito em um golpe só.",
    icone: "🪓",
    imagemUrl: "arma/machado-glacial",
    bonusAtaque: 10,
    exclusivoCristal: true,
  },
  {
    nome: "Escudo Estelar",
    tipo: "escudo",
    raridade: "epico",
    descricao: "A estrela no centro guarda a luz do Cristal Gigante e desvia qualquer exceção não tratada.",
    icone: "🛡️",
    imagemUrl: "escudo/escudo-estelar",
    bonusDefesa: 9,
    exclusivoCristal: true,
  },
  {
    nome: "Botas do Crepúsculo",
    tipo: "botas",
    raridade: "raro",
    descricao: "Passos silenciosos de couro escuro, com esporas de prata para não escorregar nas pontes.",
    icone: "🥾",
    imagemUrl: "botas/botas-do-crepusculo",
    bonusDefesa: 4,
    bonusAtaque: 1,
    exclusivoCristal: true,
  },
  {
    nome: "Armadura do Guardião",
    tipo: "peitoral",
    raridade: "lendario",
    descricao: "Placas de aço azulado com gemas de cristal que acendem a cada desafio vencido.",
    icone: "🛡️",
    imagemUrl: "peitoral/armadura-do-guardiao",
    bonusDefesa: 14,
    exclusivoCristal: true,
  },
];
