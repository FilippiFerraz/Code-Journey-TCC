// Gera a música de fundo do jogo (trilha medieval original, em loop).
// Uso (dentro de frontend/): npm run musica:gerar
//
// Nada de sample ou música de terceiros: tudo é sintetizado aqui, nota a
// nota, e salvo em src/assets/sounds/musica_medieval.mp3 (o site toca em
// loop sem emenda — ver src/utils/musica.js).
//
// Composição: ré dórico, compasso 3/4 a 100 bpm (dança medieval), 32
// compassos (57,6 s):
//   intro (4)  — bordão + alaúde
//   A (8)      — flauta doce com a melodia principal
//   A' (8)     — a melodia de novo, dobrada pela viela uma oitava abaixo
//   B (8)      — melodia mais aguda, pandeiro entrando
//   final (4)  — volta ao clima da intro, emendando no começo do loop
// Mudou o andamento ou o número de compassos? Atualize DURACAO_LOOP_S em
// src/utils/musica.js.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import ffmpeg from "ffmpeg-static";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SAIDA = path.join(RAIZ, "src/assets/sounds/musica_medieval.mp3");

const TAXA = 44100;
const BPM = 100;
const COLCHEIA = 60 / BPM / 2; // 0,3 s
const COMPASSO = COLCHEIA * 6; // 3/4 = 6 colcheias
const COMPASSOS = 32;
const DURACAO = COMPASSOS * COMPASSO; // 57,6 s
const N = Math.round(DURACAO * TAXA);

const esq = new Float32Array(N);
const dir = new Float32Array(N);
const freq = (midi) => 440 * 2 ** ((midi - 69) / 12);

// Soma um sinal mono no mix estéreo, com pan (-1 esquerda .. 1 direita).
// Passa do fim? Dá a volta pro começo — o loop fica sem emenda.
function somar(inicioS, amostras, pan = 0, ganho = 1) {
  const i0 = Math.round(inicioS * TAXA);
  const ge = Math.cos(((pan + 1) * Math.PI) / 4) * ganho;
  const gd = Math.sin(((pan + 1) * Math.PI) / 4) * ganho;
  for (let k = 0; k < amostras.length; k++) {
    const i = (i0 + k) % N;
    esq[i] += amostras[k] * ge;
    dir[i] += amostras[k] * gd;
  }
}

// Envelope simples: ataque, sustentação e soltura lineares.
function envelope(t, dur, ataque, soltura) {
  if (t < ataque) return t / ataque;
  if (t > dur - soltura) return Math.max(0, (dur - t) / soltura);
  return 1;
}

// ---------- Instrumentos ----------

// Flauta doce: fundamental + poucos harmônicos, vibrato que entra devagar e
// um sopro (ruído) no ataque.
function flauta(midi, dur) {
  const f = freq(midi);
  const total = dur + 0.12;
  const out = new Float32Array(Math.round(total * TAXA));
  let fase = 0;
  for (let k = 0; k < out.length; k++) {
    const t = k / TAXA;
    const vib = 1 + 0.004 * Math.min(1, Math.max(0, (t - 0.18) / 0.3)) * Math.sin(2 * Math.PI * 5.2 * t);
    fase += (2 * Math.PI * f * vib) / TAXA;
    const tom = Math.sin(fase) + 0.28 * Math.sin(2 * fase) + 0.1 * Math.sin(3 * fase) + 0.04 * Math.sin(4 * fase);
    const sopro = (Math.random() * 2 - 1) * 0.12 * Math.exp(-t * 18);
    out[k] = (tom + sopro) * envelope(t, total, 0.045, 0.1);
  }
  return out;
}

// Viela (vielle de roda/rabeca): dente de serra suave (harmônicos com
// queda rápida), ataque de arco e vibrato.
function viela(midi, dur) {
  const f = freq(midi);
  const total = dur + 0.1;
  const out = new Float32Array(Math.round(total * TAXA));
  let fase = 0;
  for (let k = 0; k < out.length; k++) {
    const t = k / TAXA;
    fase += (2 * Math.PI * f * (1 + 0.005 * Math.sin(2 * Math.PI * 5.8 * t))) / TAXA;
    let s = 0;
    for (let h = 1; h <= 9; h++) s += Math.sin(h * fase) / (h * h * 0.6 + 0.4);
    out[k] = s * 0.55 * envelope(t, total, 0.09, 0.09);
  }
  return out;
}

