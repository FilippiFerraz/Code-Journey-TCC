const prisma = require("../config/prisma");
const { verificarDesafioLiberado } = require("./progresso.service");
const { etapasDoDesafio, etapaPublica, temVariasEtapas } = require("./etapas.service");

// Conteúdo de um desafio pra tela do jogo (GET /api/desafios/:mundoId/:dificuldade/:numero),
// SEM gabarito, mais o avanço do jogador nele. Serve qualquer desafio, mas é
// a fonte de conteúdo dos desafios com várias etapas (portal 3), que não
// têm nada fixo no frontend — então a tela pode ser redesenhada à vontade.
async function buscarDesafioParaJogar(usuarioId, { mundoId, dificuldade, numero }) {
  const desafio = await prisma.desafio.findUnique({
    where: { mundoId_dificuldade_numero: { mundoId, dificuldade, numero } },
  });
  if (!desafio) {
    const erro = new Error("Desafio não encontrado.");
    erro.status = 404;
    throw erro;
  }

  // Mesmas regras de desbloqueio da resposta: desafio trancado nem mostra
  // o conteúdo (403).
  await verificarDesafioLiberado(usuarioId, desafio);

  const progresso = await prisma.progresso.findUnique({
    where: { usuarioId_desafioId: { usuarioId, desafioId: desafio.id } },
    select: { concluido: true, etapasConcluidas: true, tentativas: true },
  });

  const etapas = etapasDoDesafio(desafio).map(etapaPublica);

  return {
    mundoId: desafio.mundoId,
    dificuldade: desafio.dificuldade,
    numero: desafio.numero,
    titulo: desafio.titulo,
    enunciado: desafio.enunciado,
    dica: desafio.dica,
    xpConcedido: desafio.xpConcedido,
    variasEtapas: temVariasEtapas(desafio.alternativas),
    etapas,
    progresso: {
      concluido: progresso?.concluido ?? false,
      etapasConcluidas: progresso?.etapasConcluidas ?? 0,
      totalEtapas: etapas.length,
      tentativas: progresso?.tentativas ?? 0,
    },
  };
}

// Confere UMA ação dentro de uma etapa — sem registrar nada. É o que permite
// à tela dar retorno imediato, ação por ação, como nos outros portais (onde
// o gabarito fica no frontend): cada cartão arrastado, cada ingrediente
// jogado no caldeirão, cada golpe no chefe. A conclusão da etapa continua
// sendo a resposta completa em POST /api/progresso, revalidada inteira.
//   avaliar_codigo: { indiceCarta, marcouCerto }  -> o cartão foi classificado certo?
//   montar_pocao:   { posicao, ingredienteId }    -> é o ingrediente dessa posição?
//   batalha_chefe:  { perguntaId, opcaoId }       -> a opção acerta a pergunta?
async function verificarAcaoDaEtapa(usuarioId, { mundoId, dificuldade, numero }, dados) {
  const desafio = await prisma.desafio.findUnique({
    where: { mundoId_dificuldade_numero: { mundoId, dificuldade, numero } },
  });
  if (!desafio) {
    const erro = new Error("Desafio não encontrado.");
    erro.status = 404;
    throw erro;
  }
  await verificarDesafioLiberado(usuarioId, desafio);

  // Mesma regra de ordem de POST /api/progresso: só a próxima etapa (ou
  // qualquer uma, se o desafio já foi concluído e está sendo refeito).
  // Desafio de etapa única vira uma lista de 1 (etapasDoDesafio) — é assim
  // que a tela genérica (DesafioEtapas) joga os desafios dos portais 1 e 2
  // que não têm tela própria no frontend.
  const etapas = etapasDoDesafio(desafio);
  const progresso = await prisma.progresso.findUnique({
    where: { usuarioId_desafioId: { usuarioId, desafioId: desafio.id } },
    select: { concluido: true, etapasConcluidas: true },
  });
  const etapasFeitas = progresso?.etapasConcluidas ?? 0;
  if (dados.etapa < 1 || dados.etapa > etapas.length) {
    throw erroComStatus(`Informe a etapa (de 1 a ${etapas.length}).`, 400);
  }
  if (!progresso?.concluido && dados.etapa !== etapasFeitas + 1) {
    throw erroComStatus(`A etapa liberada agora é a ${etapasFeitas + 1}.`, 409);
  }

  const etapa = etapas[dados.etapa - 1];
  switch (etapa.tipo) {
    case "avaliar_codigo": {
      const carta = etapa.cartas[dados.indiceCarta];
      if (!carta || typeof dados.marcouCerto !== "boolean") throw erroComStatus("Informe o cartão e a classificação.", 400);
      return { correto: carta.correta === dados.marcouCerto };
    }
    case "montar_pocao": {
      if (!Number.isInteger(dados.posicao) || !dados.ingredienteId) throw erroComStatus("Informe a posição e o ingrediente.", 400);
      return { correto: etapa.ingredientesCorretos[dados.posicao]?.id === dados.ingredienteId };
    }
    case "batalha_chefe": {
      const pergunta = etapa.perguntas.find((p) => p.id === dados.perguntaId);
      const opcao = pergunta?.opcoes.find((o) => o.id === dados.opcaoId);
      if (!opcao) throw erroComStatus("Informe a pergunta e a opção escolhida.", 400);
      return { correto: opcao.correta === true };
    }
    default:
      throw erroComStatus("Esta etapa não tem verificação por ação — envie a resposta completa.", 400);
  }
}

function erroComStatus(mensagem, status) {
  const erro = new Error(mensagem);
  erro.status = status;
  return erro;
}

module.exports = { buscarDesafioParaJogar, verificarAcaoDaEtapa };
