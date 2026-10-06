const prisma = require("../config/prisma");
const { concederItem } = require("./personagem.service");
const { corrigirRespostaDissertativa } = require("./ia.service");

function erroDeValidacao(mensagem) {
  const erro = new Error(mensagem);
  erro.status = 400;
  return erro;
}

// ---- Pontuação por tempo e acerto de primeira ----
//
// Até este tempo (segundos), o jogador ganha o bônus de velocidade cheio;
// a partir do tempo "lento", não ganha bônus nenhum — entre os dois, o
// bônus cai linearmente. Pensado pra respostas de múltipla escolha e
// ordenar blocos; numa dissertativa (que já tem uma correção de ~1,5s
// simulada no frontend) o jogador tende a demorar um pouco mais mesmo
// sabendo a resposta, mas a mesma régua serve como incentivo a não deixar
// o desafio "pausado" na tela por muito tempo.
const TEMPO_BONUS_MAXIMO_SEGUNDOS = 20;
const TEMPO_BONUS_MINIMO_SEGUNDOS = 90;
const BONUS_VELOCIDADE_MAXIMO = 5;

// Bônus fixo por acertar já na primeira tentativa (nenhuma resposta errada
// registrada antes desta em Progresso.tentativas) — incentiva pensar antes
// de responder, não só responder rápido.
const BONUS_PRIMEIRA_TENTATIVA = 5;

function calcularBonusVelocidade(tempoSegundos) {
  if (!Number.isFinite(tempoSegundos) || tempoSegundos < 0) return 0;
  if (tempoSegundos <= TEMPO_BONUS_MAXIMO_SEGUNDOS) return BONUS_VELOCIDADE_MAXIMO;
  if (tempoSegundos >= TEMPO_BONUS_MINIMO_SEGUNDOS) return 0;

  const fracaoRestante =
    (TEMPO_BONUS_MINIMO_SEGUNDOS - tempoSegundos) /
    (TEMPO_BONUS_MINIMO_SEGUNDOS - TEMPO_BONUS_MAXIMO_SEGUNDOS);
  return Math.round(BONUS_VELOCIDADE_MAXIMO * fracaoRestante);
}

// Desafio.alternativas é Json livre e hoje guarda um de cinco formatos (ver
// componentes de desafio no frontend):
// - múltipla escolha: array [{ id, texto, correta }] -> valida opcaoId
// - ordenar blocos: objeto { tipo: "ordenar_blocos", blocos, ordemCorreta } -> valida ordem
// - avaliar código: objeto { tipo: "avaliar_codigo", cartas: [{id, codigo, correta}] }
//   -> valida classificacoes (array de booleans, um "marcou certo?" por cartão)
// - montar poção: objeto { tipo: "montar_pocao", ingredientesCorretos: [{id, codigo}], distratores }
//   -> valida ingredientes (array de ids, na ordem em que entraram no caldeirão)
// - batalha de chefe: objeto { tipo: "batalha_chefe", vidasNecessarias, perguntas: [{id, opcoes}] }
//   -> valida respostas (array de { perguntaId, opcaoId }, uma por golpe certeiro)
// - dissertativa: objeto { tipo: "dissertativa", codigo?, criterios: [texto], respostaReferencia? }
//   -> valida respostaTexto com a IA (ver ia.service.js), fora de avaliarResposta
//   porque é assíncrona e também devolve um feedback escrito pro jogador
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

function avaliarCartoes(alternativas, classificacoes) {
  const cartas = alternativas?.cartas;
  if (!Array.isArray(cartas)) {
    throw erroDeValidacao("Este desafio não aceita esse formato de resposta.");
  }
  if (!Array.isArray(classificacoes) || classificacoes.length !== cartas.length) {
    return false;
  }
  return classificacoes.every((marcouCerto, i) => marcouCerto === cartas[i].correta);
}

function avaliarPocao(alternativas, ingredientes) {
  const ingredientesCorretos = alternativas?.ingredientesCorretos;
  if (!Array.isArray(ingredientesCorretos)) {
    throw erroDeValidacao("Este desafio não aceita esse formato de resposta.");
  }
  if (!Array.isArray(ingredientes) || ingredientes.length !== ingredientesCorretos.length) {
    return false;
  }
  return ingredientes.every((id, i) => id === ingredientesCorretos[i].id);
}

