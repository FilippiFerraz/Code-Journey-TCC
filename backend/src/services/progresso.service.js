const prisma = require("../config/prisma");
const { concederItemSeNaoTiver } = require("./personagem.service");
const { corrigirRespostaDissertativa } = require("./ia.service");
const { temVariasEtapas } = require("./etapas.service");
const { listarDesafiosResumo } = require("./desafiosCache");
const { consumirElixir, moedasPorVitoria } = require("./loja.service");

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
  // A lista de desafios vem da memória (desafiosCache.js) e as duas consultas
  // de progresso saem juntas — antes eram 4 consultas, uma depois da outra.
  const resumo = await listarDesafiosResumo();

  const anterior =
    desafio.numero > 1
      ? resumo.find(
          (d) =>
            d.mundoId === desafio.mundoId &&
            d.dificuldade === desafio.dificuldade &&
            d.numero === desafio.numero - 1
        )
      : null;
  const idsMundoAnterior =
    desafio.mundoId > 1
      ? resumo
          .filter((d) => d.mundoId === desafio.mundoId - 1 && d.dificuldade === DIFICULDADE_PADRAO)
          .map((d) => d.id)
      : null;

  const [progressoAnterior, concluidosMundoAnterior] = await Promise.all([
    anterior
      ? prisma.progresso.findUnique({
          where: { usuarioId_desafioId: { usuarioId, desafioId: anterior.id } },
          select: { concluido: true },
        })
      : null,
    idsMundoAnterior && idsMundoAnterior.length > 0
      ? prisma.progresso.count({
          where: { usuarioId, concluido: true, desafioId: { in: idsMundoAnterior } },
        })
      : 0,
  ]);

  if (desafio.numero > 1 && !progressoAnterior?.concluido) {
    throw erroDeDesafioTrancado("Conclua o desafio anterior antes de responder este.");
  }

  if (
    idsMundoAnterior &&
    (idsMundoAnterior.length === 0 || concluidosMundoAnterior < idsMundoAnterior.length)
  ) {
    throw erroDeDesafioTrancado("Conclua o mundo anterior antes de responder este desafio.");
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
  etapa,
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

  // Desafio com várias etapas (portal 3): regra própria — ver responderEtapa.
  if (temVariasEtapas(desafio.alternativas)) {
    return responderEtapa({
      usuarioId,
      desafio,
      etapa,
      resposta: { opcaoId, ordem, classificacoes, ingredientes, respostas, respostaTexto },
      tempoSegundos,
    });
  }

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

  // Primeira vitória: moedas pra Lojinha do Mago e, se houver um Elixir do
  // Sábio ativo, ele é gasto e o XP dobra (ver loja.service.js).
  let moedasGanhas = 0;
  let elixirUsado = false;
  if (primeiraVezConcluindo) {
    moedasGanhas = moedasPorVitoria(acertouDePrimeira);
    elixirUsado = await consumirElixir(usuarioId);
    if (elixirUsado) dados.xpGanho *= 2;
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
      data: { xpTotal: { increment: dados.xpGanho }, moedas: { increment: moedasGanhas } },
    });
  }

  // Recompensa em item: entra no inventário se o jogador ainda não tem esse
  // item — não depende de ser a primeira conclusão. Antes só a primeira
  // conclusão concedia, e quem tinha vencido o desafio ANTES de ele ganhar
  // um item via a recompensa na tela ao rejogar, mas nunca no inventário.
  // Rejogar com o item já no inventário não duplica (concederItemSeNaoTiver).
  let itemGanho = null;
  let recompensaJaRecebida = false;
  if (correta && desafio.itemRecompensaId) {
    const resultado = await concederItemAoPersonagem(usuarioId, desafio.itemRecompensa);
    itemGanho = resultado.item;
    recompensaJaRecebida = !resultado.concedido;
  }

  return {
    correta,
    // Mesmos campos da resposta de etapa (responderEtapa): a tela genérica
    // de desafios (DesafioEtapas) joga um desafio de etapa única como "1
    // etapa" e decide a vitória por desafioConcluido.
    etapa: 1,
    totalEtapas: 1,
    etapasConcluidas: progresso.concluido ? 1 : 0,
    desafioConcluido: correta,
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
    // Desafio REFEITO: já tinha sido concluído antes desta resposta (a tela
    // de recompensa mostra um elogio por ter vencido de novo).
    jaConcluidoAntes: correta && jaEstavaConcluido,
    // O item do desafio já estava no inventário — nada foi acrescentado.
    recompensaJaRecebida,
    // Só nos desafios dissertativos: explicação da IA sobre a correção.
    feedbackIA,
    // Lojinha do Mago: moedas ganhas agora e se um Elixir do Sábio dobrou o XP.
    moedasGanhas,
    elixirUsado,
  };
}

