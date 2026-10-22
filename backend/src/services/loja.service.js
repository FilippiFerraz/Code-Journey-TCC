const prisma = require("../config/prisma");
const { listarDesafiosResumo } = require("./desafiosCache");
const { buscarOuCriarPersonagem } = require("./personagem.service");
const { sortearPorRaridade } = require("./bau.service");

// ---- Lojinha do Mago (casinha do canto do mapa da Home) ----
//
// Economia pensada pro jogo inteiro: os 18 desafios da trilha iniciante
// rendem de 180 (só a base) a 270 moedas (todos sem errar). Comprar UM de
// cada item da loja custa 210 — dá pra pegar alguns ao longo da jornada,
// mas não estocar tudo. Os limites de "maximo" evitam guardar uma pilha de
// atalhos pra pular a trilha inteira.

// Moedas (o "Ouro" do card de perfil) ganhas ao vencer um desafio pela
// primeira vez (ver progresso.service.js).
const MOEDAS_POR_DESAFIO = 10;
// A mais quando o desafio é vencido sem nenhum erro (mesma regra do bônus
// de XP de "primeira tentativa").
const MOEDAS_BONUS_SEM_ERROS = 5;

// Elixir do Sábio já bebido e ainda não gasto: guardado na mesma tabela,
// com esta chave (quantidade 1 = ativo). É gasto na próxima vitória inédita.
const CHAVE_ELIXIR_ATIVO = "elixirAtivo";

// Quanto tempo a Ampulheta Congelada segura o cronômetro (o frontend usa o
// valor devolvido em POST /api/loja/usar).
const SEGUNDOS_CONGELADOS = 30;

const ITENS_LOJA = {
  congelar: {
    nome: "Ampulheta Congelada",
    descricao: `Congela o cronômetro de um desafio por ${SEGUNDOS_CONGELADOS} segundos. O tempo congelado não conta contra o bônus de velocidade.`,
    preco: 25,
    maximo: 3,
  },
  elixir: {
    nome: "Elixir do Sábio",
    descricao: "Beba pela mochila durante um desafio ainda não vencido: o XP dele vale em dobro quando você vencer.",
    preco: 35,
    maximo: 2,
  },
  pular: {
    nome: "Pergaminho do Atalho",
    descricao: "Pula um desafio liberado (menos a batalha de chefe) e abre o próximo. Não dá XP nem moedas, e a recompensa fica para quando você vencê-lo de verdade.",
    preco: 60,
    maximo: 2,
  },
  bau: {
    nome: "Baú Misterioso",
    descricao: "Abre na hora e sorteia um item de algum baú do jogo que você ainda não tem.",
    preco: 90,
    maximo: null, // não fica guardado: abre na compra
  },
};

// Itens que podem sair no Baú Misterioso: os exclusivos de todos os baús
// (de módulo, Real, de Cristal e do Dragão).
const FILTRO_ITENS_BAU_LOJA = {
  OR: [{ exclusivoBau: true }, { exclusivoRei: true }, { exclusivoCristal: true }, { exclusivoDragao: true }],
};

function erroComStatus(mensagem, status) {
  const erro = new Error(mensagem);
  erro.status = status;
  return erro;
}

