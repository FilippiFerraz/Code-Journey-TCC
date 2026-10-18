// Timeline central da cutscene (15s). Tudo o que acontece — cenas, viradas
// de página, falas, tremor de tela e sons — está marcado aqui em
// milissegundos. desenharQuadro(ctx, t) desenha o quadro do instante `t`
// e depende SÓ de `t`: quem controla o tempo (requestAnimationFrame com
// delta time em motor.js, ou o exportador de vídeo quadro a quadro) decide
// qual instante mostrar — por isso a duração é a mesma em qualquer máquina.
import {
  ALTURA, LARGURA, LIVRO, RUGIDO_FIM, RUGIDO_INICIO, cenaAnciao, cenaDragao, cenaInvasao, cenaReino,
  cobrirComPergaminho, folhaVirando, livroAberto, livroAbrindo, livroFechado, mesa, poeira, tinteiro, vela,
} from "./cenas";
import { brilho, degraus, dither, linha, ruido } from "./pixel";
import { caixaDialogo, escrever, larguraTexto } from "./texto";

export const DURACAO_MS = 15000;

// Livro abrindo (dentro da cena de abertura).
const ABRIR_INICIO = 1100;
const ABRIR_FIM = 1900;
// Tinta da página 1 aparecendo.
const REVELAR_MS = 300;
// Duração de cada virada de página.
export const VIRADA_MS = 400;

// Cenas: [inicio, fim) em ms. `desenhar` = ilustração da página (as cenas
// sem ela são as de abertura e final, desenhadas à parte).
export const CENAS = [
  { id: "abertura", inicio: 0, fim: 2000 },
  { id: "reino", inicio: 2000, fim: 5000, desenhar: cenaReino },
  { id: "invasao", inicio: 5000, fim: 8000, desenhar: cenaInvasao },
  { id: "dragao", inicio: 8000, fim: 11000, desenhar: cenaDragao },
  { id: "anciao", inicio: 11000, fim: 14000, desenhar: cenaAnciao },
  { id: "final", inicio: 14000, fim: DURACAO_MS },
];

// Falas da caixa de diálogo. Cada uma fica na tela de `inicio` a `fim` e
// aparece letra por letra (MS_POR_LETRA). Curtas pra dar tempo de ler.
export const MS_POR_LETRA = 28;
export const FALAS = [
  { inicio: 200, fim: 2000, texto: "Há muito tempo..." },
  { inicio: 2300, fim: 5000, texto: "O Reino vivia em paz." },
  { inicio: 5400, fim: 8000, texto: "Goblins e criaturas de bug espalharam o caos." },
  { inicio: 8400, fim: 11000, texto: "Todos servem ao Dragão Roxo." },
  { inicio: 11400, fim: 14000, texto: "Aprenda JavaScript com o Ancião e derrote o dragão!" },
  { inicio: 14050, fim: DURACAO_MS, texto: "Sua jornada começa agora!" },
];

// Fala visível no instante t (ou null) e quantas letras já apareceram.
export function falaEm(t) {
  const indice = FALAS.findIndex((f) => t >= f.inicio && t < f.fim);
  if (indice < 0) return null;
  const fala = FALAS[indice];
  return { indice, texto: fala.texto, letras: Math.floor((t - fala.inicio) / MS_POR_LETRA) + 1 };
}

// Eventos de som, derivados da própria timeline (ver audio.js).
export function eventosDeAudio() {
  const eventos = [
    { tipo: "abrirLivro", tempo: ABRIR_INICIO },
    { tipo: "rugido", tempo: CENAS[3].inicio + RUGIDO_INICIO },
    { tipo: "brilhoFinal", tempo: CENAS[5].inicio },
  ];
  for (const cena of CENAS.slice(2, 5)) eventos.push({ tipo: "pagina", tempo: cena.inicio });
  // um "blip" a cada 2 letras (letra por letra fica ruidoso demais)
  for (const fala of FALAS) {
    [...fala.texto].forEach((ch, i) => {
      if (ch !== " " && i % 2 === 0) {
        eventos.push({ tipo: "blip", tempo: fala.inicio + i * MS_POR_LETRA, agudo: i % 4 === 0 });
      }
    });
  }
  return eventos.sort((a, b) => a.tempo - b.tempo);
}

function cenaEm(t) {
  return CENAS.find((c) => t >= c.inicio && t < c.fim) ?? CENAS[CENAS.length - 1];
}

// Tremor de tela: leve durante toda a página do dragão, forte no rugido.
function tremor(t, reduzirMovimento) {
  if (reduzirMovimento) return [0, 0];
  const cena = CENAS[3];
  if (t < cena.inicio + VIRADA_MS || t >= cena.fim) return [0, 0];
  const local = t - cena.inicio;
  const forte = local >= RUGIDO_INICIO && local <= RUGIDO_FIM;
  const k = Math.floor(t / 50);
  if (!forte && k % 3 !== 0) return [0, 0];
  const amplitude = forte ? 2 : 1;
  return [
    Math.round((ruido(k) * 2 - 1) * amplitude),
    Math.round((ruido(k + 77) * 2 - 1) * amplitude),
  ];
}