// Alaúde: Karplus-Strong (corda dedilhada), com o ataque meio abafado.
function alaude(midi, dur = 1.4, brilho = 0.5) {
  const f = freq(midi);
  const periodo = Math.max(2, Math.round(TAXA / f));
  const linha = new Float32Array(periodo);
  for (let i = 0; i < periodo; i++) linha[i] = Math.random() * 2 - 1;
  // abafa o ruído inicial (som mais "madeira", menos metálico)
  for (let p = 0; p < 2; p++) for (let i = 1; i < periodo; i++) linha[i] = linha[i] * brilho + linha[i - 1] * (1 - brilho);
  const out = new Float32Array(Math.round(dur * TAXA));
  let idx = 0;
  for (let k = 0; k < out.length; k++) {
    const proximo = (idx + 1) % periodo;
    const v = linha[idx];
    linha[idx] = 0.4985 * (v + linha[proximo]);
    out[k] = v * Math.min(1, (out.length - k) / (0.08 * TAXA));
    idx = proximo;
  }
  return out;
}

// Bordão (gaita de fole ao longe): ré e lá graves contínuos, levemente
// desafinados entre si (chorus) e respirando devagar.
function bordao(duracaoS) {
  const out = new Float32Array(Math.round(duracaoS * TAXA));
  const notas = [freq(38), freq(45), freq(50)].flatMap((f) => [f, f * 1.003]);
  const fases = notas.map(() => Math.random() * Math.PI * 2);
  for (let k = 0; k < out.length; k++) {
    const t = k / TAXA;
    let s = 0;
    notas.forEach((f, j) => {
      const fase = fases[j] + 2 * Math.PI * f * t;
      for (let h = 1; h <= 5; h++) s += Math.sin(h * fase) / (h * 1.6);
    });
    // "respira" num período que cabe certinho no loop (sem salto na emenda)
    out[k] = s * (0.8 + 0.2 * Math.sin((2 * Math.PI * t * 8) / duracaoS));
  }
  return out;
}

// Tambor medieval (tabor): baque grave com queda de afinação + estalo.
function tambor(forte = 1) {
  const out = new Float32Array(Math.round(0.45 * TAXA));
  let fase = 0;
  for (let k = 0; k < out.length; k++) {
    const t = k / TAXA;
    fase += (2 * Math.PI * (55 + 70 * Math.exp(-t * 22))) / TAXA;
    const corpo = Math.sin(fase) * Math.exp(-t * 9);
    const estalo = (Math.random() * 2 - 1) * Math.exp(-t * 70) * 0.35;
    out[k] = (corpo + estalo) * forte;
  }
  return out;
}

// Pandeiro: chiado agudo curto com as platinelas ressoando.
function pandeiro(forte = 1) {
  const out = new Float32Array(Math.round(0.25 * TAXA));
  let anterior = 0;
  for (let k = 0; k < out.length; k++) {
    const t = k / TAXA;
    const ruido = Math.random() * 2 - 1;
    const agudo = ruido - anterior; // passa-altas simples
    anterior = ruido;
    const platinelas = Math.sin(2 * Math.PI * 6200 * t) * 0.3 + Math.sin(2 * Math.PI * 7900 * t) * 0.2;
    out[k] = (agudo * 0.6 + platinelas) * Math.exp(-t * 26) * forte;
  }
  return out;
}

// ---------- Partitura ----------
// [nota MIDI, duração em colcheias]; null = pausa. Cada compasso = 6.

