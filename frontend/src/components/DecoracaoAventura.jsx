import "./DecoracaoAventura.css";

// Linha com losango no meio — separa as frases decorativas da sidebar e da
// coluna direita do MainLayout.
export function Ornamento() {
  return (
    <span className="ornamento-aventura" aria-hidden="true">
      <span />◆<span />
    </span>
  );
}

// Frase "Grandes aventuras..." no pé da coluna direita do desktop. `comFundo`
// liga a arte do dragão no castelo atrás dela (hoje só na Home).
export default function DecoracaoAventura({ comFundo = false }) {
  return (
    <div
      className={`decoracao-aventura ${comFundo ? "decoracao-aventura--com-fundo" : ""}`}
      aria-hidden="true"
    >
      <Ornamento />
      <p>Grandes aventuras começam com pequenos passos.</p>
      <Ornamento />
    </div>
  );
}
