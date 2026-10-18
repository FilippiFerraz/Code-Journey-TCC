import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "@fontsource/press-start-2p/latin-400.css";
import { criarMotor } from "./motor";
import { criarAudioIntro } from "./audio";
import { carregarFonte } from "./texto";
import { ALTURA, LARGURA } from "./cenas";

// Cutscene de introdução (15s, pixel art): um livro mágico sobre a mesa que
// abre e conta a história do reino. Aparece UMA vez, no primeiro acesso de
// uma conta nova — quem decide isso é Home.jsx (Usuario.introVista).
//
// Organização (tudo nesta pasta):
//   timeline.js — cenas, falas e sons marcados em ms + desenho de cada quadro
//   cenas.js    — uma função de desenho por cena (e mesa, vela, livro)
//   sprites.js  — sprites em texto (camponês, goblin, bug, ancião, herói...)
//   pixel.js    — primitivas "pixel perfeito" (retângulo, polígono, dither)
//   texto.js    — fonte pixelada e caixa de diálogo com máquina de escrever
//   audio.js    — trilha chiptune e efeitos com Web Audio
//   motor.js    — loop requestAnimationFrame com delta time
//
// Pular: botão, Enter, Esc, Espaço ou toque/clique em qualquer lugar.
// Renderizado num portal no <body>: o .app-frame tem transform (ver
// App.css), e um position: fixed dentro dele ficaria preso aos 720px da
// moldura em vez de cobrir a tela toda.
const CHAVE_MUDO = "introMudo";

function lerMudo() {
  try {
    return localStorage.getItem(CHAVE_MUDO) === "1";
  } catch {
    return false;
  }
}

export default function IntroCutscene({ onConcluir }) {
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

    const audio = criarAudioIntro({ mudo: lerMudo() });
    audioRef.current = audio;

    const concluir = () => {
      if (terminou) return;
      terminou = true;
      motor?.parar();
      audio.parar();
      onConcluir();
    };
    concluirRef.current = concluir;

    // espera a fonte pixelada (no máx. 1,5s) e começa animação + som juntos
    carregarFonte().then(() => {
      if (cancelado) return;
      motor = criarMotor(canvasRef.current, {
        aoTerminar: concluir,
        aoMudarFala: setLegenda,
        reduzirMovimento,
      });
      motor.iniciar();
      audio.iniciar(() => motor.tempo());
    });

    const aoTeclar = (e) => {
      if (e.key === "Enter" || e.key === "Escape" || e.key === " ") {
        e.preventDefault();
        concluir();
      }
    };
    window.addEventListener("keydown", aoTeclar);

    return () => {
      cancelado = true;
      terminou = true;
      motor?.parar();
      audio.parar();
      window.removeEventListener("keydown", aoTeclar);
    };
    // onConcluir é estável o bastante: a cutscene roda uma vez só
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
      className="intro-cutscene"
      role="dialog"
      aria-modal="true"
      aria-label="Introdução do jogo"
      onClick={() => concluirRef.current()}
    >
      <canvas ref={canvasRef} className="intro-cutscene-canvas" width={LARGURA} height={ALTURA} aria-hidden="true" />

      <div className="intro-cutscene-controles">
        <button
          type="button"
          className="intro-cutscene-botao"
          onClick={alternarMudo}
          aria-label={mudo ? "Ligar som" : "Desligar som"}
          aria-pressed={mudo}
        >
          {mudo ? "SOM: OFF" : "SOM: ON"}
        </button>
        <button type="button" className="intro-cutscene-botao" onClick={pular} autoFocus>
          Pular ▶
        </button>
      </div>

      {/* legenda pra leitores de tela (o texto do canvas não é lido) */}
      <p className="intro-cutscene-legenda" aria-live="polite">
        {legenda}
      </p>
    </div>,
    document.body
  );
}
