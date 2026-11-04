// Motor do minijogo do Desafio do Rei ("Torres do Vento"), estilo Flappy
// Bird: o personagem voa com as Asas do Vento entre pares de torres de
// pedra até chegar ao portão do castelo. Tudo desenhado num <canvas>, sem
// React — a tela (DesafioRei.jsx) só recebe os eventos (passou de torre,
// caiu, venceu) e desenha os menus por cima.
//
// As medidas são de um mundo lógico fixo de LARGURA x ALTURA; o canvas é
// ampliado pra caber na tela mantendo a proporção, então a dificuldade é a
// mesma em qualquer aparelho.

export const LARGURA = 360;
export const ALTURA = 640;
export const TOTAL_TORRES = 12;

const CHAO = ALTURA - 56; // topo do chão
const GRAVIDADE = 1350; // px/s²
const IMPULSO = -390; // velocidade vertical ao bater as asas
const VELOCIDADE_MAXIMA_QUEDA = 560;
const VELOCIDADE = 140; // px/s com que o cenário anda
const DISTANCIA_TORRES = 215;
const LARGURA_TORRE = 62;
// O vão entre as torres fecha um pouco a cada torre: da primeira à última.
const VAO_INICIAL = 182;
const VAO_FINAL = 148;
const MARGEM_VAO = 72; // distância mínima do vão até o teto e o chão
const VARIACAO_MAXIMA_VAO = 170; // quanto o centro do vão muda de uma torre pra outra

const JOGADOR_X = 96;
const TAMANHO_SPRITE = 54;
// Caixa de colisão menor que o desenho — perdoa encostar de raspão.
const RAIO_COLISAO = 13;

const PASSO = 1 / 120; // física em passo fixo: igual em telas de 60 e 144 Hz

function aleatorio(min, max) {
  return min + Math.random() * (max - min);
}

function gerarTorres() {
  const torres = [];
  let centroAnterior = (MARGEM_VAO + CHAO - MARGEM_VAO) / 2;
  for (let i = 0; i < TOTAL_TORRES; i++) {
    const vao = VAO_INICIAL + ((VAO_FINAL - VAO_INICIAL) * i) / (TOTAL_TORRES - 1);
    const minimo = Math.max(MARGEM_VAO + vao / 2, centroAnterior - VARIACAO_MAXIMA_VAO);
    const maximo = Math.min(CHAO - MARGEM_VAO - vao / 2, centroAnterior + VARIACAO_MAXIMA_VAO);
    const centro = aleatorio(minimo, maximo);
    torres.push({ x: LARGURA + 120 + i * DISTANCIA_TORRES, topoVao: centro - vao / 2, baseVao: centro + vao / 2, passou: false });
    centroAnterior = centro;
  }
  return torres;
}

function criarEstado() {
  const torres = gerarTorres();
  return {
    fase: "pronto", // pronto | voando | caindo | vitoria | parado
    y: ALTURA * 0.42,
    vy: 0,
    tempo: 0,
    ultimaBatida: -1,
    deslocamento: 0, // quanto o cenário já andou (parallax)
    torres,
    passadas: 0,
    // portão do castelo, logo depois da última torre: cruzá-lo é a vitória
    portaoX: torres[torres.length - 1].x + DISTANCIA_TORRES + 40,
    tempoNoChao: 0,
  };
}

// Colisão entre o círculo do jogador e um retângulo.
function colideRetangulo(cx, cy, raio, x, y, largura, altura) {
  const px = Math.max(x, Math.min(cx, x + largura));
  const py = Math.max(y, Math.min(cy, y + altura));
  return (cx - px) ** 2 + (cy - py) ** 2 < raio * raio;
}

// ---------- Desenho ----------

