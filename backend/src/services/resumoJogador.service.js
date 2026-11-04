const prisma = require("../config/prisma");
const { listarBaus } = require("./bau.service");

// Resumo do jogador pro Card de Perfil (coluna direita da Home no desktop —
// frontend/src/components/PerfilJogadorCard.jsx) e pra tela de Perfil.
// Quase nada aqui tem coluna própria no banco: é calculado do progresso que
// já existe, então nunca fica fora de sincronia (a exceção é o ouro).
//
// - nivel: 1 a cada XP_POR_NIVEL de XP (Usuario.xpTotal).
// - diasOfensiva: dias seguidos, até hoje, com pelo menos um desafio
//   concluído (Progresso.dataConclusao). Se hoje ainda não teve, a
//   ofensiva continua valendo a partir de ontem.
// - ouro: as moedas guardadas pra Lojinha do Mago (Usuario.moedas — a
//   única coisa daqui que tem coluna própria, porque é gasta na loja).
// - cristais: 1 por baú aberto, +2 por minijogo do mapa vencido (os baús
//   especiais — Desafio do Rei, Cachoeira de Cristais, Dragão).
// - titulo: a maior conquista do jogador (ver TITULOS).

const XP_POR_NIVEL = 100;
const FUSO = "America/Sao_Paulo";
// mundoId dos baús especiais dos minijogos (ver BAUS_ESPECIAIS em bau.service.js)
const MUNDO_BAU_ESPECIAL = 0;
const CRISTAIS_EXTRAS_POR_MINIJOGO = 2;

// Do mais alto pro mais baixo: o primeiro cuja condição vale é o título.
// "icone" é a chave do ícone em PerfilJogadorCard.jsx.
const TITULOS = [
  { titulo: "Mestre do Loop", icone: "dragao", vale: (c) => c.minijogos.has("dragao") },
  { titulo: "Domador de Dragões", icone: "fogo", vale: (c) => c.portais.has(3) },
  { titulo: "Convidado do Rei", icone: "coroa", vale: (c) => c.minijogos.has("rei") },
  { titulo: "Guardião dos Cristais", icone: "cristal", vale: (c) => c.minijogos.has("cristal") },
  { titulo: "Caçador de Goblins", icone: "espada", vale: (c) => c.portais.has(2) },
  { titulo: "Herói da Vila", icone: "escudo", vale: (c) => c.portais.has(1) },
  { titulo: "Aprendiz", icone: "livro", vale: () => true },
];

// "AAAA-MM-DD" do dia no fuso do jogo.
function diaLocal(data) {
  return new Date(data).toLocaleDateString("en-CA", { timeZone: FUSO });
}

function diaAnterior(dia) {
  const d = new Date(`${dia}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

function calcularOfensiva(datasConclusao, agora = new Date()) {
  const dias = new Set(datasConclusao.map(diaLocal));
  let dia = diaLocal(agora);
  if (!dias.has(dia)) dia = diaAnterior(dia); // hoje ainda pode jogar
  let total = 0;
  while (dias.has(dia)) {
    total += 1;
    dia = diaAnterior(dia);
  }
  return total;
}

async function resumoJogador(usuarioId, xpTotal, moedas = 0) {
  const [conclusoes, trilhas, especiais] = await Promise.all([
    prisma.progresso.findMany({
      where: { usuarioId, concluido: true, dataConclusao: { not: null } },
      select: { dataConclusao: true },
    }),
    listarBaus(usuarioId),
    prisma.bauMundo.findMany({ where: { usuarioId, mundoId: MUNDO_BAU_ESPECIAL }, select: { dificuldade: true } }),
  ]);

  // portal concluído = baú de fim de módulo disponível ou já aberto (só a
  // trilha "iniciante" tem conteúdo hoje)
  const portais = new Set(
    trilhas.filter((t) => t.dificuldade === "iniciante" && (t.disponivel || t.aberto)).map((t) => t.mundoId)
  );
  const minijogos = new Set(especiais.map((b) => b.dificuldade));
  const bausDeModulo = trilhas.filter((t) => t.aberto).length;
  const titulo = TITULOS.find((t) => t.vale({ portais, minijogos }));

  return {
    nivel: Math.floor(xpTotal / XP_POR_NIVEL) + 1,
    diasOfensiva: calcularOfensiva(conclusoes.map((c) => c.dataConclusao)),
    ouro: moedas,
    cristais: bausDeModulo + minijogos.size * (1 + CRISTAIS_EXTRAS_POR_MINIJOGO),
    titulo: { nome: titulo.titulo, icone: titulo.icone },
  };
}

module.exports = { resumoJogador, calcularOfensiva };