function configItem(chave) {
  const config = ITENS_LOJA[chave];
  if (!config) throw erroComStatus("Item da loja não encontrado.", 404);
  return config;
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

// Itens dos baús que o jogador ainda não tem — o que o Baú Misterioso pode sortear.
async function itensDeBauQueFaltam(usuarioId) {
  const [itens, personagem] = await Promise.all([
    prisma.item.findMany({ where: FILTRO_ITENS_BAU_LOJA }),
    buscarOuCriarPersonagem(usuarioId),
  ]);
  const jaTem = new Set(
    (await prisma.itemPersonagem.findMany({ where: { personagemId: personagem.id }, select: { itemId: true } }))
      .map((ip) => ip.itemId)
  );
  return { faltam: itens.filter((item) => !jaTem.has(item.id)), personagem };
}

// GET /api/loja — moedas, catálogo com preço e quantos de cada o jogador tem.
async function situacaoLoja(usuarioId) {
  const [usuario, guardados, { faltam }] = await Promise.all([
    prisma.usuario.findUnique({ where: { id: usuarioId }, select: { moedas: true } }),
    prisma.itemLojaUsuario.findMany({ where: { usuarioId } }),
    itensDeBauQueFaltam(usuarioId),
  ]);
  const quantidadePorChave = new Map(guardados.map((g) => [g.chave, g.quantidade]));

  return {
    moedas: usuario?.moedas ?? 0,
    segundosCongelados: SEGUNDOS_CONGELADOS,
    elixirAtivo: (quantidadePorChave.get(CHAVE_ELIXIR_ATIVO) ?? 0) > 0,
    itens: Object.entries(ITENS_LOJA).map(([chave, config]) => ({
      chave,
      ...config,
      quantidade: quantidadePorChave.get(chave) ?? 0,
      // Baú Misterioso esgotado: o jogador já tem todos os itens de baú.
      ...(chave === "bau" ? { esgotado: faltam.length === 0 } : {}),
    })),
  };
}

// Tira as moedas dentro da transação — o "gte" no where faz a conferência
// e o débito numa operação só, então duas compras ao mesmo tempo não deixam
// o saldo negativo.
async function debitarMoedas(tx, usuarioId, preco) {
  const { count } = await tx.usuario.updateMany({
    where: { id: usuarioId, moedas: { gte: preco } },
    data: { moedas: { decrement: preco } },
  });
  if (count === 0) throw erroComStatus("Moedas insuficientes para esta compra.", 400);
}

// POST /api/loja/comprar — { chave }. Itens guardáveis vão pro estoque (até
// "maximo"); o Baú Misterioso sorteia e credita o item na hora.
async function comprar(usuarioId, chave) {
  const config = configItem(chave);

  if (chave === "bau") {
    const { faltam, personagem } = await itensDeBauQueFaltam(usuarioId);
    if (faltam.length === 0) {
      throw erroComStatus("Você já tem todos os itens dos baús — o Mago não tem mais nada para você!", 409);
    }
    const itemGanho = sortearPorRaridade(faltam);

    const moedas = await prisma.$transaction(async (tx) => {
      await debitarMoedas(tx, usuarioId, config.preco);
      await tx.itemPersonagem.upsert({
        where: { personagemId_itemId: { personagemId: personagem.id, itemId: itemGanho.id } },
        update: {},
        create: { personagemId: personagem.id, itemId: itemGanho.id },
      });
      return (await tx.usuario.findUnique({ where: { id: usuarioId }, select: { moedas: true } })).moedas;
    });

    return { moedas, chave, itemGanho: formatarItem(itemGanho, 1) };
  }

  return prisma.$transaction(async (tx) => {
    const guardado = await tx.itemLojaUsuario.findUnique({
      where: { usuarioId_chave: { usuarioId, chave } },
    });
    if ((guardado?.quantidade ?? 0) >= config.maximo) {
      throw erroComStatus(
        config.maximo === 1
          ? `Você já tem um ${config.nome} ativo.`
          : `Você já carrega o máximo de ${config.maximo} ${config.nome}.`,
        409
      );
    }

    await debitarMoedas(tx, usuarioId, config.preco);
    const atualizado = await tx.itemLojaUsuario.upsert({
      where: { usuarioId_chave: { usuarioId, chave } },
      update: { quantidade: { increment: 1 } },
      create: { usuarioId, chave, quantidade: 1 },
    });
    const { moedas } = await tx.usuario.findUnique({ where: { id: usuarioId }, select: { moedas: true } });
    return { moedas, chave, quantidade: atualizado.quantidade };
  });
}

// Gasta 1 unidade do item guardado. Devolve false se não tinha nenhum. Aceita
// um cliente de transação (tx) pra ser usado dentro de outras operações.
async function gastarItem(usuarioId, chave, cliente = prisma) {
  const { count } = await cliente.itemLojaUsuario.updateMany({
    where: { usuarioId, chave, quantidade: { gte: 1 } },
    data: { quantidade: { decrement: 1 } },
  });
  return count > 0;
}

async function quantidadeGuardada(usuarioId, chave, cliente = prisma) {
  const guardado = await cliente.itemLojaUsuario.findUnique({
    where: { usuarioId_chave: { usuarioId, chave } },
  });
  return guardado?.quantidade ?? 0;
}

// POST /api/loja/usar — itens usados pela mochila durante um desafio:
// - { chave: "congelar" }: o congelamento em si acontece no cronômetro do
//   navegador (o tempo do desafio já é medido lá — ver useCronometro no
//   frontend); aqui só se gasta a ampulheta.
// - { chave: "elixir", mundoId, dificuldade, numero }: bebe um Elixir do
//   Sábio no desafio aberto. Só vale em desafio ainda não vencido (senão não
//   haveria XP pra dobrar) e com nenhum outro elixir já ativo; fica ativo
//   até a próxima vitória inédita (ver consumirElixir).
async function usarItem(usuarioId, { chave, mundoId, dificuldade, numero }) {
  if (chave === "congelar") {
    if (!(await gastarItem(usuarioId, chave))) {
      throw erroComStatus("Você não tem nenhuma Ampulheta Congelada. Compre uma na Lojinha do Mago!", 400);
    }
    return {
      chave,
      quantidade: await quantidadeGuardada(usuarioId, chave),
      segundosCongelados: SEGUNDOS_CONGELADOS,
    };
  }

  if (chave !== "elixir") throw erroComStatus("Este item não é usado assim.", 400);

  const resumo = await listarDesafiosResumo();
  const desafio = resumo.find(
    (d) => d.mundoId === Number(mundoId) && d.dificuldade === dificuldade && d.numero === Number(numero)
  );
  if (!desafio) throw erroComStatus("Desafio não encontrado.", 404);
  const progresso = await prisma.progresso.findUnique({
    where: { usuarioId_desafioId: { usuarioId, desafioId: desafio.id } },
    select: { concluido: true },
  });
  if (progresso?.concluido) {
    throw erroComStatus("Você já venceu este desafio — guarde o elixir para um desafio novo!", 409);
  }

  return prisma.$transaction(async (tx) => {
    if ((await quantidadeGuardada(usuarioId, CHAVE_ELIXIR_ATIVO, tx)) > 0) {
      throw erroComStatus("Você já tem um Elixir do Sábio fazendo efeito.", 409);
    }
    if (!(await gastarItem(usuarioId, chave, tx))) {
      throw erroComStatus("Você não tem nenhum Elixir do Sábio. Compre um na Lojinha do Mago!", 400);
    }
    await tx.itemLojaUsuario.upsert({
      where: { usuarioId_chave: { usuarioId, chave: CHAVE_ELIXIR_ATIVO } },
      update: { quantidade: 1 },
      create: { usuarioId, chave: CHAVE_ELIXIR_ATIVO, quantidade: 1 },
    });
    return { chave, quantidade: await quantidadeGuardada(usuarioId, chave, tx), elixirAtivo: true };
  });
}

// POST /api/loja/pular — { mundoId, dificuldade, numero }. Marca o desafio
// como concluído sem XP (libera o próximo), gastando um Pergaminho do Atalho.
// Não vale pra batalha de chefe (último desafio da trilha) nem pra desafio
// trancado ou já concluído. A recompensa em item continua lá: vencer o
// desafio depois concede o item normalmente (ver responderDesafio).
async function pularDesafio(usuarioId, { mundoId, dificuldade, numero }) {
  // require aqui dentro: progresso.service também importa este arquivo.
  const { verificarDesafioLiberado } = require("./progresso.service");

  const resumo = await listarDesafiosResumo();
  const trilha = resumo.filter((d) => d.mundoId === Number(mundoId) && d.dificuldade === dificuldade);
  const desafio = trilha.find((d) => d.numero === Number(numero));
  if (!desafio) throw erroComStatus("Desafio não encontrado.", 404);

  const ultimoNumero = Math.max(...trilha.map((d) => d.numero));
  if (desafio.numero === ultimoNumero) {
    throw erroComStatus("A batalha de chefe não pode ser pulada — essa você tem que vencer!", 400);
  }

  await verificarDesafioLiberado(usuarioId, desafio);

  const chave = { usuarioId_desafioId: { usuarioId, desafioId: desafio.id } };
  const progresso = await prisma.progresso.findUnique({ where: chave, select: { concluido: true } });
  if (progresso?.concluido) throw erroComStatus("Este desafio já foi concluído.", 409);

  return prisma.$transaction(async (tx) => {
    if (!(await gastarItem(usuarioId, "pular", tx))) {
      throw erroComStatus("Você não tem nenhum Pergaminho do Atalho. Compre um na Lojinha do Mago!", 400);
    }
    const dados = {
      concluido: true,
      dataConclusao: new Date(),
      etapasConcluidas: desafio.totalEtapas > 1 ? desafio.totalEtapas : 0,
    };
    await tx.progresso.upsert({
      where: chave,
      update: dados,
      create: { usuarioId, desafioId: desafio.id, ...dados },
    });
    const guardado = await tx.itemLojaUsuario.findUnique({
      where: { usuarioId_chave: { usuarioId, chave: "pular" } },
    });
    return { pulado: true, numero: desafio.numero, quantidade: guardado?.quantidade ?? 0 };
  });
}

// Chamado por progresso.service.js quando um desafio é vencido pela primeira
// vez: gasta o Elixir do Sábio que foi bebido, se houver (true = o XP dobra).
function consumirElixir(usuarioId) {
  return gastarItem(usuarioId, CHAVE_ELIXIR_ATIVO);
}

function moedasPorVitoria(semErros) {
  return MOEDAS_POR_DESAFIO + (semErros ? MOEDAS_BONUS_SEM_ERROS : 0);
}

module.exports = {
  situacaoLoja,
  comprar,
  usarItem,
  pularDesafio,
  consumirElixir,
  moedasPorVitoria,
  FILTRO_ITENS_BAU_LOJA,
};
