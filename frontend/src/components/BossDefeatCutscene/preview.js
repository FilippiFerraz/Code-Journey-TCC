// Prévia isolada da cutscene final (final-boss-preview.html), sem login nem
// backend — mesmo esquema da prévia da intro.
//
// - Normal: clique pra assistir (o clique libera o som); no fim, clique de
//   novo pra repetir. Mostra o tempo decorrido no canto, pra conferir os 10s.
// - ?export=1: não anima sozinha. Expõe window.__final pro exportador de
//   vídeo (scripts/exportarFinalBoss.mjs) desenhar quadro a quadro.
// - ?aparencia=guerreira-afro (etc.): troca o herói da prévia.
import "@fontsource/press-start-2p/latin-400.css";
import "./BossDefeatCutscene.css";
import { camadasDoPersonagem } from "../../data/spritesPersonagem";
import { desbloquearAudio } from "../../utils/audioContexto";
import { carregarFonte } from "../IntroCutscene/texto";
import { ALTURA, LARGURA } from "./cenario";
import { DURACAO_MS, desenharQuadro } from "./timeline";
import { carregarRecursos } from "./recursos";
import { criarMotor } from "./motor";
import { criarAudioFinal, renderizarAudioWav } from "./audio";

const parametros = new URLSearchParams(location.search);
const exportando = parametros.has("export");

// herói da prévia: aparência escolhida e o mesmo equipamento usado nas fotos
const camadas = camadasDoPersonagem(
  [
    { tipo: "arma", imagemUrl: "arma/espada--dourado" },
    { tipo: "peitoral", imagemUrl: "peitoral/armadura--dourado" },
    { tipo: "costas", imagemUrl: "costas/capa--dourado" },
  ],
  parametros.get("aparencia") ?? "guerreiro"
).map(({ src }) => {
  const img = new Image();
  img.src = src;
  return img;
});

const raiz = document.createElement("div");
raiz.className = "final-cutscene";
const canvas = document.createElement("canvas");
canvas.className = "final-cutscene-canvas";
canvas.width = LARGURA;
canvas.height = ALTURA;
raiz.appendChild(canvas);
document.body.appendChild(raiz);
const ctx = canvas.getContext("2d");

function paraBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binario = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binario += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binario);
}

const prontos = Promise.all([carregarFonte(5000), carregarRecursos({ camadas })]).then(([, recursos]) => recursos);

if (exportando) {
  let recursos = null;
  window.__final = {
    duracaoMs: DURACAO_MS,
    pronto: prontos.then((r) => {
      recursos = r;
      return true;
    }),
    // PNG (base64) do quadro do instante t, no tamanho nativo 384x216
    quadro(t) {
      desenharQuadro(ctx, t, recursos);
      return canvas.toDataURL("image/png").split(",")[1];
    },
    async audioWav() {
      return paraBase64(await renderizarAudioWav());
    },
  };
} else {
  const relogio = document.createElement("div");
  relogio.style.cssText = "position:absolute;left:10px;top:10px;color:#fff8f0;font:10px 'Press Start 2P',monospace;opacity:.8";
  raiz.appendChild(relogio);
  let tocando = false;

  prontos.then((recursos) => {
    desenharQuadro(ctx, 0, recursos);
    relogio.textContent = "clique para assistir";
    raiz.addEventListener("click", () => {
      if (tocando) return;
      desbloquearAudio();
      tocando = true;
      const audio = criarAudioFinal();
      const inicioReal = performance.now();
      const motor = criarMotor(canvas, recursos, {
        aoTerminar: () => {
          tocando = false;
          audio.parar();
          const real = ((performance.now() - inicioReal) / 1000).toFixed(2);
          relogio.textContent = `fim: ${real}s (timeline ${DURACAO_MS / 1000}s) - clique para repetir`;
        },
      });
      motor.iniciar();
      audio.iniciar(() => motor.tempo());
      const atualizar = () => {
        if (!tocando) return;
        relogio.textContent = `${(motor.tempo() / 1000).toFixed(1)}s`;
        requestAnimationFrame(atualizar);
      };
      atualizar();
    });
  });
}
