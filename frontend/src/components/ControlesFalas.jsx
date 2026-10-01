import BotaoPixel from "./BotaoPixel";
import { INTERVALO_FALA_MS } from "../hooks/useAvancoAutomatico";
import "./ControlesFalas.css";

// Peças compartilhadas pelos balões de fala das introduções de desafio
// (DesafioIntro, DesafioIntroPocao e a abertura do DesafioChefe).

// Botão "Pular" no canto superior direito: pula todas as falas de uma vez.
// O stopPropagation evita que o clique também conte como "toque na tela"
// (que nessas telas avança a fala). `className` ajusta a posição por tela.
export function BotaoPularFalas({ onPular, className = "" }) {
  function handleClique(e) {
    e.stopPropagation();
    onPular();
  }

  return (
    <BotaoPixel
      className={`falas-pular ${className}`}
      classeMiolo="falas-pular-miolo"
      onClick={handleClique}
      aria-label="Pular as falas"
    >
      Pular ⏭
    </BotaoPixel>
  );
}

// Barrinha no pé do balão que enche enquanto a fala está na tela e, ao
// completar, a próxima fala aparece sozinha (ver useAvancoAutomatico).
// `chave` = índice da fala: trocar a chave recria o elemento e a animação
// recomeça do zero junto com o timer.
export function BarraAvancoFala({ chave, intervaloMs = INTERVALO_FALA_MS }) {
  return (
    <span className="falas-barra" aria-hidden="true">
      <span
        key={chave}
        className="falas-barra-preenchimento"
        style={{ animationDuration: `${intervaloMs}ms` }}
      />
    </span>
  );
}
