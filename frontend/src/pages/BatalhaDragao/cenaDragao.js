// Cena da Batalha do Dragão em Canvas 2D. Tudo é desenhado num buffer de
// baixa resolução (LARGURA x ALTURA) e ampliado sem suavização — por isso o
// dragão, montado por código a partir de formas simples (corpo, pescoço,
// cabeça, mandíbula, chifres, asas, cauda), sai em pixel art de verdade, e
// cada parte pode ser animada separada (respiração, asas, boca, recuo).
//
// Não conhece regras: recebe o estado da batalha (ver estadoBatalha.js) e
// anima cada estado — idle, charging, attacking, hit, furia, victory, defeat.

export const LARGURA = 240;
export const ALTURA = 150;

// Duração das animações de cada estado (a tela usa pra saber quando
// despachar FIM_ANIMACAO).
export const DURACOES = { hit: 1400, attacking: 1600, furia: 2300 };

const C = {
  fundoTopo: "#0d0619",
  fundoBase: "#2a1240",
  pedra: "#211534",
  pedraClara: "#2f2147",
  piso: "#2b2238",
  pisoClaro: "#3a2f4d",
  runa: "#9b4dff",
  estandarte: "#4a1a7a",
  ouro: "#e8b64c",
  escama: "#5b2a86",
  escamaEscura: "#3a1858",
  escamaClara: "#7d45b3",
  barriga: "#a27ad6",
  barrigaListra: "#7d58b0",
  chifre: "#e6dbff",
  membrana: "#7a3fb8",
  membranaClara: "#a46be0",
  osso: "#2c0f45",
  olho: "#ff4fd8",
  olhoFuria: "#ff2a5a",
  sopro: "#b026ff",
  soproNucleo: "#ff7bf0",
  escudo: "#3ff2ff",
};

const PLAYER = { x: 52, y: 120 };
const ANCORA = { x: 160, y: 100 }; // pés do dragão

const limitar = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const suave = (t) => t * t * (3 - 2 * t);

