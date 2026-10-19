// Cenário da cutscene final: o MESMO salão da Batalha do Dragão.
//
// A arena (tijolos, vitral, estandartes, pilares, braseiros, piso e anel da
// arena) vem da própria função da batalha, construirArena() em
// pages/BatalhaDragao/cenaDragao.js — por isso o fundo é idêntico. Aqui só
// entram as partes vivas (chamas, runas, brasas), o "tema" (corrompido roxo
// ou purificado dourado) e o HUD do topo.
//
// A cutscene é 384x216 (16:9): a cena da batalha (320x200) fica no meio,
// com a arena estendida 32px pra cada lado (ela já sabe crescer pros lados,
// igual em telas largas) e 16px a mais em cima. 384x216 x5 = 1920x1080 —
// escala inteira no vídeo.
import {
  DRAGAO,
  HEROI,
  P,
  SPRITE,
  TEMAS_ARENA,
  brilhoPx,
  construirArena,
  hash,
  novoCanvas,
  retPx,
} from "../../pages/BatalhaDragao/cenaDragao";
import { ruido } from "../IntroCutscene/pixel";
import { escreverTexto as escrever } from "./texto";

export const LARGURA = 384;
export const ALTURA = 216;
// deslocamento da cena da batalha (320x200) dentro da cutscene
export const OX = 32;
export const OY = 16;

// Posições já convertidas pra cutscene.
export const POS = {
  heroi: { x: OX + HEROI.x, y: OY + HEROI.y }, // pés
  dragao: { x: OX + DRAGAO.x, y: OY + DRAGAO.y }, // canto do sprite
  peito: { x: OX + DRAGAO.x + SPRITE.peito.x, y: OY + DRAGAO.y + SPRITE.peito.y },
  boca: { x: OX + DRAGAO.x + SPRITE.boca.x, y: OY + DRAGAO.y + SPRITE.boca.y },
  vitral: { x: OX + 160, y: OY + 32 },
  braseiros: [OX + 44, OX + 276],
  arena: { x: OX + 160, y: OY + 170 },
};

// Cores das partes vivas em cada tema.
export const CORES = {
  corrompida: { chama: P.chama, runa: P.runa, brasa: [P.chama[2], P.chama[3]] },
  purificada: {
    chama: ["#ffffff", "#fff3c4", "#ffd23c", "#f0a020", "#a85a10"],
    runa: ["#5a3a08", "#a8781e", "#ffd23c", "#fff3c4"],
    brasa: ["#ffd23c", "#fff3c4"],
  },
};

// Arena 384x216 num tema: a da batalha (384x200) embaixo, e a faixa de 16px
// de cima copiada das linhas 2-17 dela — os tijolos se repetem a cada 18
// linhas, então a emenda não aparece.
export function montarArena(nomeTema) {
  const base = construirArena(LARGURA, TEMAS_ARENA[nomeTema]);
  const [c, g] = novoCanvas(LARGURA, ALTURA);
  g.drawImage(base, 0, OY);
  g.drawImage(base, 0, 2, LARGURA, OY, 0, 0, LARGURA, OY);
  return c;
}

// Chamas dos braseiros (mesmo desenho da batalha, sem Math.random: só
// depende de t). `pureza` 0..1 troca as chamas pro dourado uma de cada vez.
export function chamas(ctx, t, pureza) {
  POS.braseiros.forEach((bx, n) => {
    const tema = pureza > (n === 0 ? 0.25 : 0.55) ? CORES.purificada : CORES.corrompida;
    const tremula = Math.floor(t / 90);
    const y0 = OY + 127;
    brilhoPx(ctx, bx, OY + 118, 26 + (tremula % 2) * 2, tema.chama[3], 0.35);
    for (let i = -7; i <= 7; i++) {
      const base = 10 * (1 - Math.abs(i) / 8);
      const altura = Math.max(1, Math.round(base + Math.sin(tremula * 0.9 + i * 1.7 + bx) * 2.5 + (hash(tremula, i + bx) % 3)));
      for (let k = 0; k < altura; k++) {
        const f = k / altura;
        const centro = Math.abs(i) <= 2;
        const cor = f < 0.25 && centro ? tema.chama[0] : f < 0.5 ? tema.chama[centro ? 1 : 2] : f < 0.8 ? tema.chama[3] : tema.chama[4];
        retPx(ctx, bx + i, y0 - k, 1, 1, cor);
      }
    }
  });
}

