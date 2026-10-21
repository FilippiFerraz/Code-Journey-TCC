// Áudio da cutscene final, 100% gerado com Web Audio (chiptune, nenhum
// arquivo): impacto do golpe, blips do diálogo, gemido e rugido grave do
// dragão, zumbidos do glitch, explosões em ruído e uma fanfarra de vitória.
//
// Mesmo esquema da cutscene de introdução (e os mesmos geradores de nota e
// ruído, de IntroCutscene/audio.js): como a timeline é fixa, todos os sons
// são agendados de uma vez no relógio do AudioContext. agendarAudio() serve
// pro jogo (AudioContext) e pra exportação de vídeo (OfflineAudioContext).
import { obterAudioContexto } from "../../utils/audioContexto";
import {
  agendarEmJanelas, bufferParaWav, bufferRuido, freq, nota, ondaPulso, ruidoFiltrado,
} from "../IntroCutscene/audio";
import { ruido as sorteio } from "../IntroCutscene/pixel";
import { DURACAO_MS, eventosDeAudio } from "./marcos";

// oscilador com a frequência "escorregando" (impacto, gemido, rugido)
function deslize(ac, destino, { tipo, f0, f1, inicio, duracao, volume, filtro = 0 }) {
  const osc = ac.createOscillator();
  osc.type = tipo;
  osc.frequency.setValueAtTime(f0, inicio);
  osc.frequency.exponentialRampToValueAtTime(f1, inicio + duracao);
  const ganho = ac.createGain();
  ganho.gain.setValueAtTime(0, inicio);
  ganho.gain.linearRampToValueAtTime(volume, inicio + 0.02);
  ganho.gain.exponentialRampToValueAtTime(0.001, inicio + duracao);
  let saida = osc;
  if (filtro) {
    const pb = ac.createBiquadFilter();
    pb.type = "lowpass";
    pb.frequency.value = filtro;
    saida = osc.connect(pb);
  }
  saida.connect(ganho).connect(destino);
  osc.start(inicio);
  osc.stop(inicio + duracao + 0.05);
}

// Fanfarra de vitória (8s–9,5s): sol-dó-mi-sol em tercinas, dó agudo longo
// e o acorde final, com baixo em onda triangular.
const FANFARRA = [
  [67, 0, 0.11], [72, 0.11, 0.11], [76, 0.22, 0.11], [79, 0.33, 0.3],
  [76, 0.66, 0.11], [79, 0.77, 0.11], [84, 0.88, 0.62],
];
const BAIXO_FANFARRA = [[48, 0, 0.33], [43, 0.33, 0.33], [48, 0.66, 0.84]];
const ACORDE = [72, 76, 79];

