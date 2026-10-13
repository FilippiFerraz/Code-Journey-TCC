const prisma = require("../config/prisma");
const { listarDesafiosResumo } = require("./desafiosCache");
const { concederItemSeNaoTiver, buscarOuCriarPersonagem } = require("./personagem.service");

// Quantos itens vão em "slots" na resposta de abrirBau — pode repetir itens
// do catálogo se o jogo ainda não tiver esse tanto de itens distintos. A
// tela atual (BauDaSorte.jsx) monta a própria fita com GET /api/itens, então
// isso fica só por compatibilidade.
const SLOTS_ROLETA = 6;

function erroDeValidacao(mensagem) {
  const erro = new Error(mensagem);
  erro.status = 400;
  return erro;
}

function formatarItem(item, quantidade) {
  return {
    id: item.id,
    nome: item.nome,
    tipo: item.tipo,
    raridade: item.raridade,
    descricao: item.descricao,
    icone: item.icone,
    imagemUrl: item.imagemUrl,
    ...(quantidade !== undefined ? { quantidade } : {}),
  };
}

// Uma trilha está "concluída" quando todos os desafios cadastrados nela já
// foram respondidos corretamente pelo usuário — mesma regra usada no
// frontend pra liberar o próximo mundo (ver mundoLiberado em
// frontend/src/data/progresso.js), só que aplicada ao próprio mundo em vez
// do anterior.
async function mundoConcluido(usuarioId, mundoId, dificuldade) {
  const desafios = await prisma.desafio.findMany({
    where: { mundoId, dificuldade },
    select: { id: true },
  });
  if (desafios.length === 0) return false;

  const concluidos = await prisma.progresso.count({
    where: { usuarioId, desafioId: { in: desafios.map((d) => d.id) }, concluido: true },
  });

  return concluidos === desafios.length;
}

// Lista, pra cada trilha com desafios cadastrados, se o baú de fim de mundo
// está disponível pra abrir (mundo concluído e ainda não aberto) ou já foi
// aberto (com o item que ele deu) — usado por Home.jsx pra decidir em quais
// portais do mapa desenhar o ícone do baú.
async function listarBaus(usuarioId) {
  // Antes: 2 consultas POR trilha, num laço, uma depois da outra. Agora três
  // consultas juntas e a conta de "trilha concluída" é feita em memória.
  const [desafios, bausAbertos, progressosConcluidos] = await Promise.all([
    listarDesafiosResumo(),
    prisma.bauMundo.findMany({ where: { usuarioId }, include: { itemGanho: true } }),
    prisma.progresso.findMany({ where: { usuarioId, concluido: true }, select: { desafioId: true } }),
  ]);

  const bauPorTrilha = new Map(
    bausAbertos.map((bau) => [bau.mundoId + ":" + bau.dificuldade, bau])
  );
  const concluidos = new Set(progressosConcluidos.map((p) => p.desafioId));

  // desafios já vêm ordenados por mundo e dificuldade
  const desafiosPorTrilha = new Map();
  for (const d of desafios) {
    const chave = d.mundoId + ":" + d.dificuldade;
    if (!desafiosPorTrilha.has(chave)) desafiosPorTrilha.set(chave, []);
    desafiosPorTrilha.get(chave).push(d.id);
  }

  const resultado = [];
  for (const [chave, ids] of desafiosPorTrilha) {
    const [mundoId, dificuldade] = chave.split(":");
    const bauAberto = bauPorTrilha.get(chave);
    const concluido = ids.length > 0 && ids.every((id) => concluidos.has(id));

    resultado.push({
      mundoId: Number(mundoId),
      dificuldade,
      disponivel: concluido && !bauAberto,
      aberto: Boolean(bauAberto),
      itemGanho: bauAberto ? formatarItem(bauAberto.itemGanho) : null,
    });
  }

  return resultado;
}

const PESOS_RARIDADE = {
  comum: 60,
  raro: 25,
  epico: 12,
  lendario: 3,
};

function sortearPorRaridade(itens) {
  const pesoDe = (item) => PESOS_RARIDADE[item.raridade] ?? PESOS_RARIDADE.comum;
  const pesoTotal = itens.reduce((soma, item) => soma + pesoDe(item), 0);

  let sorteio = Math.random() * pesoTotal;
  for (const item of itens) {
    sorteio -= pesoDe(item);
    if (sorteio < 0) return item;
  }
  return itens[itens.length - 1];
}

// Sorteia o item ganho e monta os SLOTS_ROLETA itens exibidos na roleta — o
// item sorteado sempre ocupa um deles, no índice retornado em
// "indiceVencedor" (é nesse slot que a animação do frontend deve parar).
// O baú só sorteia os itens exclusivos dele (Item.exclusivoBau) — eles não
// saem de nenhum outro lugar do jogo. Recompensas não acumulam (ver
// concederItemSeNaoTiver), então o sorteio é feito só entre os que o
// jogador AINDA NÃO TEM — o baú sempre dá algo novo. Se ele já tiver todos,
// sorteia entre todos (e nada se duplica).
//
// "filtro" escolhe a roleta: a do baú de módulo (padrão) ou a do Baú Real
// (ver abrirBauRei), cada uma com seus próprios itens exclusivos.
async function sortearRoleta(usuarioId, filtro = { exclusivoBau: true }) {
  const itensDisponiveis = await prisma.item.findMany({ where: filtro });
  if (itensDisponiveis.length === 0) {
    throw erroDeValidacao("Ainda não há itens cadastrados para dar como recompensa.");
  }

  const personagem = await buscarOuCriarPersonagem(usuarioId);
  const jaTem = new Set(
    (await prisma.itemPersonagem.findMany({ where: { personagemId: personagem.id }, select: { itemId: true } }))
      .map((ip) => ip.itemId)
  );
  const itensNovos = itensDisponiveis.filter((item) => !jaTem.has(item.id));

  const sortear = () => itensDisponiveis[Math.floor(Math.random() * itensDisponiveis.length)];

  const itemGanho = sortearPorRaridade(itensNovos.length > 0 ? itensNovos : itensDisponiveis);
  const slots = Array.from({ length: SLOTS_ROLETA }, sortear);
  const indiceVencedor = Math.floor(Math.random() * SLOTS_ROLETA);
  slots[indiceVencedor] = itemGanho;

  return { itemGanho, slots, indiceVencedor };
}

