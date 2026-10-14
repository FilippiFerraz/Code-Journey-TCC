// Cena isométrica (2.5D) do Desafio da Cachoeira de Cristais, desenhada num
// <canvas> em estilo pixel art: pontes de pedra em blocos, água animada, a
// cachoeira ao fundo, o Cristal Gigante e as entidades (herói, besouros,
// aranhas). Não sabe nada de regras: só desenha os estados que o
// interpretador gerou (ver interpretador.js), animando a passagem de um
// estado pro seguinte.

const TW = 64; // largura do losango de uma casa
const TH = 32; // altura do losango
const ALT = 16; // altura da lateral do bloco de pedra
const TOPO = 120; // espaço acima da primeira linha (cristal, cachoeira)
const MARGEM = 24;
const TAMANHO_HEROI = 52;

const CORES = {
  fundoTopo: "#0b1026",
  fundoBase: "#1b2b4a",
  agua: "#1d4f9c",
  aguaClara: "#4f9de8",
  aguaEscura: "#123769",
  pedraTopo: "#959cad",
  pedraJunta: "#767d8f",
  pedraEsq: "#5f6576",
  pedraDir: "#474c5c",
  musgo: "#4f8a4a",
  cristal: "#9b6cf0",
  cristalClaro: "#d9c6ff",
  cristalEscuro: "#5a2fb8",
  besouro: "#2f8a63",
  besouroEscuro: "#1b5a3f",
  aranha: "#3a1650",
  aranhaClara: "#6b2f8f",
  seta: "#ffd75e",
};

function suavizar(t) {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}

// pseudoaleatório fixo por casa (decoração sempre igual)
function ruido(x, y) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

// Direção do herói na tela: o desenho olha pra esquerda, então "norte" e
// "leste" (que apontam pra direita na projeção) espelham o sprite.
const ESPELHA = { norte: true, leste: true, sul: false, oeste: false };
const VETOR = { norte: [0, -1], leste: [1, 0], sul: [0, 1], oeste: [-1, 0] };

export function medidasCena(cenario) {
  const { largura, altura } = cenario;
  return {
    largura: (largura + altura) * (TW / 2) + MARGEM * 2,
    altura: (largura + altura) * (TH / 2) + ALT + TOPO + MARGEM,
  };
}

