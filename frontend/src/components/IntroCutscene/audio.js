// Áudio da cutscene, 100% gerado com Web Audio (nenhum arquivo):
// - trilha chiptune medieval: melodia em onda "pulso 25%" (o timbre do NES)
//   e baixo em onda triangular;
// - efeitos: livro abrindo, página virando, rugido do dragão (ruído grave),
//   "blip" das letras e o brilho final.
//
// Como a timeline é fixa, TODOS os sons são agendados de uma vez no relógio
// do AudioContext (sincronizado com o relógio da animação). A mesma função
// agendarAudio() serve pro jogo (AudioContext normal) e pra exportação de
// vídeo (OfflineAudioContext, ver renderizarAudio()).
import { obterAudioContexto } from "../../utils/audioContexto";
import { DURACAO_MS, eventosDeAudio } from "./timeline";

// Colcheia = 0,25s (120 bpm) -> 60 colcheias em 15s.
const COLCHEIA = 0.25;

// [nota MIDI, duração em colcheias]; null = pausa.
// Parte A (0–5s): reino em paz, ré maior/mixolídio.
// Parte B (5–11s): tensão em ré menor, descendo cromático com o dragão.
// Parte C (11–14s): esperança, subindo até o ré agudo.
// Parte D (14–15s): acorde final.
const MELODIA = [
  [74, 2], [78, 1], [81, 1], [79, 2], [78, 1], [76, 1], [74, 2], [76, 1], [78, 1], [76, 2], [69, 2], [71, 1], [73, 1], [74, 2],
  [69, 1], [70, 1], [69, 1], [68, 1], [69, 2], [74, 2], [72, 1], [70, 1], [69, 1], [67, 1], [65, 2], [64, 2],
  [62, 2], [63, 2], [62, 2], [61, 2],
  [74, 1], [78, 1], [81, 1], [86, 1], [83, 2], [81, 2], [79, 1], [81, 1], [83, 2],
  [86, 4],
];
const BAIXO = [
  [50, 4], [45, 4], [43, 4], [45, 4], [50, 4],
  ...Array.from({ length: 16 }, () => [38, 1]),
  [37, 2], [36, 2], [35, 2], [34, 2],
  [43, 4], [45, 4], [47, 2], [49, 2],
  [50, 4],
];
// acorde do final (junto com a última nota da melodia)
const ACORDE_FINAL = [62, 66, 69];

// Exportados também pra cutscene final (components/BossDefeatCutscene/audio.js).
export const freq = (midi) => 440 * 2 ** ((midi - 69) / 12);

// Onda de pulso 25% via série de Fourier (o OscillatorNode só tem 50%).
export function ondaPulso(ac, ciclo = 0.25) {
  const n = 32;
  const real = new Float32Array(n);
  const imag = new Float32Array(n);
  for (let k = 1; k < n; k++) imag[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * ciclo);
  return ac.createPeriodicWave(real, imag);
}

// Ruído branco determinístico (igual em toda execução — vídeo idêntico).
export function bufferRuido(ac) {
  const tamanho = ac.sampleRate;
  const buffer = ac.createBuffer(1, tamanho, ac.sampleRate);
  const dados = buffer.getChannelData(0);
  let semente = 12345;
  for (let i = 0; i < tamanho; i++) {
    semente = (semente * 1103515245 + 12345) & 0x7fffffff;
    dados[i] = (semente / 0x7fffffff) * 2 - 1;
  }
  return buffer;
}

export function nota(ac, destino, { tipo, onda, frequencia, inicio, duracao, volume }) {
  const osc = ac.createOscillator();
  if (onda) osc.setPeriodicWave(onda);
  else osc.type = tipo;
  osc.frequency.setValueAtTime(frequencia, inicio);
  const ganho = ac.createGain();
  ganho.gain.setValueAtTime(0, inicio);
  ganho.gain.linearRampToValueAtTime(volume, inicio + 0.008);
  ganho.gain.setValueAtTime(volume, inicio + duracao * 0.7);
  ganho.gain.linearRampToValueAtTime(0, inicio + duracao);
  osc.connect(ganho).connect(destino);
  osc.start(inicio);
  osc.stop(inicio + duracao + 0.02);
}