const MELODIA_A = [
  [74, 2], [76, 1], [77, 1], [76, 1], [74, 1],
  [69, 3], [72, 1], [74, 2],
  [72, 2], [71, 1], [69, 1], [67, 2],
  [69, 4], [67, 2],
  [65, 2], [67, 1], [69, 1], [74, 2],
  [72, 1], [74, 1], [76, 2], [74, 2],
  [72, 2], [71, 1], [72, 1], [69, 2],
  [74, 4], [null, 2],
];
const MELODIA_B = [
  [81, 2], [79, 1], [77, 1], [79, 2],
  [76, 2], [79, 2], [76, 1], [72, 1],
  [74, 2], [71, 1], [74, 1], [79, 2],
  [77, 3], [76, 1], [74, 2],
  [72, 2], [77, 2], [81, 2],
  [79, 1], [77, 1], [76, 2], [72, 2],
  [76, 2], [74, 1], [72, 1], [71, 1], [72, 1],
  [74, 4], [69, 2],
];
const FINAL = [[74, 6], [69, 3], [72, 3], [74, 6], [null, 6]];

// Acorde de cada compasso (fundamental, terça, quinta em MIDI, região do alaúde)
const ACORDES = {
  Dm: [50, 53, 57], C: [48, 52, 55], Am: [45, 48, 52], F: [41, 45, 48], G: [43, 47, 50],
};
const INTRO = ["Dm", "Dm", "C", "Dm"];
const HARM_A = ["Dm", "Dm", "C", "C", "Dm", "Dm", "Am", "Dm"];
const HARM_B = ["F", "C", "G", "Dm", "F", "C", "Am", "Dm"];
const HARMONIA = [...INTRO, ...HARM_A, ...HARM_A, ...HARM_B, "Dm", "Dm", "C", "Dm"];

function tocarMelodia(notas, compassoInicial, instrumento, { pan = 0, ganho = 1, transpor = 0 } = {}) {
  let t = compassoInicial * COMPASSO;
  for (const [midi, colcheias] of notas) {
    const dur = colcheias * COLCHEIA;
    if (midi !== null) somar(t, instrumento(midi + transpor, dur * 0.94), pan, ganho);
    t += dur;
  }
}

// Alaúde: arpejo de colcheias em cada compasso (fundamental, quinta,
// oitava, quinta, décima, quinta), mais forte no tempo 1.
const PADRAO_ARPEJO = [0, 2, 3, 2, 4, 2];
HARMONIA.forEach((nome, c) => {
  const [r, t3, q] = ACORDES[nome];
  const notas = [r, t3, q, r + 12, t3 + 12];
  PADRAO_ARPEJO.forEach((grau, i) => {
    const inicio = c * COMPASSO + i * COLCHEIA;
    somar(inicio, alaude(notas[grau], 1.3, i === 0 ? 0.6 : 0.45), -0.35, i === 0 ? 0.42 : 0.3);
  });
  // baixo do alaúde no tempo 1
  somar(c * COMPASSO, alaude(r - 12, 1.8, 0.5), -0.1, 0.42);
});

// Bordão o loop inteiro
somar(0, bordao(DURACAO), 0, 0.022);

// Percussão: tambor no tempo 1 (forte) e no 3 (fraco); pandeiro na parte B.
for (let c = 0; c < COMPASSOS; c++) {
  const inicio = c * COMPASSO;
  const naIntroOuFinal = c < 4 || c >= 28;
  somar(inicio, tambor(1), 0.1, naIntroOuFinal ? 0.28 : 0.4);
  somar(inicio + 4 * COLCHEIA, tambor(0.6), 0.1, naIntroOuFinal ? 0.15 : 0.25);
  if (c >= 20 && c < 28) {
    [2, 3, 5].forEach((col) => somar(inicio + col * COLCHEIA, pandeiro(col === 2 ? 1 : 0.6), 0.45, 0.18));
  }
}

