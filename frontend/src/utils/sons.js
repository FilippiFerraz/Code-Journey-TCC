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

export function pararSom(nome) {
  const audio = cache[nome];
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
}
