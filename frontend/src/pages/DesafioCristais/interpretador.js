// Interpretador dos blocos do Desafio da Cachoeira de Cristais. Recebe o
// programa montado pelo jogador e roda a simulação inteira de uma vez,
// devolvendo a lista de "quadros" (o estado depois de cada passo) e o
// resultado. A tela só anima esses quadros um por um — assim a regra do
// jogo fica toda aqui, sem depender de tempo nem de React.
//
// Programa: lista de blocos, cada um com um id único:
//   { id, tipo: "mover" | "esquerda" | "direita" | "atacar" }
//   { id, tipo: "repetir", vezes, corpo: [...] }
//   { id, tipo: "se", condicao: "inimigo" | "livre", corpo: [...] }
//
// Regras:
// - Mover pra água, pra fora do mapa ou pra casa de um inimigo vivo é bug.
// - Atacar derrota o inimigo da casa da frente (sem inimigo, não faz nada).
// - Depois de cada ação (mover, girar, atacar) o mundo anda um passo: os
//   besouros de patrulha avançam uma casa (e dão meia-volta no fim do
//   trecho ou se o herói estiver no caminho — besouro não ataca, só bloqueia).
// - Aranha viva morde quem termina um passo numa casa vizinha a ela sem
//   estar de frente pra ela (passar de lado por uma aranha é bug).
// - Chegar na casa do Cristal vence na hora.

const DIRECOES = {
  norte: { dx: 0, dy: -1, esquerda: "oeste", direita: "leste" },
  leste: { dx: 1, dy: 0, esquerda: "norte", direita: "sul" },
  sul: { dx: 0, dy: 1, esquerda: "leste", direita: "oeste" },
  oeste: { dx: -1, dy: 0, esquerda: "sul", direita: "norte" },
};

// Teto de passos: com Repetir dentro de Repetir dá pra gerar programas
// enormes; isso impede a tela de ficar "executando" pra sempre.
const MAXIMO_PASSOS = 400;

const MENSAGENS = {
  agua: "Splash! O herói caiu na água. Confira as curvas do caminho.",
  fora: "O herói tentou sair do mapa. Confira as curvas do caminho.",
  besouro: "Bug! O herói trombou num besouro. Use Atacar quando ele estiver na sua frente.",
  aranha: "Bug! O herói trombou numa Aranha de Código. Ataque-a antes de passar.",
  mordida: "A Aranha de Código mordeu o herói! Não passe ao lado dela — fique de frente e ataque.",
  fim: "O programa terminou antes de chegar ao Cristal. Faltam blocos!",
  infinito: "O programa ficou grande demais. Diminua as repetições.",
};

// Lê o mapa da fase: casas, posição inicial e inimigos.
export function prepararNivel(nivel) {
  const casas = nivel.mapa.map((linha) => linha.split(""));
  const altura = casas.length;
  const largura = casas[0].length;
  let inicio = null;
  let cristal = null;
  const inimigos = [];

  casas.forEach((linha, y) =>
    linha.forEach((c, x) => {
      if (c === "P") inicio = { x, y };
      if (c === "C") cristal = { x, y };
      if (c === "B" || c === "A") {
        const patrulha = (nivel.patrulhas ?? []).find((p) => p.x === x && p.y === y);
        inimigos.push({
          id: `${c}${x}-${y}`,
          tipo: c === "B" ? "besouro" : "aranha",
          x,
          y,
          vivo: true,
          patrulha: patrulha ? { eixo: patrulha.eixo, de: patrulha.de, ate: patrulha.ate, sentido: 1 } : null,
        });
      }
    })
  );

  return { casas, largura, altura, inicio, cristal, inimigos, direcaoInicial: nivel.direcaoInicial };
}

export function estadoInicial(cenario) {
  return {
    jogador: { ...cenario.inicio, direcao: cenario.direcaoInicial },
    inimigos: cenario.inimigos.map((i) => ({ ...i, patrulha: i.patrulha && { ...i.patrulha } })),
  };
}

function andavel(cenario, x, y) {
  if (x < 0 || y < 0 || x >= cenario.largura || y >= cenario.altura) return false;
  return cenario.casas[y][x] !== "~";
}

function inimigoEm(estado, x, y) {
  return estado.inimigos.find((i) => i.vivo && i.x === x && i.y === y) ?? null;
}

function frente(estado) {
  const d = DIRECOES[estado.jogador.direcao];
  return { x: estado.jogador.x + d.dx, y: estado.jogador.y + d.dy };
}

// Condições do bloco Se, avaliadas na casa da frente do herói.
export function avaliarCondicao(cenario, estado, condicao) {
  const { x, y } = frente(estado);
  if (condicao === "inimigo") return Boolean(inimigoEm(estado, x, y));
  return andavel(cenario, x, y) && !inimigoEm(estado, x, y); // "livre"
}

function copiar(estado) {
  return {
    jogador: { ...estado.jogador },
    inimigos: estado.inimigos.map((i) => ({ ...i, patrulha: i.patrulha && { ...i.patrulha } })),
  };
}

