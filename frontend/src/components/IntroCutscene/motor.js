// Motor da cutscene: loop com requestAnimationFrame que soma o delta time de
// cada quadro e pede à timeline o desenho daquele instante.
//
// O tempo vem do relógio real (o timestamp do rAF), não da contagem de
// quadros: num monitor de 144Hz ou num celular a 30fps a cutscene dura os
// mesmos 15s — só muda quantos quadros são desenhados nesse intervalo.
// (Com a aba em segundo plano o rAF pausa, mas o tempo continua contando,
// igual ao áudio — os dois nunca ficam fora de sincronia.)
import { DURACAO_MS, desenharQuadro, falaEm } from "./timeline";

export function criarMotor(canvas, { aoTerminar, aoMudarFala, reduzirMovimento = false } = {}) {
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  let decorrido = 0;
  let anterior = 0;
  let raf = 0;
  let rodando = false;
  let falaAtual = -1;

  function desenhar() {
    desenharQuadro(ctx, decorrido, { reduzirMovimento });
    const fala = falaEm(decorrido);
    const indice = fala?.indice ?? -1;
    if (indice !== falaAtual) {
      falaAtual = indice;
      aoMudarFala?.(fala?.texto ?? "");
    }
  }

  function passo(agora) {
    if (!rodando) return;
    // delta time do quadro (nunca negativo: o 1º rAF pode vir com
    // timestamp um pouquinho anterior ao performance.now() do início)
    decorrido += Math.max(0, agora - anterior);
    anterior = agora;
    if (decorrido >= DURACAO_MS) {
      decorrido = DURACAO_MS;
      rodando = false;
      aoTerminar?.();
      return;
    }
    desenhar();
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
    // tempo atual da cutscene em ms (usado pra sincronizar o áudio)
    tempo() {
      return decorrido;
    },
  };
}