// Anel de runas do chão da arena girando. Na purificação cada runa vira
// dourada num instante diferente (sorteio fixo por runa).
export function runas(ctx, t, pureza) {
  const formas = ["010111010", "101010101", "111101111", "110011110"];
  const n = 22;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + t / 7000;
    const x = Math.round(POS.arena.x + Math.cos(a) * 144);
    const y = Math.round(POS.arena.y + Math.sin(a) * 23);
    const rampa = pureza > ruido(i * 3.7) ? CORES.purificada.runa : CORES.corrompida.runa;
    const nivel = Math.floor((Math.sin(t / 260 + i * 0.9) * 0.5 + 0.5) * 3.99 * (0.7 + pureza * 0.3));
    ctx.fillStyle = rampa[Math.min(3, nivel)];
    const f = formas[i % 4];
    for (let k = 0; k < 9; k++) if (f[k] === "1") ctx.fillRect(x - 1 + (k % 3), y - 1 + ((k / 3) | 0), 1, 1);
  }
}

// Brasas e partículas flutuando, calculadas a partir de t (cada uma tem um
// ciclo próprio: nasce, sobe e some piscando).
export function brasas(ctx, t, pureza) {
  for (let k = 0; k < 34; k++) {
    const ciclo = 2200 + ruido(k) * 1800;
    const fase = (t + ruido(k + 50) * ciclo) % ciclo;
    const p = fase / ciclo;
    const doBraseiro = k < 14;
    const x0 = doBraseiro ? POS.braseiros[k % 2] + (ruido(k + 9) - 0.5) * 10 : OX + 20 + ruido(k + 13) * 280;
    const y0 = doBraseiro ? OY + 116 : OY + 150 + ruido(k + 17) * 40;
    const x = Math.round(x0 + Math.sin(p * 6 + k) * 3);
    const y = Math.round(y0 - p * (doBraseiro ? 46 : 70));
    if (p > 0.7 && (Math.floor(t / 60) + k) % 2) continue;
    const tema = pureza > ruido(k + 31) ? CORES.purificada : CORES.corrompida;
    retPx(ctx, x, y, 1, 1, tema.brasa[k % 2]);
  }
}

// ---------------------------------------------------------------------------
// HUD do topo, igual ao da batalha: nome do dragão, fase, vida (zerando no
// golpe final) e a barra do Sopro de Loop Infinito. Desenhado num canvas à
// parte pra poder sumir com pontilhado (ver timeline.js).
export function desenharHud(g, t) {
  g.clearRect(0, 0, LARGURA, 32);
  retPx(g, 0, 0, LARGURA, 31, "#1e0d36");
  retPx(g, 0, 31, LARGURA, 1, "#5b2a86");
  escrever(g, "DRAGÃO DO CÓDIGO FONTE", 8, 3, "#f0d8ff", "#000000");
  retPx(g, LARGURA - 92, 2, 84, 11, "#e11d48");
  escrever(g, "MODO FÚRIA", LARGURA - 88, 4, "#ffffff", "#7a0b2a");

  // vida: o último golpe leva de 17 a 0; a barra "fantasma" vai atrás
  const vida = Math.max(0, 17 - Math.floor(Math.min(1, t / 380) * 6) * (17 / 6));
  const fantasma = Math.max(0, 17 - Math.max(0, Math.floor(Math.min(1, (t - 200) / 500) * 6)) * (17 / 6));
  const x = 8, y = 15, w = LARGURA - 16, h = 5;
  retPx(g, x - 1, y - 1, w + 2, h + 2, "#000000");
  retPx(g, x, y, w, h, "#2a1238");
  retPx(g, x, y, Math.round((w * fantasma) / 100), h, "#ffd1fb");
  retPx(g, x, y, Math.round((w * vida) / 100), h, "#e11d48");

  // barra do sopro (parada: o golpe interrompeu o ataque)
  escrever(g, "SOPRO DE LOOP INFINITO", 8, 22, "#ff7bf0", "#000000");
  retPx(g, 192, 24, 150, 4, "#2a1238");
  retPx(g, 192, 24, Math.floor(t / 80) % 2 ? 46 : 44, 4, "#ff5ef0");
  escrever(g, "--", LARGURA - 24, 22, "#ffffff", "#000000");
}