// ---- Desafios com várias etapas (portal 3) ----
//
// Cada resposta vale para UMA etapa (body.etapa, a partir de 1). Regras:
// - as etapas são feitas em ordem: o servidor só aceita a próxima etapa
//   (Progresso.etapasConcluidas + 1) — não dá pra pular direto pra última;
// - errar conta tentativa, mas não volta etapa nenhuma;
// - acertar a ÚLTIMA etapa conclui o desafio: XP (com bônus de velocidade e
//   de "sem errar nenhuma etapa") e o item de recompensa, como nos outros;
// - desafio já concluído pode ser refeito: qualquer etapa é aceita, sem XP
//   de novo, e a recompensa não acumula (ver concederItemSeNaoTiver).

// Mesmos validadores dos desafios de etapa única — cada etapa usa um dos
// formatos de sempre (múltipla escolha guarda as opções em "opcoes").
function avaliarEtapa(etapa, resposta) {
  if (etapa.tipo === "multipla_escolha") return avaliarMultiplaEscolha(etapa.opcoes, resposta.opcaoId);
  return avaliarResposta(etapa, resposta);
}

function erroDeConflito(mensagem) {
  const erro = new Error(mensagem);
  erro.status = 409;
  return erro;
}

async function responderEtapa({ usuarioId, desafio, etapa, resposta, tempoSegundos }) {
  const etapas = desafio.alternativas.etapas;
  const totalEtapas = etapas.length;
  const numeroEtapa = Number(etapa);
  if (!Number.isInteger(numeroEtapa) || numeroEtapa < 1 || numeroEtapa > totalEtapas) {
    throw erroDeValidacao(`Informe a etapa respondida (de 1 a ${totalEtapas}).`);
  }

  const chave = { usuarioId_desafioId: { usuarioId, desafioId: desafio.id } };
  const progressoAnterior = await prisma.progresso.findUnique({ where: chave });
  const jaConcluido = progressoAnterior?.concluido ?? false;
  const etapasFeitas = progressoAnterior?.etapasConcluidas ?? 0;

  if (!jaConcluido && numeroEtapa !== etapasFeitas + 1) {
    throw erroDeConflito(
      numeroEtapa <= etapasFeitas
        ? `Você já venceu a etapa ${numeroEtapa}. Siga para a etapa ${etapasFeitas + 1}.`
        : `Vença a etapa ${etapasFeitas + 1} antes de responder a etapa ${numeroEtapa}.`
    );
  }

  // Corrige a etapa (dissertativa vai pra IA — se ela falhar, o erro sobe
  // antes de gravar a tentativa, como nos desafios de etapa única).
  const dadosEtapa = etapas[numeroEtapa - 1];
  let correta;
  let feedbackIA = null;
  if (dadosEtapa.tipo === "dissertativa") {
    if (typeof resposta.respostaTexto !== "string") {
      throw erroDeValidacao("Esta etapa espera uma resposta escrita.");
    }
    const correcao = await corrigirRespostaDissertativa({
      enunciado: dadosEtapa.enunciado,
      codigo: dadosEtapa.codigo,
      criterios: dadosEtapa.criterios,
      respostaReferencia: dadosEtapa.respostaReferencia,
      resposta: resposta.respostaTexto,
    });
    correta = correcao.correta;
    feedbackIA = correcao.feedback;
  } else {
    correta = avaliarEtapa(dadosEtapa, resposta);
  }

  const ultimaEtapa = numeroEtapa === totalEtapas;
  const concluiAgora = correta && !jaConcluido && ultimaEtapa;
  // Sem errar nenhuma etapa: cada resposta conta 1 tentativa, então até
  // aqui o número de tentativas é exatamente o de etapas já vencidas.
  const semErros = (progressoAnterior?.tentativas ?? 0) === etapasFeitas;

  const dados = { tentativas: (progressoAnterior?.tentativas ?? 0) + 1 };
  if (correta && !jaConcluido) dados.etapasConcluidas = numeroEtapa;

  let xpBase = 0;
  let bonusVelocidade = 0;
  let bonusPrimeiraTentativa = 0;
  if (concluiAgora) {
    xpBase = desafio.xpConcedido;
    // tempoSegundos é o tempo TOTAL do desafio; a régua de bônus é por etapa.
    bonusVelocidade = calcularBonusVelocidade(Number(tempoSegundos) / totalEtapas);
    bonusPrimeiraTentativa = semErros ? BONUS_PRIMEIRA_TENTATIVA : 0;

    dados.concluido = true;
    dados.xpGanho = xpBase + bonusVelocidade + bonusPrimeiraTentativa;
    dados.dataConclusao = new Date();
    dados.tempoSegundos = Number.isFinite(Number(tempoSegundos))
      ? Math.max(0, Math.round(Number(tempoSegundos)))
      : null;
  }

  // Mesmas moedas e Elixir do Sábio dos desafios de etapa única.
  let moedasGanhas = 0;
  let elixirUsado = false;
  if (concluiAgora) {
    moedasGanhas = moedasPorVitoria(semErros);
    elixirUsado = await consumirElixir(usuarioId);
    if (elixirUsado) dados.xpGanho *= 2;
  }

  const progresso = progressoAnterior
    ? await prisma.progresso.update({ where: chave, data: dados })
    : await prisma.progresso.create({ data: { usuarioId, desafioId: desafio.id, ...dados } });

  if (concluiAgora) {
    await prisma.usuario.update({
      where: { id: usuarioId },
      data: { xpTotal: { increment: dados.xpGanho }, moedas: { increment: moedasGanhas } },
    });
  }

  // Recompensa só ao vencer a última etapa (primeira vez ou refazendo).
  let itemGanho = null;
  let recompensaJaRecebida = false;
  if (correta && ultimaEtapa && desafio.itemRecompensaId) {
    const resultado = await concederItemAoPersonagem(usuarioId, desafio.itemRecompensa);
    itemGanho = resultado.item;
    recompensaJaRecebida = !resultado.concedido;
  }

  return {
    correta,
    etapa: numeroEtapa,
    totalEtapas,
    etapasConcluidas: progresso.etapasConcluidas,
    // true quando ESTA resposta venceu a última etapa (primeira vez ou refazendo)
    desafioConcluido: correta && ultimaEtapa,
    concluido: progresso.concluido,
    tentativas: progresso.tentativas,
    xpGanho: progresso.xpGanho,
    xpConcedidoAgora: dados.xpGanho ?? 0,
    xpBase,
    bonusVelocidade,
    bonusPrimeiraTentativa,
    acertouDePrimeira: concluiAgora ? semErros : false,
    tempoSegundos: progresso.tempoSegundos,
    itemGanho,
    jaConcluidoAntes: correta && ultimaEtapa && jaConcluido,
    recompensaJaRecebida,
    feedbackIA,
    moedasGanhas,
    elixirUsado,
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

// Adiciona o item ao inventário do personagem, se ele ainda não tiver (ver
// concederItemSeNaoTiver em personagem.service.js). Devolve { item, concedido }.
async function concederItemAoPersonagem(usuarioId, item) {
  const { quantidade, concedido } = await concederItemSeNaoTiver(usuarioId, item.id);
  return { item: formatarItem(item, quantidade), concedido };
}

// Progresso do usuário cruzado com os desafios cadastrados — é a fonte de
// verdade para o desbloqueio progressivo (hoje calculado no frontend via
// localStorage em data/progresso.js). Sem mundoId/dificuldade, devolve o
// progresso em todos os desafios do usuário.
async function listarProgresso({ usuarioId, mundoId, dificuldade }) {
  const filtrar = mundoId && dificuldade;
  const mundoNumero = Number(mundoId);

  // Lista de desafios (memória) e progresso do jogador saem juntos; o
  // progresso já vem filtrado pela trilha direto no banco.
  const [resumo, progressos] = await Promise.all([
    listarDesafiosResumo(),
    prisma.progresso.findMany({
      where: {
        usuarioId,
        ...(filtrar ? { desafio: { mundoId: mundoNumero, dificuldade } } : {}),
      },
      select: { desafioId: true, concluido: true, tentativas: true, etapasConcluidas: true },
    }),
  ]);

  const progressoPorDesafio = new Map(progressos.map((p) => [p.desafioId, p]));
  const desafios = filtrar
    ? resumo.filter((d) => d.mundoId === mundoNumero && d.dificuldade === dificuldade)
    : resumo;

  return desafios.map((desafio) => ({
    desafioId: desafio.id,
    mundoId: desafio.mundoId,
    dificuldade: desafio.dificuldade,
    numero: desafio.numero,
    concluido: progressoPorDesafio.get(desafio.id)?.concluido ?? false,
    tentativas: progressoPorDesafio.get(desafio.id)?.tentativas ?? 0,
    // Desafios com várias etapas (portal 3) — a lista usa isso pra abrir a
    // tela de etapas e mostrar o avanço (ex: 2/3). Etapa única = 1.
    totalEtapas: desafio.totalEtapas,
    etapasConcluidas: progressoPorDesafio.get(desafio.id)?.etapasConcluidas ?? 0,
  }));
}

module.exports = { responderDesafio, listarProgresso, verificarDesafioLiberado };