// Confere cada golpe certeiro da batalha de chefe contra o pool de
// perguntas guardado em alternativas.perguntas — precisa vir exatamente
// "vidasNecessarias" respostas, todas com opcaoId correto pra pergunta
// indicada (a mesma pergunta do pool pode se repetir, ver indicePergunta em
// DesafioChefe.jsx).
function avaliarBatalhaChefe(alternativas, respostas) {
  const perguntas = alternativas?.perguntas;
  const vidasNecessarias = alternativas?.vidasNecessarias;
  if (!Array.isArray(perguntas) || !Number.isInteger(vidasNecessarias)) {
    throw erroDeValidacao("Este desafio não aceita esse formato de resposta.");
  }
  if (!Array.isArray(respostas) || respostas.length !== vidasNecessarias) {
    return false;
  }

  const perguntasPorId = new Map(perguntas.map((p) => [p.id, p]));
  return respostas.every(({ perguntaId, opcaoId }) => {
    const pergunta = perguntasPorId.get(perguntaId);
    const opcao = pergunta?.opcoes.find((o) => o.id === opcaoId);
    return opcao?.correta === true;
  });
}

// Escolhe o validador certo a partir do formato de Desafio.alternativas —
// array é sempre múltipla escolha; objeto usa o campo "tipo" pra decidir
// entre os demais formatos.
function avaliarResposta(alternativas, { opcaoId, ordem, classificacoes, ingredientes, respostas }) {
  if (Array.isArray(alternativas)) {
    return avaliarMultiplaEscolha(alternativas, opcaoId);
  }
  if (alternativas?.tipo === "avaliar_codigo") {
    return avaliarCartoes(alternativas, classificacoes);
  }
  if (alternativas?.tipo === "montar_pocao") {
    return avaliarPocao(alternativas, ingredientes);
  }
  if (alternativas?.tipo === "batalha_chefe") {
    return avaliarBatalhaChefe(alternativas, respostas);
  }
  return avaliarOrdenacaoDeBlocos(alternativas, ordem);
}

// Trilha usada pra checar o progresso entre mundos — mesma regra de
// mundoLiberado em frontend/src/data/progresso.js.
const DIFICULDADE_PADRAO = "iniciante";

function erroDeDesafioTrancado(mensagem) {
  const erro = new Error(mensagem);
  erro.status = 403;
  return erro;
}

