// Estado da Batalha do Dragão (BatalhaDragao.jsx), como um reducer puro:
// vida do dragão e do jogador, fase da luta, desafio da rodada e o estado
// atual da animação. A tela só despacha as ações e desenha o estado — os
// tempos (quando a animação termina, quando o prazo acaba) ficam nela.
//
// Estados:
//   intro     — falas antes da luta
//   idle      — entre rodadas (o dragão respira, parado)
//   charging  — o dragão carrega o sopro; o jogador responde o desafio
//   hit       — o jogador acertou: escudo + contra-ataque, o dragão sofre dano
//   attacking — o jogador errou ou o tempo acabou: Sopro de Loop Infinito
//   furia     — o dragão caiu pra 50% e entra no Modo Fúria (fase 2)
//   victory   — dragão derrotado (a última resposta certa vem direto pra cá
//               e a tela toca a cutscene final de vitória)
//   defeat    — o jogador ficou sem vidas

import { sortearDesafio } from "./desafiosDragao.js";

export const HP_DRAGAO = 100;
export const DANO_POR_ACERTO = 17; // 6 acertos derrotam o dragão
export const VIDAS = 3;
export const LIMIAR_FURIA = 50; // % de vida em que começa a fase 2
// Prazo pra responder antes do sopro, por fase (a fase 2 é mais rápida).
export const PRAZO_MS = { 1: 22000, 2: 14000 };

export function estadoInicial() {
  return {
    estado: "intro",
    hpDragao: HP_DRAGAO,
    vidas: VIDAS,
    fase: 1,
    desafio: null,
    usados: [],
    inicioCarga: null,
    prazoMs: PRAZO_MS[1],
    escudo: false,
    ultima: null, // { acertou, motivo: "acerto" | "errou" | "tempo", correta, explicacao }
    rodada: 0,
  };
}

function falhar(s, motivo) {
  return {
    ...s,
    estado: "attacking",
    vidas: s.vidas - 1,
    escudo: false,
    ultima: { acertou: false, motivo, correta: s.desafio.correta, explicacao: s.desafio.explicacao },
  };
}

export function reducerBatalha(s, acao) {
  switch (acao.tipo) {
    case "COMECAR":
      return s.estado === "intro" ? { ...s, estado: "idle" } : s;

    case "NOVA_RODADA": {
      if (s.estado !== "idle") return s;
      const desafio = sortearDesafio(s.fase, s.usados);
      return {
        ...s,
        estado: "charging",
        desafio,
        usados: [...s.usados, desafio.id],
        inicioCarga: acao.agora,
        prazoMs: PRAZO_MS[s.fase],
        escudo: false,
        ultima: null,
        rodada: s.rodada + 1,
      };
    }

    case "RESPONDER": {
      if (s.estado !== "charging") return s;
      if (acao.opcao !== s.desafio.correta) return falhar(s, "errou");
      const hpDragao = Math.max(0, s.hpDragao - DANO_POR_ACERTO);
      return {
        ...s,
        // a última pergunta certa vai direto pra vitória: o golpe final é a
        // própria cutscene (components/BossDefeatCutscene)
        estado: hpDragao <= 0 ? "victory" : "hit",
        hpDragao,
        escudo: true,
        ultima: { acertou: true, motivo: "acerto", correta: s.desafio.correta, explicacao: s.desafio.explicacao },
      };
    }

    case "TEMPO_ESGOTADO":
      return s.estado === "charging" ? falhar(s, "tempo") : s;

    // Fim da animação do estado atual: decide o próximo.
    case "FIM_ANIMACAO": {
      if (s.estado === "hit") {
        if (s.hpDragao <= 0) return { ...s, estado: "victory" };
        if (s.fase === 1 && s.hpDragao <= LIMIAR_FURIA) return { ...s, estado: "furia", fase: 2, usados: [] };
        return { ...s, estado: "idle" };
      }
      if (s.estado === "attacking") return { ...s, estado: s.vidas <= 0 ? "defeat" : "idle" };
      if (s.estado === "furia") return { ...s, estado: "idle" };
      return s;
    }

    // ?debug=bossDefeat: pula a luta e dispara a cutscene final (ver BatalhaDragao.jsx)
    case "DEBUG_VITORIA":
      return { ...s, estado: "victory", hpDragao: 0, fase: 2 };

    case "REINICIAR":
      return { ...estadoInicial(), estado: "idle" };

    default:
      return s;
  }
}
