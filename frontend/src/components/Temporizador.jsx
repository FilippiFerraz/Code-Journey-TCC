import "./Temporizador.css";

// Temporizador em pixel art (medalhão de pedra com ampulheta + faixa com o
// tempo em MM:SS), compartilhado pelas telas de desafio. É só visual: a
// contagem continua em cada tela (ver hooks/useCronometro.js), que passa o
// valor atual em `segundos`.
//
// Props:
// - segundos: tempo a exibir (negativo vira 00:00)
// - regressivo (padrão true): contagem regressiva — liga os estados de
//   alerta (<= limiteAlerta) e esgotado (<= 0). As telas de hoje contam o
//   tempo GASTO (cronômetro crescente), então passam regressivo={false}:
//   sem isso, o timer apareceria "esgotado" no segundo 0.
// - limiteAlerta (padrão 30): em segundos, só vale quando regressivo
// - tamanho: "pequeno" | "medio" | "grande" (padrão "medio")
// - pausado: para a animação da ampulheta
// - className: posicionamento vindo da tela (top/right...)

// O desenho é uma grade de 56 x 22 "pixels" (proporção ~2,5:1 — um pouco
// mais comprida que a referência pra "MM:SS" caber legível na fonte pixel). Cada pixel
// vira um <rect> de 1x1 no SVG com shape-rendering="crispEdges", e a
// escala real vem do CSS (--pixel), então nada fica borrado.
const LARGURA = 56;
const ALTURA = 22;

const CORES = {
  pedra: "#4b4866",
  pedraRealce: "#6e6a8c",
  pedraSombra: "#2b2940",
  interior: "#1b1a30",
  ouro: "#e8b64a",
  ouroRealce: "#fbe08a",
  ouroSombra: "#a8742a",
  areiaAzul: "#3d5fd6",
  areiaAzulRealce: "#6f8cf0",
  areiaOuro: "#f0b93c",
  vidro: "#9fb0d8",
  faixa: "#22203a",
  faixaBorda: "#5a5878",
  faixaRealce: "#8c89aa",
};

function px(x, y, cor) {
  return { x, y, cor };
}

// ---------- Faixa (atrás do medalhão), terminando em ponta de seta ----------

function desenharFaixa() {
  const pixels = [];
  const topo = 4;
  const linhas = 14; // ~60% da altura
  const meio = (linhas - 1) / 2;
  const inicio = 14; // começa escondida atrás do medalhão

  for (let i = 0; i < linhas; i++) {
    const y = topo + i;
    // a ponta avança até 6 pixels na linha do meio -> formato de chevron
    const avanco = Math.round(6 - Math.abs(i - meio));
    const fim = 48 + avanco;
    for (let x = inicio; x <= fim; x++) {
      const bordaExterna = i === 0 || i === linhas - 1 || x >= fim - 1;
      const bordaInterna = i === 1 || i === linhas - 2 || x === fim - 2;
      let cor = CORES.faixa;
      if (bordaExterna) cor = CORES.faixaBorda;
      else if (bordaInterna) cor = CORES.faixaRealce;
      pixels.push(px(x, y, cor));
    }
  }

  // detalhe dourado na ponta da seta
  const yMeio = topo + Math.floor(meio);
  pixels.push(px(52, yMeio, CORES.ouro), px(52, yMeio + 1, CORES.ouro));
  pixels.push(px(53, yMeio, CORES.ouroRealce), px(53, yMeio + 1, CORES.ouroSombra));
  pixels.push(px(51, yMeio - 1, CORES.ouroSombra), px(51, yMeio + 2, CORES.ouroSombra));
  return pixels;
}

// ---------- Medalhão de pedra (anel em degraus + interior escuro) ----------

function desenharMedalhao() {
  const pixels = [];
  const centro = 10.5;
  for (let y = 0; y < ALTURA; y++) {
    for (let x = 0; x < ALTURA; x++) {
      const dx = x + 0.5 - (centro + 0.5);
      const dy = y + 0.5 - (centro + 0.5);
      const distancia = Math.sqrt(dx * dx + dy * dy);
      if (distancia > 11) continue;

      let cor;
      if (distancia > 10.1) cor = CORES.pedraSombra; // contorno
      else if (distancia > 7.6) {
        // luz vindo de cima/esquerda: realce no topo-esquerda, sombra embaixo-direita
        const lado = dx + dy;
        if (lado < -5) cor = CORES.pedraRealce;
        else if (lado > 5) cor = CORES.pedraSombra;
        else cor = CORES.pedra;
      } else if (distancia > 6.9) cor = CORES.pedraSombra; // borda interna
      else cor = CORES.interior;
      pixels.push(px(x, y, cor));
    }
  }
  return pixels;
}