export function ruidoFiltrado(ac, destino, ruido, { inicio, duracao, volume, filtro, f0, f1, q = 1 }) {
  const fonte = ac.createBufferSource();
  fonte.buffer = ruido;
  fonte.loop = true;
  const bq = ac.createBiquadFilter();
  bq.type = filtro;
  bq.Q.value = q;
  bq.frequency.setValueAtTime(f0, inicio);
  bq.frequency.exponentialRampToValueAtTime(f1, inicio + duracao);
  const ganho = ac.createGain();
  ganho.gain.setValueAtTime(0, inicio);
  ganho.gain.linearRampToValueAtTime(volume, inicio + Math.min(0.03, duracao / 4));
  ganho.gain.exponentialRampToValueAtTime(0.001, inicio + duracao);
  fonte.connect(bq).connect(ganho).connect(destino);
  fonte.start(inicio, (inicio * 7.3) % 0.5);
  fonte.stop(inicio + duracao + 0.05);
}

// Agenda a trilha e os efeitos. `desdeMs` permite começar do meio (quando o
// navegador só liberou o som depois que a cutscene já tinha começado): tudo
// antes desse instante é pulado.
export function agendarAudio(ac, destino, desdeMs = 0, inicioRelogio = ac.currentTime + 0.03) {
  const t0 = inicioRelogio - desdeMs / 1000;
  const desde = desdeMs / 1000;
  const pulso = ondaPulso(ac);
  const ruido = bufferRuido(ac);

  // música
  const tocarSequencia = (seq, opcoes) => {
    let pos = 0;
    for (const [midi, colcheias] of seq) {
      const inicio = pos * COLCHEIA;
      const duracao = colcheias * COLCHEIA * 0.92;
      pos += colcheias;
      if (midi === null || inicio < desde) continue;
      nota(ac, destino, { ...opcoes, frequencia: freq(midi), inicio: t0 + inicio, duracao });
    }
  };
  tocarSequencia(MELODIA, { onda: pulso, volume: 0.07 });
  tocarSequencia(BAIXO, { tipo: "triangle", volume: 0.16 });
  const fimSeg = DURACAO_MS / 1000;
  if (fimSeg - 1 >= desde) {
    for (const m of ACORDE_FINAL) {
      nota(ac, destino, { onda: pulso, frequencia: freq(m), inicio: t0 + fimSeg - 1, duracao: 0.95, volume: 0.04 });
    }
  }

  // efeitos sonoros
  for (const ev of eventosDeAudio()) {
    const seg = ev.tempo / 1000;
    if (seg < desde) continue;
    const inicio = t0 + seg;
    switch (ev.tipo) {
      case "blip":
        nota(ac, destino, { tipo: "square", frequencia: ev.agudo ? 1320 : 990, inicio, duracao: 0.03, volume: 0.035 });
        break;
      case "pagina":
        // "fffp" de papel: ruído passando por um filtro que sobe
        ruidoFiltrado(ac, destino, ruido, { inicio, duracao: 0.28, volume: 0.35, filtro: "bandpass", f0: 700, f1: 3500, q: 0.9 });
        ruidoFiltrado(ac, destino, ruido, { inicio: inicio + 0.2, duracao: 0.12, volume: 0.2, filtro: "lowpass", f0: 900, f1: 300 });
        break;
      case "abrirLivro":
        ruidoFiltrado(ac, destino, ruido, { inicio, duracao: 0.6, volume: 0.3, filtro: "bandpass", f0: 400, f1: 2500, q: 0.7 });
        nota(ac, destino, { tipo: "triangle", frequencia: 80, inicio: inicio + 0.75, duracao: 0.18, volume: 0.3 });
        break;
      case "rugido": {
        // ruído grave + serrote caindo de 95Hz pra 38Hz
        ruidoFiltrado(ac, destino, ruido, { inicio, duracao: 1.3, volume: 0.7, filtro: "lowpass", f0: 600, f1: 120, q: 4 });
        const osc = ac.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(95, inicio);
        osc.frequency.exponentialRampToValueAtTime(38, inicio + 1.2);
        const passaBaixa = ac.createBiquadFilter();
        passaBaixa.type = "lowpass";
        passaBaixa.frequency.value = 400;
        const ganho = ac.createGain();
        ganho.gain.setValueAtTime(0, inicio);
        ganho.gain.linearRampToValueAtTime(0.3, inicio + 0.08);
        ganho.gain.exponentialRampToValueAtTime(0.001, inicio + 1.25);
        osc.connect(passaBaixa).connect(ganho).connect(destino);
        osc.start(inicio);
        osc.stop(inicio + 1.3);
        break;
      }
      case "brilhoFinal":
        // arpejo "mágico" subindo
        [86, 90, 93, 98, 102].forEach((m, i) => {
          nota(ac, destino, { tipo: "triangle", frequencia: freq(m), inicio: inicio + i * 0.07, duracao: 0.25, volume: 0.06 });
        });
        break;
      default:
    }
  }
}

