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

// ---------- Baús especiais (minijogos do mapa) ----------
//
// Cada minijogo do mapa da Home dá UM baú especial, com roleta própria:
// - "rei": Desafio do Rei (castelo), liberado com os portais 1 e 2
//   concluídos; sorteia as asas da coleção do Rei (Item.exclusivoRei).
// - "cristal": Desafio da Cachoeira de Cristais (cristal gigante e
//   cachoeira), liberado com o portal 1 concluído; sorteia os itens de
//   cristal (Item.exclusivoCristal).
// - "dragao": Batalha contra o Dragão do Código Fonte (dragão da arena),
//   liberada com os portais 1, 2 e 3 concluídos; sorteia os itens do
//   dragão (Item.exclusivoDragao).
// Eles usam a mesma tabela dos baús de módulo (BauMundo), numa "trilha" que
// não existe: mundoId 0 e dificuldade = a chave do baú. Nenhum desafio é
// cadastrado nela, então listarBaus nunca a mostra e abrirBau nunca a abre
// (mundoConcluido daria false).
//
// Limitação conhecida: a vitória nos minijogos acontece no navegador — o
// backend só confere se o desafio está liberado e se o baú já foi aberto.
const MUNDO_BAU_ESPECIAL = 0;
const DIFICULDADE_EXIGIDA = "iniciante";

const BAUS_ESPECIAIS = {
  rei: {
    mundosExigidos: [1, 2],
    filtroItens: { exclusivoRei: true },
    nome: "Baú Real",
    bloqueado: "Conclua os dois primeiros portais para enfrentar o Desafio do Rei.",
  },
  cristal: {
    mundosExigidos: [1],
    filtroItens: { exclusivoCristal: true },
    nome: "Baú de Cristal",
    bloqueado: "Conclua o primeiro portal para enfrentar o Desafio da Cachoeira de Cristais.",
  },
  dragao: {
    mundosExigidos: [1, 2, 3],
    filtroItens: { exclusivoDragao: true },
    nome: "Baú do Dragão",
    bloqueado: "Conclua os três portais para enfrentar o Dragão do Código Fonte.",
  },
};

function configBauEspecial(chave) {
  const config = BAUS_ESPECIAIS[chave];
  if (!config) {
    const erro = new Error("Baú não encontrado.");
    erro.status = 404;
    throw erro;
  }
  return config;
}

async function bauEspecialLiberado(usuarioId, config) {
  const concluidos = await Promise.all(
    config.mundosExigidos.map((mundoId) => mundoConcluido(usuarioId, mundoId, DIFICULDADE_EXIGIDA))
  );
  return concluidos.every(Boolean);
}

function buscarBauEspecial(usuarioId, chave, incluirItem = false) {
  return prisma.bauMundo.findUnique({
    where: {
      usuarioId_mundoId_dificuldade: { usuarioId, mundoId: MUNDO_BAU_ESPECIAL, dificuldade: chave },
    },
    include: incluirItem ? { itemGanho: true } : undefined,
  });
}

// GET /api/baus/:chave (rei | cristal) — se o minijogo já está liberado pro
// jogador e se o baú dele já foi aberto (com o item que saiu).
async function situacaoBauEspecial(usuarioId, chave) {
  const config = configBauEspecial(chave);
  const [liberado, bau] = await Promise.all([
    bauEspecialLiberado(usuarioId, config),
    buscarBauEspecial(usuarioId, chave, true),
  ]);
  return {
    liberado,
    aberto: Boolean(bau),
    itemGanho: bau ? formatarItem(bau.itemGanho) : null,
  };
}

// POST /api/baus/:chave/abrir — mesmo fluxo de abrirBau, com a roleta do baú especial.
async function abrirBauEspecial(usuarioId, chave) {
  const config = configBauEspecial(chave);
  if (await buscarBauEspecial(usuarioId, chave)) {
    throw erroDeValidacao(`Você já abriu o ${config.nome}.`);
  }
  if (!(await bauEspecialLiberado(usuarioId, config))) {
    throw erroDeValidacao(config.bloqueado);
  }

  const { itemGanho, slots, indiceVencedor } = await sortearRoleta(usuarioId, config.filtroItens);
  const { quantidade } = await concederItemSeNaoTiver(usuarioId, itemGanho.id);

  await prisma.bauMundo.create({
    data: { usuarioId, mundoId: MUNDO_BAU_ESPECIAL, dificuldade: chave, itemGanhoId: itemGanho.id },
  });

  return {
    itemGanho: formatarItem(itemGanho, quantidade),
    slots: slots.map((item) => formatarItem(item)),
    indiceVencedor,
  };
}

// Filtro dos itens que podem sair na roleta de um baú especial (pra montar a fita).
function filtroItensBauEspecial(chave) {
  return configBauEspecial(chave).filtroItens;
}

module.exports = {
  listarBaus,
  abrirBau,
  situacaoBauEspecial,
  abrirBauEspecial,
  filtroItensBauEspecial,
  sortearPorRaridade,
};