const CORES = {
  ceuTopo: "#1b1440",
  ceuMeio: "#4b2a7a",
  ceuBase: "#d9805a",
  estrela: "#fff6d5",
  montanhaLonge: "#2c1f4f",
  montanhaPerto: "#21183c",
  nuvem: "rgba(255, 230, 245, 0.22)",
  pedra: "#7a7f93",
  pedraClara: "#a3a8ba",
  pedraEscura: "#4b4f62",
  junta: "#5c6074",
  bandeira: "#7b2fbf",
  bandeiraClara: "#a45ce0",
  grama: "#3d7a35",
  gramaClara: "#5aa04a",
  terra: "#4a3020",
  terraEscura: "#36231a",
  ouro: "#f2c14e",
  asa: "rgba(220, 245, 255, 0.85)",
  asaContorno: "rgba(120, 200, 255, 0.95)",
};

// estrelas fixas (sorteadas uma vez por partida)
function gerarEstrelas() {
  return Array.from({ length: 34 }, () => ({
    x: Math.random() * LARGURA,
    y: Math.random() * ALTURA * 0.45,
    t: Math.random() * Math.PI * 2,
  }));
}

function desenharFundo(ctx, estado, estrelas) {
  const gradiente = ctx.createLinearGradient(0, 0, 0, CHAO);
  gradiente.addColorStop(0, CORES.ceuTopo);
  gradiente.addColorStop(0.55, CORES.ceuMeio);
  gradiente.addColorStop(1, CORES.ceuBase);
  ctx.fillStyle = gradiente;
  ctx.fillRect(0, 0, LARGURA, CHAO);

  for (const estrela of estrelas) {
    ctx.globalAlpha = 0.45 + 0.4 * Math.sin(estado.tempo * 2 + estrela.t);
    ctx.fillStyle = CORES.estrela;
    ctx.fillRect(Math.round(estrela.x), Math.round(estrela.y), 2, 2);
  }
  ctx.globalAlpha = 1;

  // montanhas em duas camadas (parallax): picos em serra, repetidos
  const camadas = [
    { cor: CORES.montanhaLonge, fator: 0.12, base: CHAO - 120, altura: 110, largura: 120 },
    { cor: CORES.montanhaPerto, fator: 0.25, base: CHAO - 40, altura: 90, largura: 90 },
  ];
  for (const camada of camadas) {
    const deslocamento = (estado.deslocamento * camada.fator) % camada.largura;
    ctx.fillStyle = camada.cor;
    ctx.beginPath();
    ctx.moveTo(0, CHAO);
    for (let x = -camada.largura - deslocamento; x <= LARGURA + camada.largura; x += camada.largura) {
      ctx.lineTo(x, camada.base);
      ctx.lineTo(x + camada.largura / 2, camada.base - camada.altura);
      ctx.lineTo(x + camada.largura, camada.base);
    }
    ctx.lineTo(LARGURA, CHAO);
    ctx.closePath();
    ctx.fill();
  }

  // nuvens em blocos
  ctx.fillStyle = CORES.nuvem;
  for (let i = 0; i < 4; i++) {
    const largura = 70 + i * 14;
    const x = ((i * 137 - estado.deslocamento * 0.4) % (LARGURA + 160) + LARGURA + 160) % (LARGURA + 160) - 80;
    const y = 70 + i * 58;
    ctx.fillRect(Math.round(x), y, largura, 12);
    ctx.fillRect(Math.round(x + 14), y - 8, largura - 34, 8);
  }
}

function desenharBlocoPedra(ctx, x, y, largura, altura) {
  ctx.fillStyle = CORES.pedra;
  ctx.fillRect(x, y, largura, altura);
  // juntas dos tijolos, alternando o deslocamento por fileira
  ctx.fillStyle = CORES.junta;
  const linhaTopo = Math.floor(y / 14) * 14;
  for (let linha = linhaTopo; linha < y + altura; linha += 14) {
    if (linha > y) ctx.fillRect(x, linha, largura, 2);
    const desvio = (linha / 14) % 2 === 0 ? 0 : 15;
    for (let coluna = x + desvio; coluna < x + largura; coluna += 30) {
      const topo = Math.max(linha, y);
      const fim = Math.min(linha + 14, y + altura);
      if (fim > topo) ctx.fillRect(coluna, topo, 2, fim - topo);
    }
  }
  // luz na esquerda, sombra na direita
  ctx.fillStyle = CORES.pedraClara;
  ctx.fillRect(x, y, 4, altura);
  ctx.fillStyle = CORES.pedraEscura;
  ctx.fillRect(x + largura - 6, y, 6, altura);
}

