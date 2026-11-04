// Desenho de cada quadro da cutscene final: desenharQuadro(ctx, t, recursos)
// pinta o instante t (0 <= t < 10000ms) e depende SÓ de t — quem controla o
// tempo (motor.js com requestAnimationFrame + delta time, ou o exportador de
// vídeo quadro a quadro) decide qual instante mostrar. As marcações de tempo
// estão em marcos.js.
import { elipsePx, padrao, retPx } from "../../pages/BatalhaDragao/cenaDragao";
import { degraus, ruido } from "../IntroCutscene/pixel";
import { ALTURA, LARGURA, POS, brasas, chamas, desenharHud, runas } from "./cenario";
import { caixaDialogo, tituloVitoria } from "./dialogo";
import {
  apagarSoltos,
  brilhosDourados,
  comPontilhado,
  explosoes,
  fadeFinal,
  glitchFatias,
  golpe,
  particulasDissolucao,
  rachaduras,
  raiosDeLuz,
  tremor,
} from "./efeitos";
import {
  DISSOLVER_FIM,
  DISSOLVER_INICIO,
  DURACAO_MS,
  EXPLOSOES,
  FASES,
  FLASH_FIM,
  HUD_SOME,
  PULO,
  PURIFICAR,
  RUGIDO,
  TEXTO_VITORIA,
  VIDA_PARTICULA,
  glitchEm,
} from "./marcos";

export { DURACAO_MS } from "./marcos";

// Quanto o reino já foi purificado (0 = roxo corrompido, 1 = dourado).
function purezaEm(t) {
  return t < PURIFICAR[0] ? 0 : degraus((t - PURIFICAR[0]) / (PURIFICAR[1] - PURIFICAR[0]), 8);
}

// Posição do dragão (canto do sprite) no instante t.
function poseDragao(t) {
  let dx = 0, dy = 0;
  if (t < FASES.golpe[1]) {
    // recua com o golpe e se firma de novo
    dx = t < 90 ? 0 : t < 330 ? Math.round(degraus((t - 90) / 240, 5) * 10) : 10 - Math.round(degraus((t - 330) / 670, 4) * 4);
  } else if (t < FASES.morte[0]) {
    // ferido e ofegante: balança 1px pros lados e "afunda" de leve
    dx = 6 + (Math.floor(t / 450) % 2);
    dy = 1;
  } else {
    dx = 6 + Math.round((ruido(Math.floor(t / 40)) - 0.5) * 4);
    if (t >= RUGIDO && t < RUGIDO + 650) dy = -3; // ergue a cabeça no rugido
  }
  return { x: POS.dragao.x + dx, y: POS.dragao.y + dy };
}

// Dragão montado na camada própria (pra flash, rachaduras e dissolução
// afetarem só ele).
function desenharDragao(ctx, t, rec) {
  const dragao = rec.dragao;
  if (!dragao || t >= DISSOLVER_FIM + 40) return null;
  const [camada, g] = rec.camadaDragao;
  g.clearRect(0, 0, LARGURA, ALTURA);
  const { x, y } = poseDragao(t);

  const glitch = glitchEm(t);
  if (glitch) {
    glitchFatias(g, dragao, x, y, glitch);
  } else if (t >= FASES.falas[0] && t < FASES.morte[0]) {
    // ofegante: a metade de cima sobe/desce 1px (respiração pesada)
    const resp = Math.floor(t / 280) % 2;
    g.drawImage(dragao.normal, 0, 60, dragao.w, dragao.h - 60, x, y + 60, dragao.w, dragao.h - 60);
    g.drawImage(dragao.normal, 0, 0, dragao.w, 60, x, y + resp, dragao.w, 60);
  } else {
    g.drawImage(dragao.normal, x, y);
  }

  // efeitos por cima do corpo (source-atop: só onde há dragão)
  g.globalCompositeOperation = "source-atop";
  const piscaFlash = t >= FLASH_FIM && t < 340 && Math.floor(t / 60) % 2 === 0;
  const piscaDano = t >= FASES.falas[0] && t < FASES.morte[0] && t % 700 < 140 && Math.floor(t / 70) % 2 === 0;
  const piscaExplosao = EXPLOSOES.some((ex) => t >= ex.inicio && t < ex.inicio + 45);
  if (piscaFlash || piscaExplosao) retPx(g, 0, 0, LARGURA, ALTURA, "#ffffff");
  else if (piscaDano) retPx(g, 0, 0, LARGURA, ALTURA, "#ff2a5a");
  rachaduras(g, t, dragao, x, y);
  g.globalCompositeOperation = "source-over";

  if (t >= DISSOLVER_INICIO) apagarSoltos(g, t, dragao, x, y);
  ctx.drawImage(camada, 0, 0);
  return { x, y };
}

