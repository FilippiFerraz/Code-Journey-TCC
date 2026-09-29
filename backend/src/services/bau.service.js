const prisma = require("../config/prisma");
const { concederItem } = require("./personagem.service");

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
  const trilhas = await prisma.desafio.findMany({
    distinct: ["mundoId", "dificuldade"],
    select: { mundoId: true, dificuldade: true },
    orderBy: [{ mundoId: "asc" }, { dificuldade: "asc" }],
  });

  const bausAbertos = await prisma.bauMundo.findMany({
    where: { usuarioId },
    include: { itemGanho: true },
  });
  const bauPorTrilha = new Map(
    bausAbertos.map((bau) => [`${bau.mundoId}:${bau.dificuldade}`, bau])
  );

  const resultado = [];
  for (const trilha of trilhas) {
    const bauAberto = bauPorTrilha.get(`${trilha.mundoId}:${trilha.dificuldade}`);
    const concluido = await mundoConcluido(usuarioId, trilha.mundoId, trilha.dificuldade);

    resultado.push({
      mundoId: trilha.mundoId,
      dificuldade: trilha.dificuldade,
      disponivel: concluido && !bauAberto,
      aberto: Boolean(bauAberto),
      itemGanho: bauAberto ? formatarItem(bauAberto.itemGanho) : null,
    });
  }

  return resultado;
}

// Peso de cada raridade no sorteio do prêmio (Item.raridade) — quanto maior,
// mais provável. Raridade desconhecida conta como "comum".
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
async function sortearRoleta() {
  const itensDisponiveis = await prisma.item.findMany();
  if (itensDisponiveis.length === 0) {
    throw erroDeValidacao("Ainda não há itens cadastrados para dar como recompensa.");
  }

  const sortear = () => itensDisponiveis[Math.floor(Math.random() * itensDisponiveis.length)];

  const itemGanho = sortearPorRaridade(itensDisponiveis);
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

  const { itemGanho, slots, indiceVencedor } = await sortearRoleta();
  const quantidade = await concederItem(usuarioId, itemGanho.id);

  await prisma.bauMundo.create({
    data: { usuarioId, mundoId: mundoIdNumero, dificuldade, itemGanhoId: itemGanho.id },
  });

  return {
    itemGanho: formatarItem(itemGanho, quantidade),
    slots: slots.map((item) => formatarItem(item)),
    indiceVencedor,
  };
}

module.exports = { listarBaus, abrirBau };
