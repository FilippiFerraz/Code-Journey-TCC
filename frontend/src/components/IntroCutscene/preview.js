// Prévia isolada da cutscene (intro-preview.html), sem login nem backend.
//
// - Normal: clique pra assistir (o clique libera o som); no fim, clique de
//   novo pra repetir. Mostra o tempo decorrido no canto, pra conferir os 15s.
// - ?export=1: não anima sozinha. Expõe window.__intro pro exportador de
//   vídeo (scripts/exportarIntro.mjs) desenhar quadro a quadro.
import "@fontsource/press-start-2p/latin-400.css";
import "./IntroCutscene.css";
import { ALTURA, LARGURA } from "./cenas";
import { DURACAO_MS, desenharQuadro } from "./timeline";
import { carregarFonte } from "./texto";
import { criarMotor } from "./motor";
import { criarAudioIntro, renderizarAudioWav } from "./audio";
import { desbloquearAudio } from "../../utils/audioContexto";

const exportando = new URLSearchParams(location.search).has("export");

const raiz = document.createElement("div");
raiz.className = "intro-cutscene";
const canvas = document.createElement("canvas");
canvas.className = "intro-cutscene-canvas";
canvas.width = LARGURA;
canvas.height = ALTURA;
raiz.appendChild(canvas);
document.body.appendChild(raiz);
const ctx = canvas.getContext("2d");

function paraBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binario = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binario += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binario);
}

if (exportando) {
  window.__intro = {
    duracaoMs: DURACAO_MS,
    pronto: carregarFonte(5000).then(() => true),
    // PNG (base64) do quadro do instante t, no tamanho nativo 320x180
    quadro(t) {
      desenharQuadro(ctx, t);
      return canvas.toDataURL("image/png").split(",")[1];
    },
    // os 15s de áudio renderizados offline, como WAV em base64
    async audioWav() {
      return paraBase64(await renderizarAudioWav());
    },
  };
} else {
  const relogio = document.createElement("div");
  relogio.style.cssText =
    "position:absolute;left:10px;top:10px;color:#fff8f0;font:10px 'Press Start 2P',monospace;opacity:.8";
  raiz.appendChild(relogio);

  let motor = null;
  let audio = null;
  let tocando = false;
  let inicioReal = 0;

  const telaParada = (msg) => {
    desenharQuadro(ctx, 0);
    ctx.fillStyle = "rgba(0,0,0,.6)";
    ctx.fillRect(0, 0, LARGURA, ALTURA);
    relogio.textContent = msg;
  };

  carregarFonte().then(() => telaParada("clique para assistir"));

  raiz.addEventListener("click", () => {
    if (tocando) return;
    desbloquearAudio();
    tocando = true;
    audio = criarAudioIntro();
    motor = criarMotor(canvas, {
      aoTerminar: () => {
        tocando = false;
        audio.parar();
        const real = ((performance.now() - inicioReal) / 1000).toFixed(2);
        relogio.textContent = `fim: ${real}s (timeline ${DURACAO_MS / 1000}s) - clique para repetir`;
      },
    });
    inicioReal = performance.now();
    motor.iniciar();
    audio.iniciar(() => motor.tempo());
    const atualizar = () => {
      if (!tocando) return;
      relogio.textContent = `${(motor.tempo() / 1000).toFixed(1)}s`;
      requestAnimationFrame(atualizar);
    };
    atualizar();
  });
}