// Ameias (o "dente" do alto da muralha) viradas pro vão.
function desenharAmeias(ctx, x, yBorda, paraCima) {
  const alturaBorda = 12;
  const largura = LARGURA_TORRE + 12;
  const xBorda = x - 6;
  const yFaixa = paraCima ? yBorda - alturaBorda : yBorda;
  desenharBlocoPedra(ctx, xBorda, yFaixa, largura, alturaBorda);
  const yDente = paraCima ? yFaixa - 10 : yFaixa + alturaBorda;
  for (let i = 0; i < 4; i++) {
    if (i % 2 === 1) continue;
    ctx.fillStyle = CORES.pedra;
    ctx.fillRect(xBorda + 4 + i * 18, yDente, 14, 10);
    ctx.fillStyle = CORES.pedraEscura;
    ctx.fillRect(xBorda + 14 + i * 18, yDente, 4, 10);
  }
  ctx.fillStyle = CORES.pedra;
  ctx.fillRect(xBorda + largura - 18, yDente, 14, 10);
}

function desenharTorre(ctx, torre, tempo) {
  const x = Math.round(torre.x);
  // torre de cima: desce do teto até o vão
  desenharBlocoPedra(ctx, x, 0, LARGURA_TORRE, Math.round(torre.topoVao) - 12);
  desenharAmeias(ctx, x, Math.round(torre.topoVao) - 12, false);
  // estandarte roxo tremulando na torre de cima
  const balanco = Math.round(Math.sin(tempo * 4 + torre.x * 0.01) * 2);
  ctx.fillStyle = CORES.bandeira;
  ctx.fillRect(x + 20, Math.round(torre.topoVao) - 70, 22, 40);
  ctx.fillStyle = CORES.bandeiraClara;
  ctx.fillRect(x + 20, Math.round(torre.topoVao) - 70, 4, 40);
  ctx.fillStyle = CORES.bandeira;
  ctx.fillRect(x + 20 + balanco, Math.round(torre.topoVao) - 30, 8, 6);
  ctx.fillRect(x + 34 + balanco, Math.round(torre.topoVao) - 30, 8, 6);
  ctx.fillStyle = CORES.ouro;
  ctx.fillRect(x + 28, Math.round(torre.topoVao) - 58, 6, 6);

  // torre de baixo: do vão até o chão
  const topoBaixo = Math.round(torre.baseVao) + 12;
  desenharAmeias(ctx, x, topoBaixo, true);
  desenharBlocoPedra(ctx, x, topoBaixo, LARGURA_TORRE, CHAO - topoBaixo);
  // janelinha acesa
  if (CHAO - topoBaixo > 60) {
    ctx.fillStyle = "#2a2233";
    ctx.fillRect(x + 24, topoBaixo + 24, 14, 20);
    ctx.fillStyle = "#ffcf6b";
    ctx.fillRect(x + 27, topoBaixo + 28, 8, 13);
  }
}

// Portão do castelo no fim do percurso.
function desenharPortao(ctx, x) {
  const xi = Math.round(x);
  desenharBlocoPedra(ctx, xi, 60, 120, CHAO - 60);
  ctx.fillStyle = CORES.pedra;
  for (let i = 0; i < 5; i++) ctx.fillRect(xi + i * 26, 44, 16, 16);
  // arco do portão aberto, com luz dourada
  ctx.fillStyle = "#2a1a10";
  ctx.fillRect(xi + 22, CHAO - 210, 76, 210);
  ctx.fillStyle = "rgba(255, 207, 107, 0.55)";
  ctx.fillRect(xi + 30, CHAO - 200, 60, 200);
  ctx.fillStyle = CORES.ouro;
  ctx.fillRect(xi + 22, CHAO - 214, 76, 6);
  // coroa acima do portão
  ctx.fillRect(xi + 44, CHAO - 250, 32, 12);
  ctx.fillRect(xi + 44, CHAO - 262, 6, 12);
  ctx.fillRect(xi + 57, CHAO - 266, 6, 16);
  ctx.fillRect(xi + 70, CHAO - 262, 6, 12);
}

