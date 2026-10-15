import somAcerto from "../assets/sounds/som_acerto_codejourney.mp3";
import somErro from "../assets/sounds/som_erro_codejourney.mp3";
import somRecompensa from "../assets/sounds/som_recompensa_codejourney.mp3";
import somBoss from "../assets/sounds/som_Boss_codejourney.mp3";

// Efeitos sonoros do jogo — uma instância de Audio por som, criada sob
// demanda e reaproveitada (evita baixar/decodificar o arquivo de novo a
// cada acerto/erro).
const ARQUIVOS = {
  acerto: somAcerto,
  erro: somErro,
  recompensa: somRecompensa,
  boss: somBoss,
};

const cache = {};

function obterAudio(nome) {
  if (!cache[nome]) {
    cache[nome] = new Audio(ARQUIVOS[nome]);
    cache[nome].preload = "auto";
  }
  return cache[nome];
}

// Toca o som do começo (reinicia se ele já estiver tocando). Falhas de
// reprodução — ex: navegador bloqueando autoplay — são ignoradas: som é
// só enfeite, nunca deve travar o jogo.
export function tocarSom(nome) {
  try {
    const audio = obterAudio(nome);
    audio.currentTime = 0;
    const promessa = audio.play();
    if (promessa) promessa.catch(() => {});
  } catch {
    // ignora
  }
}

// Sons pequenos e frequentes, pré-carregados quando o navegador está ocioso.
// O "boss" (146 KB, mais que os outros três juntos) fica de fora: só toca
// nas lutas de chefe e no dragão, e baixa quando alguém chega lá — antes
// ele era baixado em toda sessão, mesmo de quem nunca enfrentou um chefe.
const SONS_PRECARREGADOS = ["acerto", "erro", "recompensa"];

// Cria (e começa a baixar) os sons frequentes de uma vez, quando o navegador
// está ocioso. Antes o arquivo só começava a baixar NA PRIMEIRA VEZ que o som
// tocava — em rede lenta, o primeiro acerto/erro ficava mudo ou atrasado.
let precarregado = false;
export function precarregarSons() {
  if (precarregado) return;
  precarregado = true;
  const rodar = () => SONS_PRECARREGADOS.forEach((nome) => obterAudio(nome).load());
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(rodar, { timeout: 5000 });
  } else {
    setTimeout(rodar, 2000);
  }
}

export function pararSom(nome) {
  const audio = cache[nome];
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
}