function desenharHeroi(ctx, t, rec) {
  const { x: pesX, y: pesY } = POS.heroi;
  let dy = 0;
  let dx = t < 200 ? 3 : 0; // ainda no embalo do golpe
  if (t >= PULO[0] && t < PULO[1]) {
    dy = -Math.round(Math.sin(degraus((t - PULO[0]) / (PULO[1] - PULO[0]), 10) * Math.PI) * 18);
  } else if (t >= FASES.falas[0]) {
    dy = Math.floor(t / 520) % 2; // respirando, igual à batalha
  }
  elipsePx(ctx, pesX + dx, pesY + 1, Math.max(6, 13 + Math.round(dy / 3)), 3, padrao(ctx, "#07030f", 10));

  // aura de vitória: raios dourados girando atrás do herói, depois do pulo
  if (t >= PULO[1] - 200) {
    const cx = pesX, cy = pesY - 30;
    for (let i = 0; i < 12; i++) {
      const ang = (i / 12) * Math.PI * 2 + t / 900;
      for (let r = 26; r < 40; r += 2) {
        if ((r + i) % 4 === 0) continue;
        retPx(ctx, cx + Math.cos(ang) * r, cy + Math.sin(ang) * r * 0.9, 1, 1, i % 2 ? "#ffd23c" : "#fff3c4");
      }
    }
  }
  ctx.drawImage(rec.heroi, Math.round(pesX - 32 + dx), Math.round(pesY - 60 + dy));

  // espada erguida: brilho na lâmina (mão direita do sprite) piscando
  if (t >= PULO[0] + 250) {
    const bx = pesX + 11, by = pesY - 52 + dy;
    const tam = Math.floor(t / 120) % 2 ? 6 : 4;
    retPx(ctx, bx - tam, by, tam * 2 + 1, 1, "#fff3c4");
    retPx(ctx, bx, by - tam, 1, tam * 2 + 1, "#fff3c4");
    retPx(ctx, bx - 1, by - 1, 3, 3, "#ffffff");
  }
}

// ---------------------------------------------------------------------------
export function desenharQuadro(ctx, t, rec, { reduzirMovimento = false } = {}) {
  t = Math.max(0, Math.min(DURACAO_MS - 1, t));
  ctx.imageSmoothingEnabled = false;
  const pureza = purezaEm(t);
  const [tx, ty] = tremor(t, reduzirMovimento);

  ctx.save();
  ctx.translate(tx, ty);
  // fundo um pouco maior que a tela, pra o tremor não mostrar "buraco"
  retPx(ctx, -6, -6, LARGURA + 12, ALTURA + 12, "#07030f");

  // 1. cenário: arena corrompida, virando dourada em pontilhado na purificação
  ctx.drawImage(rec.arenas.corrompida, 0, 0);
  if (pureza > 0) comPontilhado(ctx, rec.arenas.purificada, Math.round(pureza * 16), rec.rascunho);
  raiosDeLuz(ctx, t, pureza);
  runas(ctx, t, pureza);
  chamas(ctx, t, pureza);
  brasas(ctx, t, pureza);

  // 2. dragão + efeitos da morte
  const sombraDragao = t < FASES.morte[0] + 1800;
  if (sombraDragao) elipsePx(ctx, POS.dragao.x + 92, POS.heroi.y + 1, 70, 5, padrao(ctx, "#07030f", 10));
  const posDragao = desenharDragao(ctx, t, rec);
  if (rec.dragao) {
    const base = posDragao ?? poseDragao(Math.min(t, DISSOLVER_FIM));
    explosoes(ctx, t, rec.dragao, base.x, base.y);
    if (t < DISSOLVER_FIM + VIDA_PARTICULA + 200) particulasDissolucao(ctx, t, rec.dragao, base.x, base.y);
  }
  if (t < 900) golpe(ctx, t, POS.peito.x + 4, POS.peito.y);

  // 3. herói e brilhos da vitória
  desenharHeroi(ctx, t, rec);
  brilhosDourados(ctx, t, pureza);
  ctx.restore();

  // 4. camada fixa (fora do tremor): HUD, diálogo, título e transições
  if (t < HUD_SOME[1]) {
    const [hud, gh] = rec.camadaHud;
    desenharHud(gh, t);
    const nivel = t < HUD_SOME[0] ? 16 : Math.round((1 - degraus((t - HUD_SOME[0]) / (HUD_SOME[1] - HUD_SOME[0]), 6)) * 16);
    comPontilhado(ctx, hud, nivel, rec.rascunho);
  }
  caixaDialogo(ctx, t);
  if (t >= TEXTO_VITORIA[0]) tituloVitoria(ctx, t, TEXTO_VITORIA);
  if (t < FLASH_FIM) retPx(ctx, 0, 0, LARGURA, ALTURA, "#ffffff");
  else if (t < FLASH_FIM + 120) retPx(ctx, 0, 0, LARGURA, ALTURA, padrao(ctx, "#ffffff", 8));
  fadeFinal(ctx, t, FASES.fade[0], FASES.fade[1]);
}