// ---------------------------------------------------------------------------
// Uso no jogo: liga/desliga mudo e para tudo ao pular.
export function criarAudioIntro({ mudo = false } = {}) {
  const ac = obterAudioContexto();
  let mestre = null;
  let parado = false;
  let agendado = false;

  function agendar(desdeMs) {
    if (agendado || parado || !ac) return;
    agendado = true;
    mestre = ac.createGain();
    mestre.gain.value = mudo ? 0 : 1;
    mestre.connect(ac.destination);
    agendarAudio(ac, mestre, desdeMs);
  }

  return {
    // `tempoAtualMs` = função que devolve o tempo atual da cutscene.
    iniciar(tempoAtualMs) {
      if (!ac) return;
      if (ac.state === "running") {
        agendar(tempoAtualMs());
      } else {
        // contexto ainda bloqueado: tenta liberar e começa de onde a
        // animação estiver quando conseguir
        ac.resume().then(() => agendar(tempoAtualMs())).catch(() => {});
      }
    },
    definirMudo(valor) {
      mudo = valor;
      if (mestre && ac) mestre.gain.setTargetAtTime(valor ? 0 : 1, ac.currentTime, 0.02);
    },
    parar() {
      parado = true;
      if (!mestre || !ac) return;
      // desconectar o volume mestre silencia na hora tudo o que já estava
      // agendado (sem fechar o AudioContext, que é compartilhado)
      const m = mestre;
      m.gain.setTargetAtTime(0, ac.currentTime, 0.015);
      setTimeout(() => m.disconnect(), 80);
    },
  };
}

// ---------------------------------------------------------------------------
// Exportação de vídeo: renderiza os 15s de áudio "offline" (mais rápido que
// o tempo real) e devolve um WAV.
export async function renderizarAudioWav(taxa = 44100) {
  const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const ac = new OAC(2, Math.ceil((taxa * DURACAO_MS) / 1000), taxa);
  agendarAudio(ac, ac.destination, 0, 0);
  const buffer = await ac.startRendering();
  return bufferParaWav(buffer);
}

export function bufferParaWav(buffer) {
  const canais = buffer.numberOfChannels;
  const amostras = buffer.length;
  const bytes = new DataView(new ArrayBuffer(44 + amostras * canais * 2));
  const texto = (pos, s) => [...s].forEach((c, i) => bytes.setUint8(pos + i, c.charCodeAt(0)));
  texto(0, "RIFF");
  bytes.setUint32(4, 36 + amostras * canais * 2, true);
  texto(8, "WAVE");
  texto(12, "fmt ");
  bytes.setUint32(16, 16, true);
  bytes.setUint16(20, 1, true);
  bytes.setUint16(22, canais, true);
  bytes.setUint32(24, buffer.sampleRate, true);
  bytes.setUint32(28, buffer.sampleRate * canais * 2, true);
  bytes.setUint16(32, canais * 2, true);
  bytes.setUint16(34, 16, true);
  texto(36, "data");
  bytes.setUint32(40, amostras * canais * 2, true);
  const dados = Array.from({ length: canais }, (_, c) => buffer.getChannelData(c));
  let pos = 44;
  for (let i = 0; i < amostras; i++) {
    for (let c = 0; c < canais; c++) {
      const v = Math.max(-1, Math.min(1, dados[c][i]));
      bytes.setInt16(pos, v < 0 ? v * 0x8000 : v * 0x7fff, true);
      pos += 2;
    }
  }
  return bytes.buffer;
}
