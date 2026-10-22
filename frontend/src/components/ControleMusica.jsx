import { useEffect, useId, useRef, useState } from "react";
import { Music } from "pixelarticons/react/Music.js";
import { Volume1 } from "pixelarticons/react/Volume1.js";
import { Volume3 } from "pixelarticons/react/Volume3.js";
import { VolumeX } from "pixelarticons/react/VolumeX.js";
import IconePixel from "./IconePixel";
import { alternarMudo, definirVolume, useMusica } from "../utils/musica";
import "./ControleMusica.css";

function iconeVolume({ volume, mudo }) {
  if (mudo || volume === 0) return VolumeX;
  return volume < 0.5 ? Volume1 : Volume3;
}

// Volume (deslizante) + mudo da música. Usado dentro do popover do botão
// (ControleMusica) e direto na tela de Configurações.
export function PainelVolume({ className = "" }) {
  const musica = useMusica();
  const id = useId();
  const silencio = musica.mudo || musica.volume === 0;
  const porcentagem = Math.round(musica.volume * 100);

  return (
    <div className={`musica-painel ${className}`}>
      <label className="musica-painel-rotulo" htmlFor={id}>
        <IconePixel icone={Music} /> Música
        <span className="musica-painel-valor">{silencio ? "Mudo" : `${porcentagem}%`}</span>
      </label>
      <div className="musica-painel-linha">
        <button
          type="button"
          className={`musica-mudo ${silencio ? "musica-mudo--ativo" : ""}`}
          onClick={alternarMudo}
          aria-pressed={musica.mudo}
          aria-label={musica.mudo ? "Ligar a música" : "Silenciar a música"}
        >
          <IconePixel icone={iconeVolume(musica)} />
        </button>
        <input
          id={id}
          type="range"
          min="0"
          max="100"
          step="5"
          value={musica.mudo ? 0 : porcentagem}
          onChange={(e) => definirVolume(Number(e.target.value) / 100)}
          className="musica-volume"
          aria-valuetext={silencio ? "mudo" : `${porcentagem}%`}
          style={{ "--preenchido": `${musica.mudo ? 0 : porcentagem}%` }}
        />
      </div>
    </div>
  );
}

// Botão de alto-falante que abre o painel de volume. variante:
// "cabecalho" (MainLayout, fundo roxo) | "jogo" (telas de desafio/loja,
// mesmo tamanho da mochila). Clique fora ou Esc fecha.
export default function ControleMusica({ variante = "jogo" }) {
  const musica = useMusica();
  const [aberto, setAberto] = useState(false);
  const raizRef = useRef(null);

  useEffect(() => {
    if (!aberto) return;
    const aoClicar = (e) => !raizRef.current?.contains(e.target) && setAberto(false);
    const aoTeclar = (e) => e.key === "Escape" && setAberto(false);
    document.addEventListener("pointerdown", aoClicar);
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("pointerdown", aoClicar);
      document.removeEventListener("keydown", aoTeclar);
    };
  }, [aberto]);

  const silencio = musica.mudo || musica.volume === 0;

  return (
    <div className={`musica-controle musica-controle--${variante}`} ref={raizRef}>
      <button
        type="button"
        className={`musica-botao ${silencio ? "musica-botao--mudo" : ""}`}
        onClick={() => setAberto((a) => !a)}
        aria-expanded={aberto}
        aria-label={`Volume da música (${silencio ? "mudo" : `${Math.round(musica.volume * 100)}%`})`}
      >
        <IconePixel icone={iconeVolume(musica)} />
      </button>
      {aberto && <PainelVolume className="musica-painel--popover" />}
    </div>
  );
}