function desenharChao(ctx, deslocamento) {
  ctx.fillStyle = CORES.terra;
  ctx.fillRect(0, CHAO, LARGURA, ALTURA - CHAO);
  ctx.fillStyle = CORES.grama;
  ctx.fillRect(0, CHAO, LARGURA, 10);
  const desvio = Math.round(deslocamento) % 24;
  for (let x = -desvio; x < LARGURA; x += 24) {
    ctx.fillStyle = CORES.gramaClara;
    ctx.fillRect(x, CHAO, 12, 4);
    ctx.fillStyle = CORES.terraEscura;
    ctx.fillRect(x + 6, CHAO + 22, 8, 4);
    ctx.fillRect(x + 16, CHAO + 38, 6, 4);
  }
}

function desenharJogador(ctx, estado, camadas) {
  const { y, vy, tempo, ultimaBatida } = estado;
  // inclina pra cima ao subir e pra baixo ao cair
  const angulo = Math.max(-0.45, Math.min(1.1, vy / 520));
  // asas abrem logo depois da batida e voltam devagar
  const desdeBatida = ultimaBatida < 0 ? 1 : Math.min((tempo - ultimaBatida) / 0.25, 1);
  const flutuando = estado.fase === "pronto" || estado.fase === "vitoria";
  const abertura = flutuando ? 0.5 + 0.5 * Math.sin(tempo * 9) : 1 - desdeBatida;

  ctx.save();
  ctx.translate(JOGADOR_X, Math.round(y));
  ctx.rotate(estado.fase === "pronto" ? 0 : angulo);

  // Asas do Vento (atrás do corpo): duas penas grandes que sobem e descem
  for (const lado of [-1, 1]) {
    ctx.save();
    ctx.translate(-4, -8);
    ctx.rotate(lado * 0.15 - 0.4 - abertura * 0.9);
    ctx.fillStyle = CORES.asa;
    ctx.strokeStyle = CORES.asaContorno;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(-16, 0, 20, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // O desenho do personagem olha pra esquerda: espelha pra voar pra direita.
  ctx.scale(-1, 1);
  const metade = TAMANHO_SPRITE / 2;
  for (const imagem of camadas) {
    if (imagem.complete && imagem.naturalWidth > 0) {
      ctx.drawImage(imagem, -metade, -metade - 6, TAMANHO_SPRITE, TAMANHO_SPRITE);
    }
  }
  ctx.restore();
}

// ---------- Jogo ----------

// canvas: o elemento <canvas>; camadas: <img> do personagem já carregadas
// (base + itens equipados, na ordem de desenho); eventos: { aoPassar(n),
// aoCair(), aoVencer() }.
export function criarJogo(canvas, { camadas = [], aoPassar, aoCair, aoVencer } = {}) {
  const ctx = canvas.getContext("2d");
  let estado = criarEstado();
  let estrelas = gerarEstrelas();
  let quadro = 0;
  let ultimoInstante = null;
  let acumulado = 0;
  let escala = 1;

  function ajustarTamanho() {
    const caixa = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    escala = (caixa.width / LARGURA) * dpr;
    canvas.width = Math.round(LARGURA * escala);
    canvas.height = Math.round(ALTURA * escala);
    ctx.imageSmoothingEnabled = false;
  }

  function cair() {
    if (estado.fase !== "voando") return;
    estado.fase = "caindo";
    estado.vy = Math.max(estado.vy, 120);
  }

  function atualizar(dt) {
    estado.tempo += dt;

    if (estado.fase === "pronto") {
      // flutua parado esperando o primeiro toque
      estado.y = ALTURA * 0.42 + Math.sin(estado.tempo * 3) * 8;
      estado.deslocamento += VELOCIDADE * 0.35 * dt;
      return;
    }
    if (estado.fase === "parado") return;

    if (estado.fase === "vitoria") {
      // plana até o meio do portão aberto
      estado.y += ((CHAO - 110) - estado.y) * Math.min(1, dt * 2);
      if (estado.portaoX + 60 > JOGADOR_X) {
        const andar = VELOCIDADE * dt;
        estado.portaoX -= andar;
        estado.deslocamento += andar;
      }
      return;
    }

    // gravidade (voando e caindo)
    estado.vy = Math.min(estado.vy + GRAVIDADE * dt, VELOCIDADE_MAXIMA_QUEDA);
    estado.y += estado.vy * dt;
    if (estado.y < RAIO_COLISAO) {
      estado.y = RAIO_COLISAO; // teto: segura, não mata
      estado.vy = 0;
    }

    if (estado.fase === "caindo") {
      if (estado.y >= CHAO - RAIO_COLISAO) {
        estado.y = CHAO - RAIO_COLISAO;
        estado.vy = 0;
        estado.tempoNoChao += dt;
        if (estado.tempoNoChao > 0.35) {
          estado.fase = "parado";
          aoCair?.();
        }
      }
      return;
    }

    // voando: o cenário anda
    const andar = VELOCIDADE * dt;
    estado.deslocamento += andar;
    estado.portaoX -= andar;
    for (const torre of estado.torres) {
      torre.x -= andar;

      if (
        colideRetangulo(JOGADOR_X, estado.y, RAIO_COLISAO, torre.x - 6, 0, LARGURA_TORRE + 12, torre.topoVao) ||
        colideRetangulo(JOGADOR_X, estado.y, RAIO_COLISAO, torre.x - 6, torre.baseVao, LARGURA_TORRE + 12, CHAO - torre.baseVao)
      ) {
        cair();
        return;
      }

      if (!torre.passou && torre.x + LARGURA_TORRE < JOGADOR_X - RAIO_COLISAO) {
        torre.passou = true;
        estado.passadas += 1;
        aoPassar?.(estado.passadas);
      }
    }

    if (estado.y >= CHAO - RAIO_COLISAO) {
      estado.y = CHAO - RAIO_COLISAO;
      cair();
      return;
    }

    if (estado.portaoX < JOGADOR_X + 30) {
      estado.fase = "vitoria";
      estado.vy = 0; // entra no portão reto, sem a inclinação do voo
      aoVencer?.();
    }
  }

  function desenhar() {
    ctx.setTransform(escala, 0, 0, escala, 0, 0);
    ctx.imageSmoothingEnabled = false;
    desenharFundo(ctx, estado, estrelas);
    if (estado.portaoX < LARGURA + 20) desenharPortao(ctx, estado.portaoX);
    for (const torre of estado.torres) {
      if (torre.x < LARGURA + 20 && torre.x + LARGURA_TORRE > -20) desenharTorre(ctx, torre, estado.tempo);
    }
    desenharChao(ctx, estado.deslocamento);
    desenharJogador(ctx, estado, camadas);
  }

  function laco(instante) {
    if (ultimoInstante === null) ultimoInstante = instante;
    // aba em segundo plano: não tenta "recuperar" segundos perdidos
    acumulado += Math.min((instante - ultimoInstante) / 1000, 0.1);
    ultimoInstante = instante;
    while (acumulado >= PASSO) {
      atualizar(PASSO);
      acumulado -= PASSO;
    }
    desenhar();
    quadro = requestAnimationFrame(laco);
  }

  ajustarTamanho();
  window.addEventListener("resize", ajustarTamanho);
  quadro = requestAnimationFrame(laco);

  return {
    // Toque/clique/Espaço: no "pronto" começa o voo; voando, bate as asas.
    bater() {
      if (estado.fase === "pronto") estado.fase = "voando";
      if (estado.fase !== "voando") return;
      estado.vy = IMPULSO;
      estado.ultimaBatida = estado.tempo;
    },
    // Nova tentativa: torres novas, personagem de volta ao começo.
    reiniciar() {
      estado = criarEstado();
      estrelas = gerarEstrelas();
    },
    destruir() {
      cancelAnimationFrame(quadro);
      window.removeEventListener("resize", ajustarTamanho);
    },
  };
}