// Abre o baú de uma trilha concluída: sorteia o item da roleta, credita no
// inventário do personagem e registra o baú como aberto (a existência da
// linha em BauMundo é o que impede abrir a mesma trilha de novo).
async function abrirBau(usuarioId, mundoId, dificuldade) {
  const mundoIdNumero = Number(mundoId);
  if (!Number.isInteger(mundoIdNumero)) {
    throw erroDeValidacao("Mundo inválido.");
  }

  const jaAberto = await prisma.bauMundo.findUnique({
    where: {
      usuarioId_mundoId_dificuldade: { usuarioId, mundoId: mundoIdNumero, dificuldade },
    },
  });
  if (jaAberto) {
    throw erroDeValidacao("Você já abriu o baú desta trilha.");
  }

  const concluido = await mundoConcluido(usuarioId, mundoIdNumero, dificuldade);
  if (!concluido) {
    throw erroDeValidacao("Termine todos os desafios desta trilha para abrir o baú.");
  }

  const { itemGanho, slots, indiceVencedor } = await sortearRoleta(usuarioId);
  const { quantidade } = await concederItemSeNaoTiver(usuarioId, itemGanho.id);

  await prisma.bauMundo.create({
    data: { usuarioId, mundoId: mundoIdNumero, dificuldade, itemGanhoId: itemGanho.id },
  });

  return {
    itemGanho: formatarItem(itemGanho, quantidade),
    slots: slots.map((item) => formatarItem(item)),
    indiceVencedor,
  };
}

// ---------- Baú Real (Desafio do Rei) ----------
//
// O Desafio do Rei (minijogo do castelo no mapa) libera depois que os dois
// primeiros portais estão concluídos e dá UM Baú Real, com roleta própria
// (itens com Item.exclusivoRei). Ele usa a mesma tabela dos baús de módulo
// (BauMundo), numa "trilha" que não existe: mundoId 0 e dificuldade "rei".
// Nenhum desafio é cadastrado nela, então listarBaus nunca a mostra e
// abrirBau nunca a abre (mundoConcluido daria false).
//
// Limitação conhecida: a vitória no minijogo acontece no navegador — o
// backend só confere se o desafio está liberado e se o baú já foi aberto.
const MUNDO_BAU_REI = 0;
const DIFICULDADE_BAU_REI = "rei";
const MUNDOS_EXIGIDOS_REI = [1, 2];
const DIFICULDADE_EXIGIDA_REI = "iniciante";

async function desafioReiLiberado(usuarioId) {
  const concluidos = await Promise.all(
    MUNDOS_EXIGIDOS_REI.map((mundoId) => mundoConcluido(usuarioId, mundoId, DIFICULDADE_EXIGIDA_REI))
  );
  return concluidos.every(Boolean);
}

function buscarBauRei(usuarioId, incluirItem = false) {
  return prisma.bauMundo.findUnique({
    where: {
      usuarioId_mundoId_dificuldade: {
        usuarioId,
        mundoId: MUNDO_BAU_REI,
        dificuldade: DIFICULDADE_BAU_REI,
      },
    },
    include: incluirItem ? { itemGanho: true } : undefined,
  });
}

// GET /api/baus/rei — se o Desafio do Rei já está liberado pro jogador e se
// o Baú Real já foi aberto (com o item que saiu).
async function situacaoBauRei(usuarioId) {
  const [liberado, bau] = await Promise.all([
    desafioReiLiberado(usuarioId),
    buscarBauRei(usuarioId, true),
  ]);
  return {
    liberado,
    aberto: Boolean(bau),
    itemGanho: bau ? formatarItem(bau.itemGanho) : null,
  };
}

// POST /api/baus/rei/abrir — mesmo fluxo de abrirBau, com a roleta do Baú Real.
async function abrirBauRei(usuarioId) {
  if (await buscarBauRei(usuarioId)) {
    throw erroDeValidacao("Você já abriu o Baú Real.");
  }
  if (!(await desafioReiLiberado(usuarioId))) {
    throw erroDeValidacao("Conclua os dois primeiros portais para enfrentar o Desafio do Rei.");
  }

  const { itemGanho, slots, indiceVencedor } = await sortearRoleta(usuarioId, { exclusivoRei: true });
  const { quantidade } = await concederItemSeNaoTiver(usuarioId, itemGanho.id);

  await prisma.bauMundo.create({
    data: {
      usuarioId,
      mundoId: MUNDO_BAU_REI,
      dificuldade: DIFICULDADE_BAU_REI,
      itemGanhoId: itemGanho.id,
    },
  });

  return {
    itemGanho: formatarItem(itemGanho, quantidade),
    slots: slots.map((item) => formatarItem(item)),
    indiceVencedor,
  };
}

module.exports = { listarBaus, abrirBau, situacaoBauRei, abrirBauRei };
