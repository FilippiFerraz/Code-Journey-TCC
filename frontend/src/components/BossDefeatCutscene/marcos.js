// Timeline central da cutscene final de vitória (10s exatos). Tudo o que
// acontece — fases, falas, golpes, explosões e sons — está marcado aqui em
// milissegundos. O desenho (timeline.js) e o áudio (audio.js) leem SÓ estes
// números, e cada quadro depende só do instante t: a duração é a mesma em
// qualquer FPS, e o vídeo exportado sai idêntico.
import { ruido } from "../IntroCutscene/pixel";

export const DURACAO_MS = 10000;

// Fases do roteiro: [inicio, fim) em ms.
export const FASES = {
  golpe: [0, 1000], // golpe final: flash, tremor, recuo, vida zera, HUD some
  falas: [1000, 5000], // últimas palavras do dragão
  morte: [5000, 8000], // rachaduras, glitch, explosões, dissolução
  vitoria: [8000, 9500], // reino purificado, pose e "VITÓRIA!"
  fade: [9500, DURACAO_MS], // fade pra branco/dourado -> recompensa
};

// ---- 0s–1s: golpe final ----
export const FLASH_FIM = 90; // tela toda branca
export const HUD_SOME = [650, 1000]; // HUD do topo some em pontilhado

// ---- 1s–5s: falas (máquina de escrever) ----
export const MS_POR_LETRA = 20;
export const NOME_FALANTE = "DRAGÃO ROXO";
export const FALAS = [
  { inicio: 1080, fim: 2350, texto: "Impossível... meus bugs eram eternos..." },
  { inicio: 2350, fim: 3650, texto: "Você corrigiu cada erro do meu código..." },
  { inicio: 3650, fim: 5000, texto: "Mas lembre-se, herói... sempre surgirá um novo bug!" },
];

// ---- 5s–8s: morte ----
export const RACHADURAS = [5000, 7000];
export const RUGIDO = 5150; // rugido final
export const GLITCH = [5500, 7300];
// explosões em sequência sobre o corpo: [instante, sorteio do ponto]
export const EXPLOSAO_MS = 380;
export const EXPLOSOES = Array.from({ length: 10 }, (_, k) => ({ inicio: 5600 + k * 185, semente: k * 9.73 + 2 }));
export const DISSOLVER_INICIO = 6400; // de baixo pra cima
export const DISSOLVER_FIM = 7700; // último pixel se solta
export const VIDA_PARTICULA = 750;

// ---- 8s–9,5s: vitória ----
export const PURIFICAR = [8000, 8500]; // roxo -> dourado
export const PULO = [8050, 8650];
export const TEXTO_VITORIA = [8250, 8550]; // 1ª e 2ª linha entram

// Fala visível no instante t (ou null) e quantas letras já apareceram.
export function falaEm(t) {
  const indice = FALAS.findIndex((f) => t >= f.inicio && t < f.fim);
  if (indice < 0) return null;
  const fala = FALAS[indice];
  return { indice, texto: fala.texto, letras: Math.floor((t - fala.inicio) / MS_POR_LETRA) + 1 };
}

// Glitch ligado no instante t? (em blocos de 50ms, cada vez mais frequente)
export function glitchEm(t) {
  if (t < GLITCH[0] || t >= GLITCH[1]) return null;
  const bloco = Math.floor(t / 50);
  const intensidade = (t - GLITCH[0]) / (GLITCH[1] - GLITCH[0]);
  if (ruido(bloco * 3.1) > 0.35 + intensidade * 0.5) return null;
  return { bloco, intensidade };
}

// Eventos de som, derivados destes mesmos marcos (ver audio.js).
export function eventosDeAudio() {
  const eventos = [
    { tipo: "impacto", tempo: 0 },
    { tipo: "vidaZera", tempo: 300 },
    { tipo: "gemido", tempo: 1000 },
    { tipo: "rachadura", tempo: RACHADURAS[0] },
    { tipo: "rugido", tempo: RUGIDO },
    { tipo: "dissolver", tempo: DISSOLVER_INICIO },
    { tipo: "fanfarra", tempo: FASES.vitoria[0] },
    { tipo: "brilhoFinal", tempo: FASES.fade[0] },
  ];
  // um "blip" a cada letra (menos espaços)
  for (const fala of FALAS) {
    [...fala.texto].forEach((ch, i) => {
      if (ch !== " ") eventos.push({ tipo: "blip", tempo: fala.inicio + i * MS_POR_LETRA, agudo: i % 3 === 0 });
    });
  }
  for (const ex of EXPLOSOES) eventos.push({ tipo: "explosao", tempo: ex.inicio, semente: ex.semente });
  // zumbidos do glitch, só nos blocos em que ele aparece
  for (let t = GLITCH[0]; t < GLITCH[1]; t += 100) {
    const g = glitchEm(t);
    if (g) eventos.push({ tipo: "glitch", tempo: t, semente: g.bloco });
  }
  return eventos.sort((a, b) => a.tempo - b.tempo);
}
