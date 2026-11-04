// Fases do Desafio da Cachoeira de Cristais (DesafioCristais.jsx). Cada fase
// ensina um conceito novo de programação e libera os blocos dele.
//
// Mapa: uma string por linha, de cima (fundo da cena, onde fica o Cristal)
// pra baixo (frente, onde o personagem começa). x = coluna, y = linha.
//   ~  água (cair nela é bug)
//   #  ponte de pedra
//   P  ponte onde o personagem começa
//   C  Cristal Gigante (chegar nele vence a fase)
//   B  besouro (sobre a ponte) — parado, ou patrulhando se estiver em `patrulhas`
//   A  aranha de código (sobre a ponte) — bloqueia a passagem e morde quem
//      fica ao lado dela sem estar de frente (ver interpretador.js)
//
// Direções: "norte" (linha de cima), "leste" (coluna da direita), "sul", "oeste".

export const BLOCOS = {
  mover: { rotulo: "Mover para frente", categoria: "movimento" },
  esquerda: { rotulo: "Girar à esquerda", categoria: "movimento" },
  direita: { rotulo: "Girar à direita", categoria: "movimento" },
  atacar: { rotulo: "Atacar", categoria: "acao" },
  repetir: { rotulo: "Repetir", categoria: "controle" },
  se: { rotulo: "Se", categoria: "controle" },
};

export const NIVEIS = [
  {
    titulo: "A Ponte de Pedra",
    conceito: "Sequência",
    objetivo: "Leve o herói até o Cristal. As pontes fazem curvas: use os blocos de girar para mudar de direção.",
    mapa: [
      "~~~C~",
      "~~~#~",
      "~###~",
      "~#~~~",
      "~P~~~",
    ],
    direcaoInicial: "norte",
    limiteBlocos: 10,
    blocos: ["mover", "esquerda", "direita"],
  },
  {
    titulo: "Besouros na Ponte",
    conceito: "Repetição",
    objetivo: "Dois besouros-bug bloqueiam a ponte. Ataque quando um estiver na sua frente. Dica: o caminho se repete — use o bloco Repetir pra caber em 5 blocos!",
    mapa: [
      "~~C~~",
      "~~#~~",
      "~~B~~",
      "~~#~~",
      "~~B~~",
      "~~#~~",
      "~~P~~",
    ],
    direcaoInicial: "norte",
    limiteBlocos: 5,
    blocos: ["mover", "esquerda", "direita", "atacar", "repetir"],
  },
  {
    titulo: "O Covil das Aranhas",
    conceito: "Condição",
    objetivo: "Um besouro patrulha a ponte do meio e uma Aranha de Código guarda o caminho. Use Se [inimigo à frente] para atacar só quando precisar.",
    mapa: [
      "~~~C~~",
      "~~~#~~",
      "~~~A~~",
      "~~~#~~",
      "B#####",
      "~~~#~~",
      "~~~P~~",
    ],
    direcaoInicial: "norte",
    limiteBlocos: 6,
    blocos: ["mover", "esquerda", "direita", "atacar", "repetir", "se"],
    // o besouro da posição (0, 4) anda pela linha 4, da coluna 0 até a 5, e volta
    patrulhas: [{ x: 0, y: 4, eixo: "x", de: 0, ate: 5 }],
  },
];
