const prisma = require("../config/prisma");
const { buscarOuCriarPersonagem } = require("./personagem.service");

function erroDeValidacao(mensagem) {
  const erro = new Error(mensagem);
  erro.status = 400;
  return erro;
}

// Desafio.alternativas é Json livre e hoje guarda um de dois formatos (ver
// ResolverDesafio.jsx no frontend):
// - múltipla escolha: array [{ id, texto, correta }] -> valida opcaoId
// - ordenar blocos: objeto { tipo: "ordenar_blocos", blocos, ordemCorreta } -> valida ordem
function avaliarMultiplaEscolha(alternativas, opcaoId) {
  const escolhida = alternativas.find((alt) => alt.id === opcaoId);
  if (!escolhida) {
    throw erroDeValidacao("Alternativa inválida para este desafio.");
  }
  return escolhida.correta === true;
}

function avaliarOrdenacaoDeBlocos(alternativas, ordem) {
  const ordemCorreta = alternativas?.ordemCorreta;
  if (!Array.isArray(ordemCorreta)) {
    throw erroDeValidacao("Este desafio não aceita esse formato de resposta.");
  }
  if (!Array.isArray(ordem) || ordem.length !== ordemCorreta.length) {
    return false;
  }
  return ordem.every((id, i) => id === ordemCorreta[i]);
}

// Confere a resposta contra o gabarito de Desafio.alternativas (nunca confia
// num "correta: true" vindo do cliente) e grava o resultado em Progresso. O
// XP só é somado em Usuario.xpTotal na primeira vez que o jogador acerta
// esse desafio — tentativas repetidas depois de já ter concluído não geram
// XP de novo.
//
// Identifica o desafio por (mundoId, dificuldade, numero) — o mesmo trio que
// já vem nos :params da URL no frontend (ex: /codigo/1/iniciante/2) — e não
// pelo "id" (PK) do banco, que o frontend nunca chega a conhecer.
async function responderDesafio({ usuarioId, mundoId, dificuldade, numero, opcaoId, ordem }) {
  const numeroDesafio = Number(numero);

  if (!mundoId || !dificuldade || !Number.isInteger(numeroDesafio)) {
    throw erroDeValidacao("Informe o desafio respondido (mundoId, dificuldade e numero).");
  }
  if (!opcaoId && !Array.isArray(ordem)) {
    throw erroDeValidacao("Informe a alternativa escolhida ou a ordem dos blocos.");
  }

  const desafio = await prisma.desafio.findUnique({
    where: {
      mundoId_dificuldade_numero: {
        mundoId: Number(mundoId),
        dificuldade,
        numero: numeroDesafio,
      },
    },
    include: { itemRecompensa: true },
  });

  if (!desafio) {
    const erro = new Error("Desafio não encontrado.");
    erro.status = 404;
    throw erro;
  }

  const idDesafio = desafio.id;

  const correta = Array.isArray(desafio.alternativas)
    ? avaliarMultiplaEscolha(desafio.alternativas, opcaoId)
    : avaliarOrdenacaoDeBlocos(desafio.alternativas, ordem);

  const progressoAnterior = await prisma.progresso.findUnique({
    where: { usuarioId_desafioId: { usuarioId, desafioId: idDesafio } },
  });

  const jaEstavaConcluido = progressoAnterior?.concluido ?? false;
  const primeiraVezConcluindo = correta && !jaEstavaConcluido;

  const dados = {
    tentativas: (progressoAnterior?.tentativas ?? 0) + 1,
    concluido: jaEstavaConcluido || correta,
  };

  if (primeiraVezConcluindo) {
    dados.xpGanho = desafio.xpConcedido;
    dados.dataConclusao = new Date();
  }

  const progresso = progressoAnterior
    ? await prisma.progresso.update({
        where: { usuarioId_desafioId: { usuarioId, desafioId: idDesafio } },
        data: dados,
      })
    : await prisma.progresso.create({
        data: { usuarioId, desafioId: idDesafio, ...dados },
      });

  if (primeiraVezConcluindo) {
    await prisma.usuario.update({
      where: { id: usuarioId },
      data: { xpTotal: { increment: desafio.xpConcedido } },
    });
  }

  // Recompensa em item só é concedida (some ao inventário) na primeira
  // conclusão — mas o item continua sendo informado em respostas seguintes
  // (rejogar um desafio já vencido), só que sem mexer no inventário de novo.
  // Sem isso, a tela de recompensa não tinha como saber qual é o item certo
  // numa segunda tentativa e caía no conteúdo antigo hardcoded do frontend.
  let itemGanho = null;
  if (correta && desafio.itemRecompensaId) {
    itemGanho = primeiraVezConcluindo
      ? await concederItemAoPersonagem(usuarioId, desafio.itemRecompensa)
      : formatarItem(desafio.itemRecompensa);
  }

  return {
    correta,
    concluido: progresso.concluido,
    tentativas: progresso.tentativas,
    xpGanho: progresso.xpGanho,
    xpConcedidoAgora: primeiraVezConcluindo ? desafio.xpConcedido : 0,
    itemGanho,
  };
}

function formatarItem(item, quantidade) {
  return {
    id: item.id,
    nome: item.nome,
    tipo: item.tipo,
    raridade: item.raridade,
    descricao: item.descricao,
    icone: item.icone,
    ...(quantidade !== undefined ? { quantidade } : {}),
  };
}

// Adiciona o item ao inventário do personagem (cria o personagem se for o
// primeiro item dele) — se ele já tinha esse item, só soma quantidade em vez
// de duplicar a linha em ItemPersonagem.
async function concederItemAoPersonagem(usuarioId, item) {
  const personagem = await buscarOuCriarPersonagem(usuarioId);

  const itemPersonagemExistente = await prisma.itemPersonagem.findUnique({
    where: { personagemId_itemId: { personagemId: personagem.id, itemId: item.id } },
  });

  const itemPersonagem = itemPersonagemExistente
    ? await prisma.itemPersonagem.update({
        where: { id: itemPersonagemExistente.id },
        data: { quantidade: { increment: 1 } },
      })
    : await prisma.itemPersonagem.create({
        data: { personagemId: personagem.id, itemId: item.id },
      });

  return formatarItem(item, itemPersonagem.quantidade);
}

// Progresso do usuário cruzado com os desafios cadastrados — é a fonte de
// verdade para o desbloqueio progressivo (hoje calculado no frontend via
// localStorage em data/progresso.js). Sem mundoId/dificuldade, devolve o
// progresso em todos os desafios do usuário.
async function listarProgresso({ usuarioId, mundoId, dificuldade }) {
  const filtroTrilha = mundoId && dificuldade
    ? { mundoId: Number(mundoId), dificuldade }
    : undefined;

  const desafios = await prisma.desafio.findMany({
    where: filtroTrilha,
    orderBy: [{ mundoId: "asc" }, { dificuldade: "asc" }, { numero: "asc" }],
    select: { id: true, mundoId: true, dificuldade: true, numero: true },
  });

  const progressos = await prisma.progresso.findMany({
    where: { usuarioId, desafioId: { in: desafios.map((d) => d.id) } },
  });

  const progressoPorDesafio = new Map(progressos.map((p) => [p.desafioId, p]));

  return desafios.map((desafio) => ({
    desafioId: desafio.id,
    mundoId: desafio.mundoId,
    dificuldade: desafio.dificuldade,
    numero: desafio.numero,
    concluido: progressoPorDesafio.get(desafio.id)?.concluido ?? false,
    tentativas: progressoPorDesafio.get(desafio.id)?.tentativas ?? 0,
  }));
}

module.exports = { responderDesafio, listarProgresso };