// Melodias
tocarMelodia(MELODIA_A, 4, flauta, { pan: 0.15, ganho: 0.3 });
tocarMelodia(MELODIA_A, 12, flauta, { pan: 0.15, ganho: 0.3 });
tocarMelodia(MELODIA_A, 12, viela, { pan: -0.25, ganho: 0.11, transpor: -12 });
tocarMelodia(MELODIA_B, 20, flauta, { pan: 0.15, ganho: 0.28 });
tocarMelodia(MELODIA_B, 20, viela, { pan: -0.25, ganho: 0.1, transpor: -12 });
tocarMelodia(FINAL, 28, viela, { pan: -0.1, ganho: 0.12, transpor: -12 });

// ---------- Reverb (salão de pedra) ----------
// Schroeder: 4 filtros pente em paralelo + 2 passa-tudo. Roda o loop duas
// vezes seguidas e fica com a segunda passada: a cauda do fim do loop cai
// no começo, como aconteceria tocando em loop de verdade.
function reverb(sinal, atrasosMs) {
  const entrada = new Float32Array(N * 2);
  entrada.set(sinal, 0);
  entrada.set(sinal, N);
  const soma = new Float32Array(N * 2);
  for (const ms of atrasosMs) {
    const d = Math.round((ms / 1000) * TAXA);
    const buf = new Float32Array(d);
    let filtro = 0;
    for (let i = 0; i < entrada.length; i++) {
      const atrasado = buf[i % d];
      filtro = atrasado * 0.7 + filtro * 0.3; // agudos somem antes (pedra)
      buf[i % d] = entrada[i] + filtro * 0.78;
      soma[i] += atrasado;
    }
  }
  for (const ms of [5, 1.7]) {
    const d = Math.round((ms / 1000) * TAXA);
    const buf = new Float32Array(d);
    for (let i = 0; i < soma.length; i++) {
      const atrasado = buf[i % d];
      const v = soma[i] + atrasado * -0.5;
      buf[i % d] = v;
      soma[i] = atrasado + v * 0.5;
    }
  }
  return soma.subarray(N);
}
const revE = reverb(esq, [29.7, 37.1, 41.1, 43.7]);
const revD = reverb(dir, [30.9, 35.3, 39.7, 45.1]);
for (let i = 0; i < N; i++) {
  esq[i] += revE[i] * 0.06;
  dir[i] += revD[i] * 0.06;
}

// ---------- Mixagem final e exportação ----------
let pico = 0;
for (let i = 0; i < N; i++) pico = Math.max(pico, Math.abs(esq[i]), Math.abs(dir[i]));
const ganhoFinal = 0.84 / pico;
const pcm = Buffer.alloc(N * 4);
for (let i = 0; i < N; i++) {
  // saturação suave pra segurar picos
  pcm.writeInt16LE(Math.round(Math.tanh(esq[i] * ganhoFinal) * 32767), i * 4);
  pcm.writeInt16LE(Math.round(Math.tanh(dir[i] * ganhoFinal) * 32767), i * 4 + 2);
}
const cabecalho = Buffer.alloc(44);
cabecalho.write("RIFF", 0);
cabecalho.writeUInt32LE(36 + pcm.length, 4);
cabecalho.write("WAVEfmt ", 8);
cabecalho.writeUInt32LE(16, 16);
cabecalho.writeUInt16LE(1, 20);
cabecalho.writeUInt16LE(2, 22);
cabecalho.writeUInt32LE(TAXA, 24);
cabecalho.writeUInt32LE(TAXA * 4, 28);
cabecalho.writeUInt16LE(4, 32);
cabecalho.writeUInt16LE(16, 34);
cabecalho.write("data", 36);
cabecalho.writeUInt32LE(pcm.length, 40);

const wav = path.join(RAIZ, "musica_medieval.tmp.wav");
fs.writeFileSync(wav, Buffer.concat([cabecalho, pcm]));
execFileSync(ffmpeg, ["-y", "-loglevel", "error", "-i", wav, "-codec:a", "libmp3lame", "-q:a", "6", SAIDA]);
fs.unlinkSync(wav);
console.log(`Música gerada: ${path.relative(RAIZ, SAIDA)} — ${DURACAO.toFixed(1)} s, ${Math.round(fs.statSync(SAIDA).size / 1024)} KB`);