// Ornamento dourado em losango (5x5) centralizado em (cx, cy).
function desenharOrnamento(cx, cy) {
  const forma = ["..o..", ".oRo.", "oRooS", ".oSo.", "..o.."];
  const cores = { o: CORES.ouro, R: CORES.ouroRealce, S: CORES.ouroSombra };
  const pixels = [];
  forma.forEach((linha, j) => {
    [...linha].forEach((c, i) => {
      if (c !== ".") pixels.push(px(cx - 2 + i, cy - 2 + j, cores[c]));
    });
  });
  return pixels;
}

// ---------- Ampulheta (8 x 12), com o fio de areia animado à parte ----------

function desenharAmpulheta() {
  const forma = [
    "RRRRRRRR",
    "SooooooS",
    ".vAAAAv.",
    ".vaAAav.",
    "..vAAv..",
    "...vv...",
    "...vv...",
    "..v..v..",
    ".v....v.",
    ".vGGGGv.",
    "SooooooS",
    "RRRRRRRR",
  ];
  const cores = {
    R: CORES.ouroRealce,
    o: CORES.ouro,
    S: CORES.ouroSombra,
    v: CORES.vidro,
    A: CORES.areiaAzul,
    a: CORES.areiaAzulRealce,
    G: CORES.areiaOuro,
  };
  const pixels = [];
  forma.forEach((linha, j) => {
    [...linha].forEach((c, i) => {
      if (c !== ".") pixels.push(px(7 + i, 5 + j, cores[c]));
    });
  });
  return pixels;
}

// Tudo que não muda fica calculado uma vez só, fora do componente.
const PIXELS_FAIXA = desenharFaixa();
const PIXELS_MEDALHAO = [
  ...desenharMedalhao(),
  ...desenharOrnamento(10, 1),
  ...desenharOrnamento(10, 20),
  ...desenharOrnamento(1, 10),
  ...desenharOrnamento(20, 10),
];
const PIXELS_AMPULHETA = desenharAmpulheta();

function Pixels({ lista }) {
  return lista.map((p, i) => <rect key={i} x={p.x} y={p.y} width="1" height="1" fill={p.cor} />);
}

function formatarMMSS(segundos) {
  const total = Math.max(0, Math.floor(Number(segundos) || 0));
  const minutos = Math.floor(total / 60);
  const resto = total % 60;
  return `${String(minutos).padStart(2, "0")}:${String(resto).padStart(2, "0")}`;
}

function descreverTempo(segundos) {
  const total = Math.max(0, Math.floor(Number(segundos) || 0));
  const minutos = Math.floor(total / 60);
  const resto = total % 60;
  const partes = [];
  if (minutos > 0) partes.push(`${minutos} ${minutos === 1 ? "minuto" : "minutos"}`);
  if (resto > 0 || minutos === 0) partes.push(`${resto} ${resto === 1 ? "segundo" : "segundos"}`);
  return partes.join(" e ");
}

export default function Temporizador({
  segundos,
  regressivo = true,
  limiteAlerta = 30,
  tamanho = "medio",
  pausado = false,
  className = "",
}) {
  const esgotado = regressivo && segundos <= 0;
  const alerta = regressivo && !esgotado && segundos <= limiteAlerta;
  const estado = esgotado ? "esgotado" : alerta ? "alerta" : "normal";
  const parado = pausado || esgotado;

  const rotulo = `${regressivo ? "Tempo restante" : "Tempo decorrido"}: ${descreverTempo(segundos)}`;

  // Só muda (e só é anunciado) quando o estado muda — nunca a cada segundo.
  let aviso = "";
  if (esgotado) aviso = "Tempo esgotado!";
  else if (alerta) aviso = `Atenção: restam ${limiteAlerta} segundos ou menos.`;

  return (
    <div
      className={`temporizador temporizador--${tamanho} temporizador--${estado} ${
        parado ? "temporizador--parado" : ""
      } ${className}`}
      role="timer"
      aria-label={rotulo}
    >
      <svg
        className="temporizador-desenho"
        viewBox={`0 0 ${LARGURA} ${ALTURA}`}
        shapeRendering="crispEdges"
        aria-hidden="true"
      >
        <Pixels lista={PIXELS_FAIXA} />
        <g className="temporizador-medalhao">
          <Pixels lista={PIXELS_MEDALHAO} />
          <Pixels lista={PIXELS_AMPULHETA} />
          {/* fio de areia caindo pelo gargalo */}
          <rect className="temporizador-fio" x="10" y="10" width="2" height="2" fill={CORES.areiaAzulRealce} />
          <rect className="temporizador-grao" x="10" y="12" width="1" height="1" fill={CORES.areiaOuro} />
        </g>
      </svg>

      <span className="temporizador-numeros" aria-hidden="true">
        {formatarMMSS(segundos)}
      </span>

      <span className="temporizador-aviso" aria-live="polite">
        {aviso}
      </span>
    </div>
  );
}
