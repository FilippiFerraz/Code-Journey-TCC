const prisma = require("../config/prisma");
const { buscarOuCriarPersonagem } = require("./personagem.service");

function erroDeValidacao(mensagem) {
  const erro = new Error(mensagem);
  erro.status = 400;
  return erro;
}

// Confere a alternativa escolhida contra o gabarito de Desafio.alternativas
// (nunca confia num "correta: true" vindo do cliente) e grava o resultado em
// Progresso. O XP só é somado em Usuario.xpTotal na primeira vez que o
// jogador acerta esse desafio — tentativas repetidas depois de já ter
// concluído não geram XP de novo.
//
// Identifica o desafio por (mundoId, dificuldade, numero) — o mesmo trio que
// já vem nos :params da URL no frontend (ex: /codigo/1/iniciante/2) — e não
// pelo "id" (PK) do banco, que o frontend nunca chega a conhecer.
async function responderDesafio({ usuarioId, mundoId, dificuldade, numero, opcaoId }) {
  const numeroDesafio = Number(numero);

  if (!mundoId || !dificuldade || !Number.isInteger(numeroDesafio)) {
    throw erroDeValidacao("Informe o desafio respondido (mundoId, dificuldade e numero).");
  }
  if (!opcaoId) {
    throw erroDeValidacao("Informe a alternativa escolhida.");
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

  const alternativas = Array.isArray(desafio.alternativas) ? desafio.alternativas : [];
  const escolhida = alternativas.find((alt) => alt.id === opcaoId);

  if (!escolhida) {
    throw erroDeValidacao("Alternativa inválida para este desafio.");
  }

  const correta = escolhida.correta === true;

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

  // Recompensa em item só é concedida (uma vez) na primeira conclusão, e só
  // quando o desafio tem um Item real associado — "insignia" ou desafios
  // ainda sem itemRecompensaId não mexem no inventário.
  let itemGanho = null;
  if (primeiraVezConcluindo && desafio.itemRecompensaId) {
    itemGanho = await concederItemAoPersonagem(usuarioId, desafio.itemRecompensa);
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

  return {
    id: item.id,
    nome: item.nome,
    tipo: item.tipo,
    raridade: item.raridade,
    descricao: item.descricao,
    icone: item.icone,
    quantidade: itemPersonagem.quantidade,
  };
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