// Mesmas regras de desbloqueio do frontend (data/progresso.js), revalidadas
// aqui porque a tela de um desafio pode ser aberta digitando a URL direto
// (ex: /codigo/1/iniciante/5) — sem isso dava pra pular desafios e ganhar o
// XP e o item deles. Desafio N só aceita resposta com o N-1 concluído; um
// mundo > 1 só com todos os desafios da trilha padrão do mundo anterior
// concluídos.
async function verificarDesafioLiberado(usuarioId, desafio) {
  if (desafio.numero > 1) {
    const anterior = await prisma.desafio.findUnique({
      where: {
        mundoId_dificuldade_numero: {
          mundoId: desafio.mundoId,
          dificuldade: desafio.dificuldade,
          numero: desafio.numero - 1,
        },
      },
      select: { id: true },
    });
    const progressoAnterior = anterior
      ? await prisma.progresso.findUnique({
          where: { usuarioId_desafioId: { usuarioId, desafioId: anterior.id } },
          select: { concluido: true },
        })
      : null;

    if (!progressoAnterior?.concluido) {
      throw erroDeDesafioTrancado("Conclua o desafio anterior antes de responder este.");
    }
  }

  if (desafio.mundoId > 1) {
    const desafiosMundoAnterior = await prisma.desafio.findMany({
      where: { mundoId: desafio.mundoId - 1, dificuldade: DIFICULDADE_PADRAO },
      select: { id: true },
    });
    const concluidos = await prisma.progresso.count({
      where: {
        usuarioId,
        concluido: true,
        desafioId: { in: desafiosMundoAnterior.map((d) => d.id) },
      },
    });

    if (desafiosMundoAnterior.length === 0 || concluidos < desafiosMundoAnterior.length) {
      throw erroDeDesafioTrancado("Conclua o mundo anterior antes de responder este desafio.");
    }
  }
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
async function responderDesafio({
  usuarioId,
  mundoId,
  dificuldade,
  numero,
  opcaoId,
  ordem,
  classificacoes,
  ingredientes,
  respostas,
  respostaTexto,
  tempoSegundos,
}) {
  const numeroDesafio = Number(numero);

  if (!mundoId || !dificuldade || !Number.isInteger(numeroDesafio)) {
    throw erroDeValidacao("Informe o desafio respondido (mundoId, dificuldade e numero).");
  }
  if (
    !opcaoId &&
    !Array.isArray(ordem) &&
    !Array.isArray(classificacoes) &&
    !Array.isArray(ingredientes) &&
    !Array.isArray(respostas) &&
    typeof respostaTexto !== "string"
  ) {
    throw erroDeValidacao(
      "Informe a alternativa escolhida, a ordem dos blocos, as classificações dos cartões, os ingredientes da poção, as respostas da batalha ou o texto da resposta."
    );
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

  await verificarDesafioLiberado(usuarioId, desafio);

  const idDesafio = desafio.id;

  // Dissertativa: quem decide é a IA, que também devolve um feedback
  // explicando o porquê. Se a IA falhar, o erro sobe ANTES de gravar
  // qualquer tentativa — o jogador não é penalizado por falha do servidor.
  let correta;
  let feedbackIA = null;
  if (desafio.alternativas?.tipo === "dissertativa") {
    const { codigo, criterios, respostaReferencia } = desafio.alternativas;
    if (!Array.isArray(criterios) || criterios.length === 0) {
      throw erroDeValidacao("Este desafio dissertativo não tem critérios de correção cadastrados.");
    }
    if (typeof respostaTexto !== "string") {
      throw erroDeValidacao("Este desafio espera uma resposta escrita.");
    }
    const correcao = await corrigirRespostaDissertativa({
      enunciado: desafio.enunciado,
      codigo,
      criterios,
      respostaReferencia,
      resposta: respostaTexto,
    });
    correta = correcao.correta;
    feedbackIA = correcao.feedback;
  } else {
    correta = avaliarResposta(desafio.alternativas, {
      opcaoId,
      ordem,
      classificacoes,
      ingredientes,
      respostas,
    });
  }

  const progressoAnterior = await prisma.progresso.findUnique({
    where: { usuarioId_desafioId: { usuarioId, desafioId: idDesafio } },
  });

  const jaEstavaConcluido = progressoAnterior?.concluido ?? false;
  const primeiraVezConcluindo = correta && !jaEstavaConcluido;
  // Sem registro anterior nenhum = esta é a primeira submissão de todas pra
  // este desafio, não só a primeira que acertou (alguém pode ter errado
  // antes e voltado depois) — só conta bônus de "primeira tentativa" nesse
  // caso mais estrito.
  const acertouDePrimeira = correta && !progressoAnterior;

  const dados = {
    tentativas: (progressoAnterior?.tentativas ?? 0) + 1,
    concluido: jaEstavaConcluido || correta,
  };

  let xpBase = 0;
  let bonusVelocidade = 0;
  let bonusPrimeiraTentativa = 0;

  if (primeiraVezConcluindo) {
    xpBase = desafio.xpConcedido;
    bonusVelocidade = calcularBonusVelocidade(Number(tempoSegundos));
    bonusPrimeiraTentativa = acertouDePrimeira ? BONUS_PRIMEIRA_TENTATIVA : 0;

    dados.xpGanho = xpBase + bonusVelocidade + bonusPrimeiraTentativa;
    dados.dataConclusao = new Date();
    dados.tempoSegundos = Number.isFinite(Number(tempoSegundos))
      ? Math.max(0, Math.round(Number(tempoSegundos)))
      : null;
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
      data: { xpTotal: { increment: dados.xpGanho } },
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
    xpConcedidoAgora: dados.xpGanho ?? 0,
    // Detalhamento de como xpConcedidoAgora foi calculado — só faz sentido
    // quando essa resposta concedeu XP de fato (fora disso vem tudo zerado).
    xpBase,
    bonusVelocidade,
    bonusPrimeiraTentativa,
    acertouDePrimeira: primeiraVezConcluindo ? acertouDePrimeira : false,
    tempoSegundos: progresso.tempoSegundos,
    itemGanho,
    // Só nos desafios dissertativos: explicação da IA sobre a correção.
    feedbackIA,
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
    imagemUrl: item.imagemUrl,
    ...(quantidade !== undefined ? { quantidade } : {}),
  };
}

// Adiciona o item ao inventário do personagem (ver concederItem em
// personagem.service.js — mesma regra usada pelo baú de fim de mundo).
async function concederItemAoPersonagem(usuarioId, item) {
  const quantidade = await concederItem(usuarioId, item.id);
  return formatarItem(item, quantidade);
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