// `ateMs`: só agenda o que começa em [desde, ate) — usado no agendamento em
// janelas (ver criarAudioFinal e IntroCutscene/audio.js::agendarEmJanelas).
export function agendarAudio(ac, destino, desdeMs = 0, inicioRelogio = ac.currentTime + 0.03, ateMs = Infinity) {
  const t0 = inicioRelogio - desdeMs / 1000;
  const desde = desdeMs / 1000;
  const ate = ateMs / 1000;
  const pulso = ondaPulso(ac);
  const pulso50 = ondaPulso(ac, 0.5);
  const ruido = bufferRuido(ac);

  for (const ev of eventosDeAudio()) {
    const seg = ev.tempo / 1000;
    if (seg < desde || seg >= ate) continue;
    const inicio = t0 + seg;
    switch (ev.tipo) {
      case "impacto":
        // estalo metálico + estrondo grave caindo
        nota(ac, destino, { onda: pulso, frequencia: 1760, inicio, duracao: 0.06, volume: 0.12 });
        ruidoFiltrado(ac, destino, ruido, { inicio, duracao: 0.55, volume: 0.7, filtro: "lowpass", f0: 4000, f1: 150 });
        deslize(ac, destino, { tipo: "square", f0: 220, f1: 40, inicio, duracao: 0.45, volume: 0.25, filtro: 900 });
        break;
      case "vidaZera":
        // a barra de vida esvaziando: blips descendo
        [76, 72, 67, 60].forEach((m, i) => {
          nota(ac, destino, { onda: pulso, frequencia: freq(m), inicio: inicio + i * 0.06, duracao: 0.05, volume: 0.05 });
        });
        break;
      case "gemido":
        deslize(ac, destino, { tipo: "sawtooth", f0: 150, f1: 70, inicio, duracao: 0.9, volume: 0.14, filtro: 500 });
        break;
      case "blip":
        nota(ac, destino, { tipo: "square", frequencia: ev.agudo ? 880 : 660, inicio, duracao: 0.022, volume: 0.028 });
        break;
      case "rachadura":
        // brilho subindo enquanto as rachaduras de luz aparecem
        [84, 88, 91, 96, 100, 103].forEach((m, i) => {
          nota(ac, destino, { tipo: "triangle", frequencia: freq(m), inicio: inicio + i * 0.12, duracao: 0.2, volume: 0.05 });
        });
        break;
      case "rugido":
        // rugido final, mais longo e grave que o da introdução
        ruidoFiltrado(ac, destino, ruido, { inicio, duracao: 1.8, volume: 0.8, filtro: "lowpass", f0: 700, f1: 90, q: 4 });
        deslize(ac, destino, { tipo: "sawtooth", f0: 110, f1: 30, inicio, duracao: 1.7, volume: 0.35, filtro: 420 });
        break;
      case "glitch": {
        // zumbido digital: dois bipes em frequências sorteadas
        const f1 = 200 + sorteio(ev.semente) * 1800;
        const f2 = 200 + sorteio(ev.semente + 1) * 1800;
        nota(ac, destino, { onda: pulso50, frequencia: f1, inicio, duracao: 0.035, volume: 0.04 });
        nota(ac, destino, { onda: pulso50, frequencia: f2, inicio: inicio + 0.04, duracao: 0.03, volume: 0.035 });
        break;
      }
      case "explosao":
        ruidoFiltrado(ac, destino, ruido, { inicio, duracao: 0.5, volume: 0.55, filtro: "lowpass", f0: 2200, f1: 90 });
        deslize(ac, destino, { tipo: "triangle", f0: 120, f1: 35, inicio, duracao: 0.3, volume: 0.3 });
        break;
      case "dissolver":
        // "vuuush" subindo enquanto o dragão vira partículas
        ruidoFiltrado(ac, destino, ruido, { inicio, duracao: 1.5, volume: 0.25, filtro: "bandpass", f0: 300, f1: 5000, q: 1.2 });
        break;
      case "fanfarra":
        for (const [m, d, dur] of FANFARRA) {
          nota(ac, destino, { onda: pulso, frequencia: freq(m), inicio: inicio + d, duracao: dur * 0.95, volume: 0.08 });
        }
        for (const [m, d, dur] of BAIXO_FANFARRA) {
          nota(ac, destino, { tipo: "triangle", frequencia: freq(m), inicio: inicio + d, duracao: dur * 0.95, volume: 0.18 });
        }
        for (const m of ACORDE) {
          nota(ac, destino, { onda: pulso, frequencia: freq(m), inicio: inicio + 0.88, duracao: 0.6, volume: 0.035 });
        }
        break;
      case "brilhoFinal":
        [84, 88, 91, 96, 100].forEach((m, i) => {
          nota(ac, destino, { tipo: "triangle", frequencia: freq(m), inicio: inicio + i * 0.07, duracao: 0.22, volume: 0.06 });
        });
        break;
      default:
    }
  }
}

// ---------------------------------------------------------------------------
// Uso no jogo: liga/desliga mudo e para tudo ao pular.
export function criarAudioFinal({ mudo = false } = {}) {
  const ac = obterAudioContexto();
  let mestre = null;
  let parado = false;
  let agendado = false;
  let pararJanelas = () => {};

  function agendar(desdeMs) {
    if (agendado || parado || !ac) return;
    agendado = true;
    mestre = ac.createGain();
    mestre.gain.value = mudo ? 0 : 1;
    mestre.connect(ac.destination);
    const destino = mestre;
    // aos poucos, não tudo de uma vez: criar todos os nós de áudio no
    // começo da cutscene travava a página (ver agendarEmJanelas)
    pararJanelas = agendarEmJanelas(
      ac,
      (de, inicio, ate) => agendarAudio(ac, destino, de, inicio, ate),
      { desdeMs, duracaoMs: DURACAO_MS }
    );
  }

  return {
    // `tempoAtualMs` = função que devolve o tempo atual da cutscene
    iniciar(tempoAtualMs) {
      if (!ac) return;
      if (ac.state === "running") agendar(tempoAtualMs());
      else ac.resume().then(() => agendar(tempoAtualMs())).catch(() => {});
    },
    definirMudo(valor) {
      mudo = valor;
      if (mestre && ac) mestre.gain.setTargetAtTime(valor ? 0 : 1, ac.currentTime, 0.02);
    },
    parar() {
      parado = true;
      pararJanelas();
      if (!mestre || !ac) return;
      // desconectar o volume mestre silencia na hora o que já estava agendado
      const m = mestre;
      m.gain.setTargetAtTime(0, ac.currentTime, 0.015);
      setTimeout(() => m.disconnect(), 80);
    },
  };
}

// Exportação de vídeo: os 10s de áudio renderizados offline, como WAV.
export async function renderizarAudioWav(taxa = 44100) {
  const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const ac = new OAC(2, Math.ceil((taxa * DURACAO_MS) / 1000), taxa);
  agendarAudio(ac, ac.destination, 0, 0);
  return bufferParaWav(await ac.startRendering());
}