export function criarCenaDragao(canvas, { camadas = [] } = {}) {
  const ctx = canvas.getContext("2d");
  const buffer = document.createElement("canvas");
  buffer.width = LARGURA;
  buffer.height = ALTURA;
  const b = buffer.getContext("2d");
  // o dragão é desenhado à parte, pra poder piscar (flash) e sumir inteiro
  const camadaDragao = document.createElement("canvas");
  camadaDragao.width = LARGURA;
  camadaDragao.height = ALTURA;
  const d = camadaDragao.getContext("2d");

  let quadro = 0;
  let estado = { estado: "intro", fase: 1, escudo: false, inicioCarga: null, prazoMs: 1 };
  let inicioEstado = performance.now();
  let tremor = 0; // intensidade do screen shake (px do buffer)
  let fimEscudoQuebrado = 0;
  const particulas = [];

  function ajustarTamanho() {
    const caixa = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(caixa.width * dpr));
    canvas.height = Math.max(1, Math.round(caixa.height * dpr));
  }

  function particula(p) {
    particulas.push({ vida: 1, tam: 1, cor: "#ffffff", vx: 0, vy: 0, ax: 0, ay: 0, decai: 0.02, ...p });
  }

  // ---------- Geometria do dragão ----------

  // Posições que dependem da animação (respiração, recuo, postura).
  function pose(t, info) {
    const resp = Math.sin(t / 520);
    const recuo = info.recuo ?? 0;
    const ergue = info.ergue ?? 0; // cabeça erguida (rugido da fúria)
    const ax = ANCORA.x + recuo;
    const ay = ANCORA.y + (info.afunda ?? 0);
    const hx = ax - 40 + recuo * 0.5 - ergue * 2;
    const hy = ay - 56 + resp * 1.4 - ergue * 10;
    return { ax, ay, hx, hy, resp, boca: { x: hx - 19, y: hy + 3 } };
  }

  function asa(g, ax, ay, abertura, perto) {
    // ombro e as pontas dos "dedos" da asa. O dragão olha pra esquerda, então
    // a asa abre pra cima e pra trás (direita): ângulos entre "quase reto pra
    // cima" e "diagonal pra direita". A batida gira tudo junto.
    const ombro = { x: ax + (perto ? 0 : 8), y: ay - (perto ? 36 : 38) };
    const batida = (abertura - 0.5) * 0.5;
    const escala = perto ? 1 : 0.85;
    const dedos = [
      [60, -1.62],
      [56, -1.22],
      [46, -0.84],
      [32, -0.5],
    ].map(([comp, ang]) => ({
      x: ombro.x + Math.cos(ang - batida) * comp * escala,
      y: ombro.y + Math.sin(ang - batida) * comp * escala * 0.9,
    }));
    g.fillStyle = perto ? C.membrana : C.escamaEscura;
    g.beginPath();
    g.moveTo(ombro.x, ombro.y);
    dedos.forEach((p, i) => {
      if (i === 0) g.lineTo(p.x, p.y);
      else {
        const ant = dedos[i - 1];
        g.quadraticCurveTo((ant.x + p.x) / 2 - 2, (ant.y + p.y) / 2 + 6, p.x, p.y);
      }
    });
    g.quadraticCurveTo(ombro.x + 12, ombro.y + 14, ax + 16, ay - 22);
    g.closePath();
    g.fill();
    if (perto) {
      g.strokeStyle = C.membranaClara;
      g.lineWidth = 1;
      g.stroke();
    }
    g.strokeStyle = C.osso;
    g.lineWidth = 2;
    for (const p of dedos) {
      g.beginPath();
      g.moveTo(ombro.x, ombro.y);
      g.lineTo(p.x, p.y);
      g.stroke();
    }
  }

  function desenharDragao(t, info) {
    const g = d;
    g.clearRect(0, 0, LARGURA, ALTURA);
    const { ax, ay, hx, hy, resp } = pose(t, info);
    const abertura = info.asa ?? 0.5 + 0.5 * Math.sin(t / 700);
    const mandibula = info.mandibula ?? 0;

    // aura do Modo Fúria
    if (info.furia > 0) {
      for (let i = 0; i < 4; i++) {
        const pulso = Math.sin(t / 180 + i) * 3;
        g.fillStyle = `rgba(176, 38, 255, ${0.08 * info.furia})`;
        g.beginPath();
        g.ellipse(ax - 6, ay - 36, 56 + i * 6 + pulso, 46 + i * 5 + pulso, 0, 0, Math.PI * 2);
        g.fill();
      }
    }

    asa(g, ax, ay, abertura * 0.8, false); // asa de trás

    // cauda: círculos ao longo de uma curva, balançando
    for (let i = 0; i <= 14; i++) {
      const f = i / 14;
      const x = ax + 24 + f * 48;
      const y = ay - 12 + Math.sin(f * 3 + t / 600) * 6 * f + f * 8;
      g.fillStyle = i % 3 === 0 ? C.escamaEscura : C.escama;
      g.beginPath();
      g.arc(x, y, 8 - f * 6, 0, Math.PI * 2);
      g.fill();
    }
    const ponta = { x: ax + 74, y: ay - 4 + Math.sin(3 + t / 600) * 6 };
    g.fillStyle = C.escamaClara;
    g.beginPath();
    g.moveTo(ponta.x - 4, ponta.y - 5);
    g.lineTo(ponta.x + 8, ponta.y);
    g.lineTo(ponta.x - 4, ponta.y + 5);
    g.closePath();
    g.fill();

    // pata de trás (longe)
    g.fillStyle = C.escamaEscura;
    g.beginPath();
    g.ellipse(ax + 22, ay - 6, 8, 9, 0, 0, Math.PI * 2);
    g.fill();

    // corpo (respira) + barriga listrada
    const ry = 17 + resp * 1.2;
    g.fillStyle = C.escama;
    g.beginPath();
    g.ellipse(ax + 6, ay - 22, 30, ry, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = C.escamaClara;
    g.beginPath();
    g.ellipse(ax + 4, ay - 30, 22, ry * 0.45, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = C.barriga;
    g.beginPath();
    g.ellipse(ax + 2, ay - 14, 22, 9 + resp * 0.6, 0, 0, Math.PI);
    g.fill();
    g.fillStyle = C.barrigaListra;
    for (let x = ax - 16; x <= ax + 20; x += 5) g.fillRect(x, ay - 14, 1, 8);
    // escamas salpicadas
    g.fillStyle = C.escamaEscura;
    for (let i = 0; i < 14; i++) g.fillRect(ax - 18 + ((i * 7) % 44), ay - 34 + ((i * 5) % 14), 2, 1);

    // espinhos nas costas
    g.fillStyle = C.chifre;
    for (let i = 0; i < 6; i++) {
      const x = ax - 10 + i * 7;
      const y = ay - 22 - ry + 2 + Math.abs(i - 2.5) * 1.2;
      g.beginPath();
      g.moveTo(x - 2, y + 2);
      g.lineTo(x + 1, y - 5);
      g.lineTo(x + 3, y + 2);
      g.closePath();
      g.fill();
    }

    // pata de trás (perto) com garras
    g.fillStyle = C.escama;
    g.beginPath();
    g.ellipse(ax + 18, ay - 9, 9, 10, 0, 0, Math.PI * 2);
    g.fill();
    g.fillRect(ax + 12, ay - 4, 12, 4);
    g.fillStyle = C.chifre;
    for (let i = 0; i < 3; i++) g.fillRect(ax + 11 + i * 4, ay, 2, 2);

    // pescoço: círculos do ombro até a cabeça
    for (let i = 0; i <= 10; i++) {
      const f = i / 10;
      const x = ax - 14 + (hx + 6 - (ax - 14)) * f;
      const y = ay - 30 + (hy + 4 - (ay - 30)) * f - Math.sin(f * Math.PI) * 4;
      g.fillStyle = C.escama;
      g.beginPath();
      g.arc(x, y, 10 - f * 3, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = C.barriga;
      g.fillRect(x - 8 + f * 2, y + 2, 4, 3);
    }

    // pata da frente
    g.fillStyle = C.escama;
    g.fillRect(ax - 20, ay - 16, 8, 14);
    g.fillRect(ax - 24, ay - 4, 13, 4);
    g.fillStyle = C.chifre;
    for (let i = 0; i < 3; i++) g.fillRect(ax - 25 + i * 4, ay, 2, 2);

    // ---- cabeça ----
    // chifres
    g.fillStyle = C.chifre;
    g.beginPath();
    g.moveTo(hx + 4, hy - 6);
    g.quadraticCurveTo(hx + 16, hy - 14, hx + 24, hy - 12);
    g.lineTo(hx + 10, hy - 3);
    g.closePath();
    g.fill();
    g.beginPath();
    g.moveTo(hx + 2, hy - 2);
    g.quadraticCurveTo(hx + 14, hy - 6, hx + 22, hy - 2);
    g.lineTo(hx + 8, hy + 2);
    g.closePath();
    g.fill();
    // crânio
    g.fillStyle = C.escama;
    g.beginPath();
    g.ellipse(hx + 4, hy, 11, 8, 0, 0, Math.PI * 2);
    g.fill();
    // boca aberta (interior brilhando quando carrega)
    if (mandibula > 0.05) {
      g.fillStyle = info.brilhoBoca > 0 ? `rgb(${120 + info.brilhoBoca * 135}, 30, ${140 + info.brilhoBoca * 115})` : "#3a0a2a";
      g.beginPath();
      g.moveTo(hx + 2, hy + 3);
      g.lineTo(hx - 18, hy + 1);
      g.lineTo(hx - 16, hy + 4 + mandibula * 12);
      g.closePath();
      g.fill();
    }
    // focinho (mandíbula de cima)
    g.fillStyle = C.escamaClara;
    g.beginPath();
    g.moveTo(hx + 2, hy - 5);
    g.lineTo(hx - 19, hy - 2);
    g.lineTo(hx - 20, hy + 2);
    g.lineTo(hx + 2, hy + 3);
    g.closePath();
    g.fill();
    g.fillStyle = C.chifre; // dentes de cima
    for (let i = 0; i < 4; i++) g.fillRect(hx - 17 + i * 4, hy + 2, 1, 2);
    // mandíbula de baixo (abre girando)
    g.save();
    g.translate(hx + 2, hy + 4);
    g.rotate(mandibula * 0.55);
    g.fillStyle = C.escama;
    g.beginPath();
    g.moveTo(0, -1);
    g.lineTo(-19, 0);
    g.lineTo(-17, 4);
    g.lineTo(0, 5);
    g.closePath();
    g.fill();
    g.fillStyle = C.chifre;
    for (let i = 0; i < 3; i++) g.fillRect(-15 + i * 4, -2, 1, 2);
    g.restore();
    // narina
    g.fillStyle = C.osso;
    g.fillRect(hx - 18, hy - 2, 2, 1);
    // olho neon pulsando
    const corOlho = info.furia > 0.5 ? C.olhoFuria : C.olho;
    const pulso = 0.6 + 0.4 * Math.sin(t / 260);
    g.fillStyle = "#1a0420";
    g.fillRect(hx - 4, hy - 5, 5, 3);
    g.fillStyle = corOlho;
    g.fillRect(hx - 3, hy - 4, 3, 2);
    g.globalCompositeOperation = "lighter";
    g.fillStyle = corOlho;
    g.globalAlpha = 0.25 * pulso;
    g.beginPath();
    g.arc(hx - 2, hy - 3, 5 + pulso * 2, 0, Math.PI * 2);
    g.fill();
    g.globalAlpha = 1;
    g.globalCompositeOperation = "source-over";

    asa(g, ax, ay, abertura, true); // asa da frente

    // flash de dano (branco/vermelho alternando)
    if (info.flash > 0) {
      g.globalCompositeOperation = "source-atop";
      g.fillStyle = Math.floor(t / 70) % 2 ? `rgba(255, 255, 255, ${info.flash})` : `rgba(255, 60, 90, ${info.flash})`;
      g.fillRect(0, 0, LARGURA, ALTURA);
      g.globalCompositeOperation = "source-over";
    }

    b.globalAlpha = info.alfa ?? 1;
    b.drawImage(camadaDragao, 0, 0);
    b.globalAlpha = 1;
  }

  // ---------- Arena ----------

  function desenharArena(t, escurecer) {
    const grad = b.createLinearGradient(0, 0, 0, ALTURA);
    grad.addColorStop(0, C.fundoTopo);
    grad.addColorStop(1, C.fundoBase);
    b.fillStyle = grad;
    b.fillRect(0, 0, LARGURA, ALTURA);
    // muralha de pedra
    for (let y = 0; y < 72; y += 8) {
      for (let x = (y / 8) % 2 ? -8 : 0; x < LARGURA; x += 16) {
        b.fillStyle = (x + y) % 3 ? C.pedra : C.pedraClara;
        b.fillRect(x + 1, y + 1, 14, 6);
      }
    }
    // estandartes
    for (const x of [26, 206]) {
      b.fillStyle = C.estandarte;
      b.fillRect(x, 10, 14, 34);
      b.fillRect(x, 44, 6, 4);
      b.fillRect(x + 8, 44, 6, 4);
      b.fillStyle = C.ouro;
      b.fillRect(x + 6, 18, 2, 12);
      b.fillRect(x + 3, 22, 8, 2);
    }
    // piso circular da arena com anel de runas girando
    b.fillStyle = C.piso;
    b.beginPath();
    b.ellipse(120, 116, 128, 36, 0, 0, Math.PI * 2);
    b.fill();
    b.fillStyle = C.pisoClaro;
    for (let i = 0; i < 40; i++) b.fillRect((i * 37) % 236, 86 + ((i * 13) % 60), 6, 2);
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * Math.PI * 2 + t / 4000;
      const x = 120 + Math.cos(a) * 108;
      const y = 116 + Math.sin(a) * 28;
      b.fillStyle = i % 3 === 0 ? C.runa : "#5e2a9e";
      b.globalAlpha = 0.6 + 0.4 * Math.sin(t / 300 + i);
      b.fillRect(Math.round(x), Math.round(y), 2, 1);
    }
    b.globalAlpha = 1;
    // braseiros com chama roxa
    for (const x of [12, 228]) {
      b.fillStyle = "#1a1226";
      b.fillRect(x - 3, 60, 6, 26);
      b.fillRect(x - 6, 58, 12, 4);
      for (let i = 0; i < 6; i++) {
        const h = 6 + Math.sin(t / 90 + i * 2 + x) * 3;
        b.fillStyle = i % 2 ? "#c04dff" : "#ff8af5";
        b.fillRect(x - 4 + i * 1.5, 58 - h, 2, h);
      }
      if (Math.random() < 0.15) particula({ x: x + (Math.random() - 0.5) * 6, y: 50, vy: -0.4, cor: "#d27bff", decai: 0.03 });
    }
    if (escurecer > 0) {
      b.fillStyle = `rgba(4, 0, 12, ${escurecer})`;
      b.fillRect(0, 0, LARGURA, ALTURA);
    }
  }

  // ---------- Herói ----------

  function desenharHeroi(t, info) {
    const { dx = 0, alfa = 1, vermelho = 0 } = info;
    const x = PLAYER.x + dx;
    const y = PLAYER.y;
    b.fillStyle = "rgba(0, 0, 0, 0.4)";
    b.beginPath();
    b.ellipse(x, y, 11, 3, 0, 0, Math.PI * 2);
    b.fill();
    b.save();
    b.globalAlpha = alfa;
    b.translate(Math.round(x), Math.round(y + Math.sin(t / 400)));
    b.scale(-1, 1); // o desenho olha pra esquerda; o herói encara o dragão
    for (const img of camadas) {
      if (img.complete && img.naturalWidth > 0) b.drawImage(img, -18, -36, 36, 36);
    }
    b.restore();
    if (vermelho > 0) {
      b.fillStyle = `rgba(255, 40, 70, ${vermelho * 0.6})`;
      b.fillRect(x - 10, y - 32, 20, 32);
    }
  }

  function desenharEscudo(t, forca) {
    if (forca <= 0) return;
    const pulso = 0.5 + 0.5 * Math.sin(t / 160);
    b.save();
    b.globalCompositeOperation = "lighter";
    b.fillStyle = `rgba(63, 242, 255, ${0.12 * forca})`;
    b.beginPath();
    b.ellipse(PLAYER.x, PLAYER.y - 17, 20, 22, 0, 0, Math.PI * 2);
    b.fill();
    b.strokeStyle = `rgba(63, 242, 255, ${(0.5 + pulso * 0.4) * forca})`;
    b.lineWidth = 1;
    b.stroke();
    b.fillStyle = `rgba(190, 255, 255, ${0.8 * forca})`;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + t / 900;
      b.fillRect(Math.round(PLAYER.x + Math.cos(a) * 20), Math.round(PLAYER.y - 17 + Math.sin(a) * 22), 1, 1);
    }
    b.restore();
  }

  // ---------- Quadro ----------

  function desenhar(agora) {
    const s = estado.estado;
    const t = agora;
    const decorrido = agora - inicioEstado;
    const fase = estado.fase;
    const furiaBase = fase === 2 ? 1 : 0;
    const info = { furia: furiaBase };
    const heroi = {};
    let escurecer = 0;
    let forcaEscudo = estado.escudo ? 1 : 0;

    // carga do sopro (0 a 1) enquanto o temporizador corre
    const carga = s === "charging" && estado.inicioCarga ? limitar((agora - estado.inicioCarga) / estado.prazoMs) : 0;

    if (s === "charging") {
      info.mandibula = 0.15 + carga * 0.6;
      info.brilhoBoca = carga;
      escurecer = 0.15 + carga * 0.35;
    }

    if (s === "attacking") {
      const p = decorrido / DURACOES.attacking;
      info.mandibula = 0.9;
      info.brilhoBoca = 1;
      info.recuo = p < 0.15 ? p * 20 : 3;
      escurecer = 0.35 * (1 - p);
      if (p > 0.18 && p < 0.75) tremor = Math.max(tremor, 3.5);
      if (p > 0.3 && p < 0.8) heroi.vermelho = 0.5 + 0.5 * Math.sin(agora / 40);
      heroi.dx = p > 0.3 ? -Math.sin(limitar((p - 0.3) * 3) * Math.PI) * 6 : 0;
      forcaEscudo = 0;
    }

    if (s === "hit") {
      const p = decorrido / DURACOES.hit;
      forcaEscudo = 1;
      const impacto = limitar((p - 0.5) / 0.4);
      if (p > 0.5) {
        info.flash = 1 - impacto;
        info.recuo = Math.sin(impacto * Math.PI) * 8;
        info.mandibula = 0.5 * (1 - impacto);
        if (p < 0.65) tremor = Math.max(tremor, 2);
      }
    }

    if (s === "furia") {
      const p = decorrido / DURACOES.furia;
      info.furia = suave(limitar(p * 1.5));
      info.ergue = Math.sin(limitar(p * 1.3) * Math.PI);
      info.mandibula = Math.sin(limitar(p * 1.3) * Math.PI);
      info.asa = 1;
      if (p > 0.15 && p < 0.7) tremor = Math.max(tremor, 3);
      escurecer = 0.25 * Math.sin(p * Math.PI);
    }

    if (s === "victory") {
      const p = limitar(decorrido / 2200);
      info.afunda = p * 18;
      info.alfa = 1 - suave(p);
      info.flash = p < 0.3 ? 0.5 * (1 - p / 0.3) : 0;
      info.mandibula = 0.6;
    }

    if (s === "defeat") {
      heroi.alfa = 0.35;
      info.mandibula = 0.3 + 0.2 * Math.sin(agora / 120); // risada
    }

    desenharArena(t, escurecer);
    desenharDragao(t, info);
    const { boca, ax, ay } = pose(t, info);

    // fumaça e faíscas passivas
    // fumaça das narinas em baforadas (direção e tamanho variados — com
    // direção fixa as partículas formavam um traço reto)
    if (s !== "victory" && Math.random() < 0.12) {
      particula({
        x: boca.x + 1 + Math.random() * 2,
        y: boca.y - 4,
        vx: -0.35 + Math.random() * 0.4,
        vy: -0.15 - Math.random() * 0.35,
        cor: Math.random() < 0.5 ? "rgba(170, 140, 200, 0.7)" : "rgba(120, 90, 160, 0.6)",
        tam: Math.random() < 0.5 ? 2 : 3,
        decai: 0.02 + Math.random() * 0.015,
      });
    }
    if (s !== "victory" && Math.random() < 0.2 + furiaBase * 0.3) {
      particula({ x: ax - 20 + Math.random() * 50, y: ay - 30 - Math.random() * 20, vy: -0.5 - Math.random() * 0.4, cor: Math.random() < 0.5 ? "#ff6ef2" : "#b04dff", decai: 0.02 });
    }

    // carga: partículas sendo sugadas pra boca
    if (s === "charging" && Math.random() < 0.3 + carga * 0.7) {
      const a = Math.random() * Math.PI * 2;
      const r = 26 + Math.random() * 16;
      particula({ x: boca.x + Math.cos(a) * r, y: boca.y + Math.sin(a) * r, alvo: boca, cor: Math.random() < 0.5 ? C.soproNucleo : C.sopro, decai: 0.025 });
    }

    // brilho da boca (por cima do escuro)
    if (s === "charging" || s === "attacking") {
      const forca = s === "charging" ? carga : 1;
      b.save();
      b.globalCompositeOperation = "lighter";
      for (let i = 3; i >= 1; i--) {
        b.fillStyle = `rgba(255, 90, 240, ${0.12 * forca})`;
        b.beginPath();
        b.arc(boca.x, boca.y, (2 + forca * 6) * i * 0.7 + Math.sin(agora / 60) * 0.6, 0, Math.PI * 2);
        b.fill();
      }
      b.restore();
    }

    // contra-ataque: estrela de energia ciano viajando até o dragão
    if (s === "hit") {
      const p = decorrido / DURACOES.hit;
      const voo = limitar((p - 0.2) / 0.3);
      if (voo > 0 && voo < 1) {
        const ini = { x: PLAYER.x + 12, y: PLAYER.y - 20 };
        const fim = { x: ax - 4, y: ay - 26 };
        const x = ini.x + (fim.x - ini.x) * voo;
        const y = ini.y + (fim.y - ini.y) * voo - Math.sin(voo * Math.PI) * 14;
        particula({ x, y, cor: C.escudo, tam: 2, decai: 0.06 });
        b.fillStyle = "#ffffff";
        b.fillRect(Math.round(x) - 3, Math.round(y), 7, 1);
        b.fillRect(Math.round(x), Math.round(y) - 3, 1, 7);
        b.fillStyle = C.escudo;
        b.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 3);
      }
      if (p > 0.5 && p < 0.53) {
        for (let i = 0; i < 14; i++) {
          particula({ x: ax - 4, y: ay - 26, vx: (Math.random() - 0.3) * 2, vy: (Math.random() - 0.7) * 2, cor: i % 2 ? "#ffffff" : C.escudo, decai: 0.03 });
        }
      }
    }

    // SOPRO DE LOOP INFINITO: feixe da boca até o herói
    if (s === "attacking") {
      const p = decorrido / DURACOES.attacking;
      const ativo = p > 0.15 && p < 0.8;
      if (ativo) {
        const alvo = { x: PLAYER.x + 4, y: PLAYER.y - 18 };
        const larg = 5 + Math.sin(agora / 30) * 1.5;
        const passos = 24;
        for (let i = 0; i <= passos; i++) {
          const f = i / passos;
          const x = boca.x + (alvo.x - boca.x) * f;
          const y = boca.y + (alvo.y - boca.y) * f + Math.sin(f * 12 - agora / 40) * 1.5;
          b.fillStyle = `rgba(176, 38, 255, 0.7)`;
          b.fillRect(Math.round(x - larg), Math.round(y - larg / 2), Math.ceil(larg * 2), Math.ceil(larg));
          b.fillStyle = C.soproNucleo;
          b.fillRect(Math.round(x - 2), Math.round(y - 2), 4, 3);
          b.fillStyle = "#ffffff";
          b.fillRect(Math.round(x), Math.round(y - 1), 2, 1);
        }
        // "código" voando dentro do feixe: { } ; ( )
        for (let i = 0; i < 6; i++) {
          const f = ((agora / 500 + i / 6) % 1);
          const x = boca.x + (alvo.x - boca.x) * f;
          const y = boca.y + (alvo.y - boca.y) * f - 4 + (i % 2) * 8;
          b.fillStyle = "#ffe6ff";
          b.fillRect(Math.round(x), Math.round(y), 1, 3);
          b.fillRect(Math.round(x) + (i % 2 ? 1 : -1), Math.round(y) + 1, 1, 1);
        }
        if (Math.random() < 0.8) {
          particula({ x: alvo.x, y: alvo.y, vx: -Math.random() * 2, vy: (Math.random() - 0.5) * 2.5, cor: Math.random() < 0.5 ? C.soproNucleo : "#ffffff", decai: 0.04 });
        }
      }
      // estilhaços do escudo quebrando no começo do impacto
      if (p > 0.2 && p < 0.23 && fimEscudoQuebrado < agora) {
        fimEscudoQuebrado = agora + 500;
        for (let i = 0; i < 16; i++) {
          const a = (i / 16) * Math.PI * 2;
          particula({ x: PLAYER.x + Math.cos(a) * 18, y: PLAYER.y - 17 + Math.sin(a) * 20, vx: Math.cos(a) * 1.5, vy: Math.sin(a) * 1.5, cor: C.escudo, decai: 0.03 });
        }
      }
    }

    // fúria: rugido com anéis de choque
    if (s === "furia") {
      const p = decorrido / DURACOES.furia;
      if (p > 0.15 && p < 0.7) {
        const r = ((agora / 8) % 60) + 6;
        b.strokeStyle = `rgba(255, 80, 200, ${1 - r / 66})`;
        b.lineWidth = 1;
        b.beginPath();
        b.ellipse(boca.x, boca.y, r, r * 0.7, 0, 0, Math.PI * 2);
        b.stroke();
      }
    }

    // vitória: o dragão explode em faíscas
    if (s === "victory" && decorrido < 1500 && Math.random() < 0.9) {
      particula({ x: ax - 30 + Math.random() * 80, y: ay - 60 + Math.random() * 60, vy: -0.8 - Math.random(), vx: (Math.random() - 0.5), cor: Math.random() < 0.5 ? "#ff6ef2" : "#ffd75e", decai: 0.015 });
    }

    desenharEscudo(t, forcaEscudo);
    desenharHeroi(t, heroi);

    // partículas
    for (let i = particulas.length - 1; i >= 0; i--) {
      const q = particulas[i];
      if (q.alvo) {
        q.x += (q.alvo.x - q.x) * 0.12;
        q.y += (q.alvo.y - q.y) * 0.12;
      } else {
        q.vx += q.ax;
        q.vy += q.ay;
        q.x += q.vx;
        q.y += q.vy;
      }
      q.vida -= q.decai;
      if (q.vida <= 0) {
        particulas.splice(i, 1);
        continue;
      }
      b.globalAlpha = limitar(q.vida);
      b.fillStyle = q.cor;
      b.fillRect(Math.round(q.x), Math.round(q.y), q.tam, q.tam);
    }
    b.globalAlpha = 1;

    // buffer -> tela, ampliado sem suavização, com screen shake
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const escala = Math.min(canvas.width / LARGURA, canvas.height / ALTURA);
    const largura = LARGURA * escala;
    const altura = ALTURA * escala;
    const tx = (canvas.width - largura) / 2 + (Math.random() - 0.5) * tremor * escala;
    const ty = (canvas.height - altura) / 2 + (Math.random() - 0.5) * tremor * escala;
    ctx.drawImage(buffer, Math.round(tx), Math.round(ty), Math.round(largura), Math.round(altura));
    tremor *= 0.86;
  }

  function laco(agora) {
    desenhar(agora);
    quadro = requestAnimationFrame(laco);
  }

  const observador = new ResizeObserver(ajustarTamanho);
  observador.observe(canvas);
  ajustarTamanho();
  quadro = requestAnimationFrame(laco);

  return {
    // novo estado da batalha: { estado, fase, escudo, inicioCarga, prazoMs }
    atualizar(novo) {
      if (novo.estado !== estado.estado) inicioEstado = performance.now();
      estado = { ...estado, ...novo };
    },
    destruir() {
      cancelAnimationFrame(quadro);
      observador.disconnect();
    },
  };
}