// Um passo do mundo depois de cada ação: besouros de patrulha andam.
function moverPatrulhas(cenario, estado) {
  for (const inimigo of estado.inimigos) {
    if (!inimigo.vivo || !inimigo.patrulha) continue;
    const p = inimigo.patrulha;
    const nx = p.eixo === "x" ? inimigo.x + p.sentido : inimigo.x;
    const ny = p.eixo === "y" ? inimigo.y + p.sentido : inimigo.y;
    const posicao = p.eixo === "x" ? nx : ny;
    const bloqueado =
      posicao < p.de ||
      posicao > p.ate ||
      !andavel(cenario, nx, ny) ||
      (estado.jogador.x === nx && estado.jogador.y === ny) ||
      Boolean(inimigoEm(estado, nx, ny));
    if (bloqueado) {
      p.sentido *= -1; // meia-volta; anda no próximo passo
    } else {
      inimigo.x = nx;
      inimigo.y = ny;
    }
  }
}

// Aranha viva vizinha (não diagonal) que não está na frente do herói morde.
function aranhaMordendo(estado) {
  const f = frente(estado);
  const { x, y } = estado.jogador;
  return estado.inimigos.find(
    (i) =>
      i.vivo &&
      i.tipo === "aranha" &&
      Math.abs(i.x - x) + Math.abs(i.y - y) === 1 &&
      !(i.x === f.x && i.y === f.y)
  );
}

class FimDaExecucao {
  constructor(resultado) {
    this.resultado = resultado;
  }
}

// Roda o programa e devolve { quadros, resultado }.
//   quadro: { blocoId, acao, estado, condicao?, alvo?, erro? }
//   resultado: { tipo: "vitoria" | "erro", mensagem? }
export function executarPrograma(nivel, programa) {
  const cenario = prepararNivel(nivel);
  let estado = estadoInicial(cenario);
  const quadros = [];
  let passos = 0;

  function registrar(bloco, acao, extra = {}) {
    quadros.push({ blocoId: bloco.id, acao, estado: copiar(estado), ...extra });
  }

  function falhar(bloco, motivo, extra = {}) {
    registrar(bloco, "erro", { erro: motivo, ...extra });
    throw new FimDaExecucao({ tipo: "erro", motivo, mensagem: MENSAGENS[motivo] });
  }

  function depoisDaAcao(bloco) {
    moverPatrulhas(cenario, estado);
    const aranha = aranhaMordendo(estado);
    if (aranha) falhar(bloco, "mordida", { alvo: { x: aranha.x, y: aranha.y } });
  }

  function acao(bloco) {
    passos += 1;
    if (passos > MAXIMO_PASSOS) falhar(bloco, "infinito");
    const j = estado.jogador;

    if (bloco.tipo === "esquerda" || bloco.tipo === "direita") {
      j.direcao = DIRECOES[j.direcao][bloco.tipo];
      depoisDaAcao(bloco);
      registrar(bloco, bloco.tipo);
      return;
    }

    if (bloco.tipo === "atacar") {
      const alvo = frente(estado);
      const inimigo = inimigoEm(estado, alvo.x, alvo.y);
      if (inimigo) inimigo.vivo = false;
      depoisDaAcao(bloco);
      registrar(bloco, "atacar", { alvo, acertou: Boolean(inimigo) });
      return;
    }

    // mover
    const destino = frente(estado);
    if (destino.x < 0 || destino.y < 0 || destino.x >= cenario.largura || destino.y >= cenario.altura) {
      j.x = destino.x;
      j.y = destino.y;
      falhar(bloco, "fora");
    }
    if (!andavel(cenario, destino.x, destino.y)) {
      j.x = destino.x;
      j.y = destino.y;
      falhar(bloco, "agua");
    }
    const inimigo = inimigoEm(estado, destino.x, destino.y);
    if (inimigo) falhar(bloco, inimigo.tipo, { alvo: destino });

    j.x = destino.x;
    j.y = destino.y;
    if (j.x === cenario.cristal.x && j.y === cenario.cristal.y) {
      registrar(bloco, "mover");
      throw new FimDaExecucao({ tipo: "vitoria" });
    }
    depoisDaAcao(bloco);
    registrar(bloco, "mover");
  }

  function rodar(lista) {
    for (const bloco of lista) {
      if (bloco.tipo === "repetir") {
        for (let i = 0; i < bloco.vezes; i++) rodar(bloco.corpo);
      } else if (bloco.tipo === "se") {
        const verdadeira = avaliarCondicao(cenario, estado, bloco.condicao);
        registrar(bloco, "condicao", { condicao: verdadeira });
        if (verdadeira) rodar(bloco.corpo);
      } else {
        acao(bloco);
      }
    }
  }

  try {
    rodar(programa);
    // acabou sem chegar no Cristal
    quadros.push({ blocoId: null, acao: "fim", estado: copiar(estado) });
    return { cenario, quadros, resultado: { tipo: "erro", motivo: "fim", mensagem: MENSAGENS.fim } };
  } catch (fim) {
    if (!(fim instanceof FimDaExecucao)) throw fim;
    return { cenario, quadros, resultado: fim.resultado };
  }
}

// Quantos blocos o programa usa (os de dentro de Repetir/Se contam também).
export function contarBlocos(programa) {
  return programa.reduce((total, bloco) => total + 1 + (bloco.corpo ? contarBlocos(bloco.corpo) : 0), 0);
}