export function criarCena(canvas, cenario, { camadas = [] } = {}) {
  const ctx = canvas.getContext("2d");
  const medidas = medidasCena(cenario);
  const ox = cenario.altura * (TW / 2) + MARGEM;
  const oy = TOPO;

  // Projeção: centro do topo da casa (x, y) na tela lógica.
  const tela = (x, y) => ({ sx: ox + (x - y) * (TW / 2), sy: oy + (x + y) * (TH / 2) + TH / 2 });

  let escala = 1;
  let desvioX = 0;
  let desvioY = 0;
  let quadro = 0;
  let animacao = null; // { de, para, info, inicio, duracao }
  let estadoParado = null;
  let efeitoFinal = null; // { tipo: "vitoria" | "erro", inicio, info }
  const particulas = [];

  function ajustarTamanho() {
    const caixa = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(caixa.width * dpr));
    canvas.height = Math.max(1, Math.round(caixa.height * dpr));
    escala = Math.min(canvas.width / medidas.largura, canvas.height / medidas.altura);
    desvioX = (canvas.width - medidas.largura * escala) / 2;
    desvioY = (canvas.height - medidas.altura * escala) / 2;
  }

  // ---------- Cenário ----------

  function desenharFundo(tempo) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
    g.addColorStop(0, CORES.fundoTopo);
    g.addColorStop(1, CORES.fundoBase);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.setTransform(escala, 0, 0, escala, desvioX, desvioY);
    // paredão de pedra e a cachoeira caindo atrás do tabuleiro
    const cx = ox + (cenario.largura - cenario.altura) * (TW / 4) - 70;
    ctx.fillStyle = "#151c33";
    ctx.fillRect(cx - 60, 0, 220, TOPO + 30);
    ctx.fillStyle = "#1f2a47";
    for (let i = 0; i < 9; i++) ctx.fillRect(cx - 60 + ((i * 37) % 210), (i * 23) % (TOPO - 10), 18, 10);
    const larguraQueda = 46;
    ctx.fillStyle = "#3d8fe0";
    ctx.fillRect(cx, 0, larguraQueda, TOPO + 24);
    ctx.fillStyle = "#9fd6ff";
    for (let i = 0; i < 7; i++) {
      const y = (tempo * 0.12 + i * 23) % (TOPO + 24);
      ctx.fillRect(cx + 4 + ((i * 13) % (larguraQueda - 10)), y, 3, 12);
    }
    // névoa no pé da cachoeira
    ctx.fillStyle = "rgba(220, 240, 255, 0.18)";
    for (let i = 0; i < 4; i++) {
      const r = 14 + 4 * Math.sin(tempo / 400 + i);
      ctx.beginPath();
      ctx.ellipse(cx + larguraQueda / 2 + (i - 1.5) * 18, TOPO + 22, r, r / 2.2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function losango(sx, sy) {
    ctx.beginPath();
    ctx.moveTo(sx, sy - TH / 2);
    ctx.lineTo(sx + TW / 2, sy);
    ctx.lineTo(sx, sy + TH / 2);
    ctx.lineTo(sx - TW / 2, sy);
    ctx.closePath();
  }

  function desenharAgua(x, y, tempo) {
    const { sx, sy } = tela(x, y);
    const nivel = sy + ALT;
    losango(sx, nivel);
    ctx.fillStyle = CORES.agua;
    ctx.fill();
    ctx.fillStyle = CORES.aguaClara;
    for (let i = 0; i < 2; i++) {
      const fase = (tempo / 900 + ruido(x, y) + i * 0.5) % 1;
      ctx.globalAlpha = Math.sin(fase * Math.PI) * 0.8;
      ctx.fillRect(Math.round(sx - 12 + i * 10 + fase * 8), Math.round(nivel - 5 + i * 7), 10, 2);
    }
    ctx.globalAlpha = 1;
    // cristais energizados brotando de algumas casas de água
    if (ruido(x, y) > 0.78) {
      const brilho = 0.6 + 0.4 * Math.sin(tempo / 500 + x + y);
      ctx.fillStyle = CORES.cristalEscuro;
      ctx.fillRect(sx - 8, nivel - 14, 6, 14);
      ctx.fillStyle = CORES.cristal;
      ctx.globalAlpha = brilho;
      ctx.fillRect(sx - 2, nivel - 20, 6, 20);
      ctx.fillStyle = CORES.cristalClaro;
      ctx.fillRect(sx - 1, nivel - 18, 2, 8);
      ctx.globalAlpha = 1;
    }
  }

  function desenharPonte(x, y, tipo, tempo) {
    const { sx, sy } = tela(x, y);
    // laterais do bloco
    ctx.fillStyle = CORES.pedraEsq;
    ctx.beginPath();
    ctx.moveTo(sx - TW / 2, sy);
    ctx.lineTo(sx, sy + TH / 2);
    ctx.lineTo(sx, sy + TH / 2 + ALT);
    ctx.lineTo(sx - TW / 2, sy + ALT);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = CORES.pedraDir;
    ctx.beginPath();
    ctx.moveTo(sx + TW / 2, sy);
    ctx.lineTo(sx, sy + TH / 2);
    ctx.lineTo(sx, sy + TH / 2 + ALT);
    ctx.lineTo(sx + TW / 2, sy + ALT);
    ctx.closePath();
    ctx.fill();
    // topo
    losango(sx, sy);
    ctx.fillStyle = CORES.pedraTopo;
    ctx.fill();
    ctx.strokeStyle = CORES.pedraJunta;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx - TW / 4, sy - TH / 4);
    ctx.lineTo(sx + TW / 4, sy + TH / 4);
    ctx.moveTo(sx + TW / 4, sy - TH / 4);
    ctx.lineTo(sx - TW / 4, sy + TH / 4);
    ctx.stroke();
    if (ruido(y, x) > 0.6) {
      ctx.fillStyle = CORES.musgo;
      ctx.fillRect(sx - 20 + ruido(x, y) * 30, sy + 2, 4, 2);
    }
    // círculo de runas no início e no altar do cristal
    if (tipo === "P" || tipo === "C") {
      ctx.strokeStyle = tipo === "C" ? `rgba(190, 140, 255, ${0.5 + 0.3 * Math.sin(tempo / 300)})` : "rgba(255, 215, 94, 0.55)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(sx, sy, TW / 3, TH / 3, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // ---------- Entidades ----------

  function desenharSombra(sx, sy, largura) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.beginPath();
    ctx.ellipse(sx, sy + 2, largura, largura / 2.6, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function desenharCristal(x, y, tempo, explosao) {
    const { sx, sy } = tela(x, y);
    const pulso = 0.5 + 0.5 * Math.sin(tempo / 350);
    const flutua = Math.sin(tempo / 600) * 3;
    const base = sy - 8 + flutua;
    ctx.save();
    ctx.shadowColor = CORES.cristal;
    ctx.shadowBlur = 14 + pulso * 12 + explosao * 40;
    // face esquerda
    ctx.fillStyle = CORES.cristalEscuro;
    ctx.beginPath();
    ctx.moveTo(sx, base - 74);
    ctx.lineTo(sx - 16, base - 52);
    ctx.lineTo(sx - 16, base - 14);
    ctx.lineTo(sx, base);
    ctx.closePath();
    ctx.fill();
    // face direita
    ctx.fillStyle = CORES.cristal;
    ctx.beginPath();
    ctx.moveTo(sx, base - 74);
    ctx.lineTo(sx + 16, base - 52);
    ctx.lineTo(sx + 16, base - 14);
    ctx.lineTo(sx, base);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // brilhos
    ctx.fillStyle = CORES.cristalClaro;
    ctx.fillRect(sx + 4, base - 58, 3, 26);
    ctx.fillRect(sx - 10, base - 44, 2, 14);
    for (let i = 0; i < 3; i++) {
      const a = tempo / 700 + (i * Math.PI * 2) / 3;
      ctx.globalAlpha = 0.5 + 0.5 * Math.sin(tempo / 200 + i);
      ctx.fillRect(Math.round(sx + Math.cos(a) * 26), Math.round(base - 40 + Math.sin(a) * 10), 3, 3);
    }
    ctx.globalAlpha = 1;
  }

  function desenharBesouro(sx, sy, tempo, alfa, escalaMorte) {
    const bob = Math.sin(tempo / 180 + sx) * 1.5;
    ctx.save();
    ctx.globalAlpha = alfa;
    ctx.translate(sx, sy - 9 + bob);
    ctx.scale(escalaMorte, escalaMorte);
    ctx.strokeStyle = "#0b0f0d";
    ctx.lineWidth = 2;
    for (const lado of [-1, 1]) {
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 7, 0);
        ctx.lineTo(i * 9, lado * 11 + Math.sin(tempo / 90 + i) * 1.5);
        ctx.stroke();
      }
    }
    ctx.fillStyle = CORES.besouroEscuro;
    ctx.beginPath();
    ctx.ellipse(0, 0, 15, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = CORES.besouro;
    ctx.beginPath();
    ctx.ellipse(-1, -2, 13, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = CORES.besouroEscuro;
    ctx.fillRect(-1, -9, 2, 15);
    ctx.fillStyle = "#b6f5d2";
    ctx.fillRect(-8, -6, 4, 2);
    ctx.fillStyle = "#0b0f0d";
    ctx.beginPath();
    ctx.arc(-15, -1, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ff5a5a";
    ctx.fillRect(-18, -3, 2, 2);
    ctx.restore();
  }

  function desenharAranha(sx, sy, tempo, alfa, escalaMorte, bote) {
    ctx.save();
    ctx.globalAlpha = alfa;
    ctx.translate(sx + bote.dx, sy - 12 + bote.dy);
    ctx.scale(escalaMorte, escalaMorte);
    ctx.strokeStyle = "#140818";
    ctx.lineWidth = 2;
    for (const lado of [-1, 1]) {
      for (let i = 0; i < 4; i++) {
        const mexe = Math.sin(tempo / 140 + i * 1.3) * 2;
        const ang = (-0.9 + i * 0.6) * lado;
        ctx.beginPath();
        ctx.moveTo(0, 2);
        ctx.lineTo(lado * 12 + Math.sin(ang) * 3, -6 + i * 4 + mexe);
        ctx.lineTo(lado * 18, 6 + i * 3);
        ctx.stroke();
      }
    }
    ctx.fillStyle = CORES.aranha;
    ctx.beginPath();
    ctx.arc(0, 4, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = CORES.aranhaClara;
    ctx.beginPath();
    ctx.arc(0, -6, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#33ff99"; // marca de código nas costas
    ctx.fillRect(-4, 2, 2, 2);
    ctx.fillRect(2, 2, 2, 2);
    ctx.fillRect(-1, 6, 2, 2);
    ctx.fillStyle = "#ff3355";
    ctx.fillRect(-4, -8, 2, 2);
    ctx.fillRect(2, -8, 2, 2);
    ctx.restore();
  }

  function desenharHeroi(sx, sy, direcao, extra) {
    const { mergulho = 0, alfa = 1, pulo = 0 } = extra;
    // seta no chão mostrando pra onde o herói está virado
    const [vx, vy] = VETOR[direcao];
    const alvo = { sx: sx + (vx - vy) * (TW / 2) * 0.42, sy: sy + (vx + vy) * (TH / 2) * 0.42 };
    ctx.fillStyle = CORES.seta;
    ctx.globalAlpha = 0.9 * alfa;
    ctx.beginPath();
    const ang = Math.atan2(alvo.sy - sy, alvo.sx - sx);
    ctx.moveTo(alvo.sx + Math.cos(ang) * 7, alvo.sy + Math.sin(ang) * 7);
    ctx.lineTo(alvo.sx + Math.cos(ang + 2.4) * 6, alvo.sy + Math.sin(ang + 2.4) * 6);
    ctx.lineTo(alvo.sx + Math.cos(ang - 2.4) * 6, alvo.sy + Math.sin(ang - 2.4) * 6);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;

    if (mergulho < 0.6) desenharSombra(sx, sy, 15);
    ctx.save();
    ctx.globalAlpha = alfa;
    ctx.translate(Math.round(sx), Math.round(sy + mergulho * 26 - pulo));
    if (ESPELHA[direcao]) ctx.scale(-1, 1);
    const metade = TAMANHO_HEROI / 2;
    for (const imagem of camadas) {
      if (imagem.complete && imagem.naturalWidth > 0) {
        ctx.drawImage(imagem, -metade, -TAMANHO_HEROI + 6, TAMANHO_HEROI, TAMANHO_HEROI);
      }
    }
    ctx.restore();
  }

  // ---------- Quadro ----------

  function interpolar(de, para, t) {
    return de + (para - de) * t;
  }

  function desenhar(tempo) {
    desenharFundo(tempo);
    ctx.setTransform(escala, 0, 0, escala, desvioX, desvioY);
    ctx.imageSmoothingEnabled = false;

    const agora = animacao;
    const t = agora ? Math.min((tempo - agora.inicio) / agora.duracao, 1) : 1;
    const ts = suavizar(t);
    const de = agora ? agora.de : estadoParado;
    const para = agora ? agora.para : estadoParado;
    const info = agora?.info ?? {};
    if (!para) return;

    // casas: de trás pra frente
    for (let soma = 0; soma <= cenario.largura + cenario.altura - 2; soma++) {
      for (let x = 0; x <= soma; x++) {
        const y = soma - x;
        if (x >= cenario.largura || y >= cenario.altura) continue;
        const c = cenario.casas[y][x];
        if (c === "~") desenharAgua(x, y, tempo);
        else desenharPonte(x, y, c, tempo);
      }
    }

    // entidades ordenadas pela profundidade (x + y)
    const entidades = [];
    const explosao = efeitoFinal?.tipo === "vitoria" ? Math.min((tempo - efeitoFinal.inicio) / 600, 1) : 0;
    entidades.push({ prof: cenario.cristal.x + cenario.cristal.y - 0.1, desenhar: () => desenharCristal(cenario.cristal.x, cenario.cristal.y, tempo, explosao) });

    for (const inimigoPara of para.inimigos) {
      const inimigoDe = de.inimigos.find((i) => i.id === inimigoPara.id) ?? inimigoPara;
      if (!inimigoDe.vivo && !inimigoPara.vivo) continue;
      const morrendo = inimigoDe.vivo && !inimigoPara.vivo;
      const x = interpolar(inimigoDe.x, inimigoPara.x, ts);
      const y = interpolar(inimigoDe.y, inimigoPara.y, ts);
      const { sx, sy } = tela(x, y);
      const alfa = morrendo ? Math.max(0, 1 - t * 1.4) : 1;
      const escalaMorte = morrendo ? 1 + t * 0.6 : 1;
      let bote = { dx: 0, dy: 0 };
      if (info.erro === "mordida" && info.alvo && inimigoPara.x === info.alvo.x && inimigoPara.y === info.alvo.y) {
        const j = tela(para.jogador.x, para.jogador.y);
        const f = Math.sin(Math.min(t * 2, 1) * Math.PI) * 0.45;
        bote = { dx: (j.sx - sx) * f, dy: (j.sy - sy) * f };
      }
      entidades.push({
        prof: x + y,
        desenhar: () => {
          if (!morrendo) desenharSombra(sx + bote.dx, sy + bote.dy, 13);
          if (inimigoPara.tipo === "besouro") desenharBesouro(sx, sy, tempo, alfa, escalaMorte);
          else desenharAranha(sx, sy, tempo, alfa, escalaMorte, bote);
        },
      });
    }

    // herói
    const jDe = de.jogador;
    const jPara = para.jogador;
    let hx = interpolar(jDe.x, jPara.x, ts);
    let hy = interpolar(jDe.y, jPara.y, ts);
    const extra = {};
    if (info.acao === "erro" && (info.erro === "besouro" || info.erro === "aranha") && info.alvo) {
      // avança metade do caminho e é empurrado de volta
      const f = Math.sin(t * Math.PI) * 0.45;
      hx = jPara.x + (info.alvo.x - jPara.x) * f;
      hy = jPara.y + (info.alvo.y - jPara.y) * f;
    }
    if (info.acao === "erro" && (info.erro === "agua" || info.erro === "fora")) {
      extra.mergulho = Math.max(0, (t - 0.5) * 2);
      extra.alfa = 1 - extra.mergulho * 0.9;
      hx = interpolar(jDe.x, jPara.x, Math.min(ts * 1.6, 1));
      hy = interpolar(jDe.y, jPara.y, Math.min(ts * 1.6, 1));
    }
    if (info.acao === "atacar") {
      const [vx, vy] = VETOR[jPara.direcao];
      const f = Math.sin(t * Math.PI) * 0.22;
      hx += vx * f;
      hy += vy * f;
    }
    if (info.acao === "mover") extra.pulo = Math.sin(t * Math.PI) * 5;
    const direcao = t < 0.5 ? jDe.direcao : jPara.direcao;
    const posHeroi = tela(hx, hy);
    entidades.push({ prof: hx + hy + 0.05, desenhar: () => desenharHeroi(posHeroi.sx, posHeroi.sy, direcao, extra) });

    entidades.sort((a, b) => a.prof - b.prof).forEach((e) => e.desenhar());

    // golpe da espada
    if (info.acao === "atacar" && info.alvo && t < 1) {
      const { sx, sy } = tela(info.alvo.x, info.alvo.y);
      ctx.strokeStyle = `rgba(255, 245, 200, ${1 - t})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(sx, sy - 14, 16, -2.4 + t * 1.2, -0.6 + t * 1.2);
      ctx.stroke();
      if (info.acertou && t > 0.3 && !agora.particulasCriadas) {
        agora.particulasCriadas = true;
        for (let i = 0; i < 12; i++) {
          particulas.push({ x: sx, y: sy - 12, vx: (Math.random() - 0.5) * 3, vy: -Math.random() * 3, vida: 1, cor: i % 2 ? "#33ff99" : "#ffffff" });
        }
      }
    }

    // partículas (inimigo derrotado, vitória)
    for (let i = particulas.length - 1; i >= 0; i--) {
      const p = particulas[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.12;
      p.vida -= 0.025;
      if (p.vida <= 0) {
        particulas.splice(i, 1);
        continue;
      }
      ctx.globalAlpha = p.vida;
      ctx.fillStyle = p.cor;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 3, 3);
    }
    ctx.globalAlpha = 1;

    // erro: "!" vermelho sobre o herói e a tela piscando
    if (efeitoFinal?.tipo === "erro") {
      const decorrido = (tempo - efeitoFinal.inicio) / 1000;
      const { sx, sy } = tela(jPara.x, jPara.y);
      ctx.fillStyle = "#ff4d6d";
      ctx.fillRect(sx - 3, sy - 84, 6, 16);
      ctx.fillRect(sx - 3, sy - 64, 6, 6);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = `rgba(255, 40, 80, ${Math.max(0, 0.28 - decorrido * 0.3)})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  function laco(tempo) {
    desenhar(tempo);
    quadro = requestAnimationFrame(laco);
  }

  const observador = new ResizeObserver(ajustarTamanho);
  observador.observe(canvas);
  ajustarTamanho();
  quadro = requestAnimationFrame(laco);

  return {
    // Mostra um estado parado (antes de executar, ou depois de resetar).
    mostrar(estado) {
      animacao = null;
      efeitoFinal = null;
      particulas.length = 0;
      estadoParado = estado;
    },
    // Anima de um estado pro outro; info = o quadro do interpretador.
    animar(de, para, info, duracao) {
      animacao = { de, para, info, inicio: performance.now(), duracao };
      estadoParado = para;
    },
    vitoria() {
      efeitoFinal = { tipo: "vitoria", inicio: performance.now() };
      const { sx, sy } = tela(cenario.cristal.x, cenario.cristal.y);
      for (let i = 0; i < 40; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = 1 + Math.random() * 3;
        particulas.push({ x: sx, y: sy - 40, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1, vida: 1.4, cor: i % 3 ? CORES.cristalClaro : CORES.seta });
      }
    },
    erro() {
      efeitoFinal = { tipo: "erro", inicio: performance.now() };
    },
    destruir() {
      cancelAnimationFrame(quadro);
      observador.disconnect();
    },
  };
}
