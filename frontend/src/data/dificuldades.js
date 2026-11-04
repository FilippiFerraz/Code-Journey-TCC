// Regras de cada trilha de dificuldade no jogo. Os ids são os mesmos da URL
// (/desafios/:mundoId/:dificuldade) e do backend — os multiplicadores de XP
// e moedas valem de verdade lá (backend/src/config/dificuldades.js); aqui
// ficam só pra exibir na tela.
//
// Modo Guerreiro (difícil): os desafios são os mesmos da trilha iniciante,
// mas sem nenhuma dica e com menos corações. Em troca, a vitória vale o
// dobro de XP (pontos do ranking) e de moedas.
const REGRAS = {
  iniciante: { dicas: true, vidaMaxima: 3, multiplicadorXp: 1, multiplicadorMoedas: 1 },
  guerreiro: { dicas: false, vidaMaxima: 2, multiplicadorXp: 2, multiplicadorMoedas: 2 },
};

export function regrasDaDificuldade(dificuldade) {
  return REGRAS[dificuldade] ?? REGRAS.iniciante;
}

export const ehModoGuerreiro = (dificuldade) => dificuldade === "guerreiro";
