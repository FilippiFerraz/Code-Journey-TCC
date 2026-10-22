import { useEffect, useSyncExternalStore } from "react";
import musicaUrl from "../assets/sounds/musica_medieval.mp3";
import { obterAudioContexto } from "./audioContexto";

// Música de fundo do jogo (trilha medieval gerada por
// scripts/gerarMusica.mjs), tocando em loop no app inteiro.
//
// - Toca pela Web Audio (AudioBufferSourceNode com loop), não por <audio
//   loop>: o <audio> deixa um silêncio na emenda a cada volta.
// - Só começa depois da primeira interação do jogador (clique/tecla — os
//   navegadores bloqueiam som antes disso; ver main.jsx).
// - Volume e mudo ficam salvos neste navegador. Mudo desde o início = o
//   arquivo (720 KB) nem é baixado.
// - Abafada enquanto uma cutscene com trilha própria está na tela
//   (usePausarMusica) e quando a aba fica em segundo plano.

// Mesmo valor de DURACAO em scripts/gerarMusica.mjs (32 compassos 3/4 a 100 bpm).
const DURACAO_LOOP_S = 57.6;
const VOLUME_PADRAO = 0.4;
// Volume 100% da música fica abaixo dos efeitos sonoros (acerto/erro).
const GANHO_MAXIMO = 0.55;
const CHAVE = "codejourney:musica";

function lerPreferencias() {
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE));
    if (salvo && typeof salvo.volume === "number") {
      return { volume: Math.min(1, Math.max(0, salvo.volume)), mudo: Boolean(salvo.mudo) };
    }
  } catch {
    // sem storage ou valor estragado — usa o padrão
  }
  return { volume: VOLUME_PADRAO, mudo: false };
}

let estado = lerPreferencias();
const ouvintes = new Set();
let ganho = null; // GainNode da música
let tocando = false;
let carregando = null;
let iniciada = false; // o jogador já interagiu (pode tocar)
let pausas = 0; // quantas cutscenes pediram silêncio agora

function salvar() {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(estado));
  } catch {
    // ignora (aba anônima etc.)
  }
}

// Volume efetivo: curva quadrática (o ouvido percebe volume em escala
// logarítmica — sem isso, metade do controle já soava quase no máximo).
function ganhoAlvo() {
  if (estado.mudo || pausas > 0 || document.hidden) return 0;
  return estado.volume * estado.volume * GANHO_MAXIMO;
}

function aplicarGanho() {
  if (!ganho) return;
  const ac = ganho.context;
  ganho.gain.cancelScheduledValues(ac.currentTime);
  ganho.gain.setTargetAtTime(ganhoAlvo(), ac.currentTime, 0.15);
}

async function tocar() {
  if (tocando || carregando || estado.mudo) return;
  const ac = obterAudioContexto();
  if (!ac) return;
  carregando = (async () => {
    try {
      if (ac.state === "suspended") await ac.resume().catch(() => {});
      const resposta = await fetch(musicaUrl);
      const buffer = await ac.decodeAudioData(await resposta.arrayBuffer());
      ganho = ac.createGain();
      ganho.gain.value = 0;
      ganho.connect(ac.destination);
      const fonte = ac.createBufferSource();
      fonte.buffer = buffer;
      fonte.loop = true;
      fonte.loopStart = 0;
      fonte.loopEnd = Math.min(buffer.duration, DURACAO_LOOP_S);
      fonte.connect(ganho);
      fonte.start();
      tocando = true;
      aplicarGanho(); // entra suave (fade-in)
    } catch {
      // sem música (rede, navegador sem Web Audio...) — o jogo segue normal
    } finally {
      carregando = null;
    }
  })();
}

function notificar() {
  ouvintes.forEach((ouvinte) => ouvinte());
}

// Chamado na primeira interação do jogador (ver main.jsx).
export function iniciarMusica() {
  iniciada = true;
  tocar();
}

export function definirVolume(volume) {
  estado = { ...estado, volume: Math.min(1, Math.max(0, volume)) };
  // mexer no volume tira do mudo (exceto zerando)
  if (estado.mudo && volume > 0) estado.mudo = false;
  salvar();
  aplicarGanho();
  if (iniciada) tocar();
  notificar();
}

export function alternarMudo() {
  estado = { ...estado, mudo: !estado.mudo };
  salvar();
  aplicarGanho();
  if (iniciada) tocar();
  notificar();
}

// Cutscenes com trilha própria (introdução, final do dragão) silenciam a
// música enquanto estão na tela. Devolve a função que devolve o som.
export function pausarMusica() {
  pausas += 1;
  aplicarGanho();
  let devolvido = false;
  return () => {
    if (devolvido) return;
    devolvido = true;
    pausas = Math.max(0, pausas - 1);
    aplicarGanho();
  };
}

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", aplicarGanho);
}

// Silencia a música enquanto o componente estiver na tela (cutscenes).
export function usePausarMusica(ativo = true) {
  useEffect(() => (ativo ? pausarMusica() : undefined), [ativo]);
}

function assinar(ouvinte) {
  ouvintes.add(ouvinte);
  return () => ouvintes.delete(ouvinte);
}

// { volume (0..1), mudo } — atualiza a tela quando o jogador mexe em
// qualquer um dos controles (cabeçalho, desafio, loja, configurações).
export function useMusica() {
  return useSyncExternalStore(assinar, () => estado);
}
