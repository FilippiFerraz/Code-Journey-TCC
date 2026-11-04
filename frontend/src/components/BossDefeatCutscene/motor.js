// Motor da cutscene final (mesmo padrão do IntroCutscene/motor.js): loop com
// requestAnimationFrame que soma o delta time de cada quadro e pede à
// timeline o desenho daquele instante.
//
// O tempo vem do relógio real (timestamp do rAF), não da contagem de
// quadros: a 144Hz ou a 30fps a cutscene dura os mesmos 10s — só muda
// quantos quadros são desenhados nesse intervalo.
import { DURACAO_MS, desenharQuadro } from "./timeline";
import { falaEm } from "./marcos";

export function criarMotor(canvas, recursos, { aoTerminar, aoMudarFala, reduzirMovimento = false } = {}) {
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  let decorrido = 0;
  let anterior = 0;
  let raf = 0;
  let rodando = false;
  let falaAtual = -1;

  function desenhar() {
    desenharQuadro(ctx, decorrido, recursos, { reduzirMovimento });
    const indice = falaEm(decorrido)?.indice ?? -1;
    if (indice !== falaAtual) {
      falaAtual = indice;
      aoMudarFala?.(falaEm(decorrido)?.texto ?? "");
    }
  }

  // no máximo ~60 quadros por segundo (telas de 120 Hz desenhavam o dobro)
  const INTERVALO_MIN_MS = 1000 / 60 - 2;
  let ultimoDesenho = -Infinity;

  function passo(agora) {
    if (!rodando) return;
    // delta time do quadro (nunca negativo: o 1º rAF pode vir com timestamp
    // um pouquinho anterior ao performance.now() do início)
    decorrido += Math.max(0, agora - anterior);
    anterior = agora;
    if (decorrido >= DURACAO_MS) {
      decorrido = DURACAO_MS;
      rodando = false;
      aoTerminar?.();
      return;
    }
    if (agora - ultimoDesenho >= INTERVALO_MIN_MS) {
      ultimoDesenho = agora;
      desenhar();
    }
    raf = requestAnimationFrame(passo);
  }

  return {
    iniciar() {
      if (rodando) return;
      rodando = true;
      anterior = performance.now();
      desenhar();
      raf = requestAnimationFrame(passo);
    },
    parar() {
      rodando = false;
      cancelAnimationFrame(raf);
    },
    // tempo atual da cutscene em ms (pra sincronizar o áudio)
    tempo() {
      return decorrido;
    },
  };
}
