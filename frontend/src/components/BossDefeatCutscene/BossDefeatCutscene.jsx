import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePausarMusica } from "../../utils/musica";
import "@fontsource/press-start-2p/latin-400.css";
import { ALTURA, LARGURA } from "./cenario";
import { carregarRecursos } from "./recursos";
import { criarMotor } from "./motor";
import { criarAudioFinal } from "./audio";
// (o CSS fica em estilos.js, junto com o resto do app — igual à intro)

// Cutscene final de vitória contra o Dragão do Código Fonte (10s, pixel
// art). Toca quando o jogador acerta a última pergunta da batalha final
// (pages/BatalhaDragao) e, ao terminar, a tela leva ao Baú do Dragão.
//
// Organização (tudo nesta pasta):
//   marcos.js   — timeline central: fases, falas, golpes e sons em ms
//   timeline.js — desenho de cada quadro (só depende do instante t)
//   cenario.js  — o salão da batalha (mesma arena da luta), chamas, runas, HUD
//   efeitos.js  — tremor, glitch, rachaduras, explosões, dissolução, fades
//   dialogo.js  — caixa de diálogo de RPG e título de vitória
//   audio.js    — sons chiptune com Web Audio
//   recursos.js — sprite do dragão, herói e arenas, preparados uma vez
//   motor.js    — loop requestAnimationFrame com delta time
//
// Props:
//   camadas      — <img> das camadas do herói (as mesmas da batalha)
//   permitirPular — mostra "Pular ▶" e aceita Enter/Esc/Espaço/toque
//   onConcluir   — chamado no fim (ou ao pular), uma vez só
//
// Enquanto ela roda, nenhuma entrada chega à batalha: o portal cobre a tela
// inteira e as teclas são consumidas aqui.
const CHAVE_MUDO = "introMudo"; // o mesmo botão de som da cutscene de introdução

function lerMudo() {
  try {
    return localStorage.getItem(CHAVE_MUDO) === "1";
  } catch {
    return false;
  }
}

export default function BossDefeatCutscene({ camadas = [], permitirPular = false, onConcluir }) {
  // A cutscene tem trilha própria: a música de fundo do jogo fica em silêncio
  // enquanto ela estiver na tela (ver utils/musica.js).
  usePausarMusica();

  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const concluirRef = useRef(() => {});
  const [mudo, setMudo] = useState(lerMudo);
  const [legenda, setLegenda] = useState("");

  useEffect(() => {
    let cancelado = false;
    let motor = null;
    let terminou = false;
    const reduzirMovimento = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const audio = criarAudioFinal({ mudo: lerMudo() });
    audioRef.current = audio;

    const concluir = () => {
      if (terminou) return;
      terminou = true;
      motor?.parar();
      audio.parar();
      onConcluir?.();
    };
    concluirRef.current = concluir;

    // fonte pixelada + sprite/arenas prontos (normalmente já pré-carregados
    // pela batalha) -> animação e som juntos
    carregarRecursos({ camadas }).then((recursos) => {
      if (cancelado) return;
      motor = criarMotor(canvasRef.current, recursos, {
        aoTerminar: concluir,
        aoMudarFala: setLegenda,
        reduzirMovimento,
      });
      motor.iniciar();
      audio.iniciar(() => motor.tempo());
    });

    // teclado: consumido aqui (não chega na batalha); pula se permitido
    const aoTeclar = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (permitirPular && (e.key === "Enter" || e.key === "Escape" || e.key === " ")) concluir();
    };
    window.addEventListener("keydown", aoTeclar, true);

    return () => {
      cancelado = true;
      terminou = true;
      motor?.parar();
      audio.parar();
      window.removeEventListener("keydown", aoTeclar, true);
    };
    // roda uma vez só por vitória
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function alternarMudo(e) {
    e.stopPropagation();
    const novo = !mudo;
    setMudo(novo);
    audioRef.current?.definirMudo(novo);
    try {
      localStorage.setItem(CHAVE_MUDO, novo ? "1" : "0");
    } catch {
      // ignora (aba anônima etc.)
    }
  }

  function pular(e) {
    e.stopPropagation();
    concluirRef.current();
  }

  return createPortal(
    <div
      className="final-cutscene"
      role="dialog"
      aria-modal="true"
      aria-label="Vitória contra o Dragão do Código Fonte"
      onClick={() => permitirPular && concluirRef.current()}
    >
      <canvas ref={canvasRef} className="final-cutscene-canvas" width={LARGURA} height={ALTURA} aria-hidden="true" />

      <div className="final-cutscene-controles">
        <button
          type="button"
          className="final-cutscene-botao"
          onClick={alternarMudo}
          aria-label={mudo ? "Ligar som" : "Desligar som"}
          aria-pressed={mudo}
        >
          {mudo ? "SOM: OFF" : "SOM: ON"}
        </button>
        {permitirPular && (
          <button type="button" className="final-cutscene-botao" onClick={pular} autoFocus>
            Pular ▶
          </button>
        )}
      </div>

      {/* legenda pra leitores de tela (o texto do canvas não é lido) */}
      <p className="final-cutscene-legenda" aria-live="polite">
        {legenda}
      </p>
    </div>,
    document.body
  );
}
