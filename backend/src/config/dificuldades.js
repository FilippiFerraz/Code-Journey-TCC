// Regras de cada trilha de dificuldade (ids iguais aos da URL — ver
// frontend/src/pages/SelecionarDificuldade e frontend/src/data/dificuldades.js).
//
// A trilha "guerreiro" tem OS MESMOS desafios da "iniciante": cada desafio
// iniciante ganha uma cópia (espelho) com dificuldade "guerreiro", mas sem
// dica — ver services/trilhaGuerreiro.service.js. Em troca da falta de dicas
// (e dos corações a menos, que ficam no frontend), vencer no modo Guerreiro
// rende mais XP (= pontos do ranking) e mais moedas.
const REGRAS_DIFICULDADE = {
  iniciante: {
    dicas: true,
    multiplicadorXp: 1,
    multiplicadorMoedas: 1,
  },
  guerreiro: {
    dicas: false,
    multiplicadorXp: 2,
    multiplicadorMoedas: 2,
    // trilha de onde os desafios são copiados
    espelhoDe: "iniciante",
  },
};

function regrasDaDificuldade(dificuldade) {
  return REGRAS_DIFICULDADE[dificuldade] ?? REGRAS_DIFICULDADE.iniciante;
}

module.exports = { REGRAS_DIFICULDADE, regrasDaDificuldade };