// ---------------------------------------------------------------------------
// Desenha o quadro do instante t (0 <= t < DURACAO_MS).
export function desenharQuadro(ctx, t, { reduzirMovimento = false } = {}) {
  t = Math.max(0, Math.min(DURACAO_MS - 1, t));
  ctx.imageSmoothingEnabled = false;
  const cena = cenaEm(t);
  const [tx, ty] = tremor(t, reduzirMovimento);

  ctx.save();
  ctx.translate(tx, ty);
  // a mesa passa um pouco das bordas pra o tremor não mostrar "buraco"
  ctx.fillStyle = "#000";
  ctx.fillRect(-4, -4, LARGURA + 8, ALTURA + 8);
  mesa(ctx);
  vela(ctx, t);
  tinteiro(ctx);

  if (cena.id === "abertura") {
    if (t < ABRIR_INICIO) {
      livroFechado(ctx, t);
    } else {
      livroAbrindo(ctx, degraus((t - ABRIR_INICIO) / (ABRIR_FIM - ABRIR_INICIO), 8), t);
    }
    poeira(ctx, t, false);
  } else if (cena.id === "final") {
    desenharFinal(ctx, t);
  } else {
    desenharPaginas(ctx, t, cena);
    poeira(ctx, t, true);
  }
  ctx.restore();

  // caixa de diálogo fica parada (fora do tremor)
  const fala = falaEm(t);
  caixaDialogo(ctx, fala?.texto, fala?.letras ?? 0, t);
}

// Páginas ilustradas, com a virada no começo de cada cena (menos a 1ª, que
// "aparece em tinta" logo depois do livro abrir).
function desenharPaginas(ctx, t, cena) {
  const indice = CENAS.indexOf(cena);
  const local = t - cena.inicio;
  const atual = (c) => cena.desenhar(c, local);

  if (cena.id !== "reino" && local < VIRADA_MS) {
    const anterior = CENAS[indice - 1];
    const antiga = (c) => anterior.desenhar(c, anterior.fim - anterior.inicio + local);
    const p = degraus(local / VIRADA_MS, 8);
    // 1ª metade: esquerda ainda antiga, direita já nova (sob a folha erguida)
    // 2ª metade: o verso da folha cobre a esquerda antiga
    livroAberto(ctx, antiga, atual);
    folhaVirando(ctx, p);
    return;
  }

  livroAberto(ctx, atual, atual);
  if (cena.id === "reino" && local < REVELAR_MS) {
    cobrirComPergaminho(ctx, 16 - degraus(local / REVELAR_MS, 6) * 16);
  }
}

// 14s–15s: o livro brilha, a tela escurece e aparece o título.
function desenharFinal(ctx, t) {
  const local = t - CENAS[5].inicio;
  const anterior = CENAS[4];
  const ultimaPagina = (c) => anterior.desenhar(c, anterior.fim - anterior.inicio + local);
  livroAberto(ctx, ultimaPagina, ultimaPagina);

  // brilho crescente saindo das páginas, com raios girando
  const p = degraus(Math.min(1, local / 500), 8);
  const cx = LIVRO.lombada;
  const cy = LIVRO.y + LIVRO.h / 2;
  dither(ctx, LIVRO.x, LIVRO.y, LIVRO.w, LIVRO.h, "n", Math.round(p * 10));
  brilho(ctx, cx, cy, Math.round(60 + p * 110), "4", Math.round(1 + p * 4), 3);
  for (let i = 0; i < 12; i++) {
    const ang = (i / 12) * Math.PI * 2 + local / 400;
    const r0 = 30 + p * 20;
    const r1 = r0 + 20 + p * 120;
    linha(ctx, cx + Math.cos(ang) * r0, cy + Math.sin(ang) * r0 * 0.6, cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1 * 0.6, i % 2 ? "j" : "n", [3, 2], Math.floor(local / 40));
  }

  // fade pro escuro (pontilhado, como nos consoles) e o título
  if (local >= 450) {
    const escuro = degraus((local - 450) / 300, 8);
    dither(ctx, -4, -4, LARGURA + 8, ALTURA + 8, "0", Math.round(escuro * 16));
  }
  if (local >= 600) {
    const titulo = "CODE JOURNEY";
    const x = Math.round((LARGURA - larguraTexto(titulo, 16)) / 2);
    brilho(ctx, LARGURA / 2, 60, 110, "2", 6, 3);
    escrever(ctx, titulo, x, 50, "j", "3", 16);
    const sub = "~ a lenda do código ~";
    escrever(ctx, sub, Math.round((LARGURA - larguraTexto(sub)) / 2), 80, "4", "0", 8);
  }
}
