// Formato do conteúdo de um desafio (Desafio.alternativas) e a versão
// PÚBLICA dele, sem o gabarito, entregue à tela do jogo.
//
// Um desafio pode ter uma etapa só (portais 1 e 2 — alternativas já é o
// próprio exercício) ou várias etapas (portal 3):
//   { tipo: "etapas", etapas: [etapa, etapa, ...] }
// Cada etapa tem titulo, enunciado, codigo (opcional), dica e os dados de
// UM tipo de exercício (mesmos formatos de sempre — ver
// prisma/desafios/portal3.js e progresso.service.js::avaliarResposta).
//
// A conclusão por etapas (qual etapa o jogador pode responder, XP só no
// fim) fica em progresso.service.js::responderEtapa.

const TIPOS_EXERCICIO = [
  "multipla_escolha",
  "ordenar_blocos",
  "avaliar_codigo",
  "montar_pocao",
  "batalha_chefe",
  "dissertativa",
];

function erroDeValidacao(mensagem) {
  const erro = new Error(mensagem);
  erro.status = 400;
  return erro;
}

// Tipo do exercício de uma etapa ou de um desafio de etapa única
// (alternativas em array = múltipla escolha, sem campo "tipo").
function tipoDoExercicio(conteudo) {
  if (Array.isArray(conteudo)) return "multipla_escolha";
  return conteudo?.tipo;
}

function temVariasEtapas(alternativas) {
  return alternativas?.tipo === "etapas" && Array.isArray(alternativas.etapas);
}

// Lista de etapas de qualquer desafio. Desafio de etapa única vira uma
// lista de 1, pra API e a tela tratarem todos do mesmo jeito.
function etapasDoDesafio(desafio) {
  if (temVariasEtapas(desafio.alternativas)) return desafio.alternativas.etapas;
  const alternativas = desafio.alternativas;
  const etapaUnica = Array.isArray(alternativas)
    ? { tipo: "multipla_escolha", opcoes: alternativas }
    : { ...alternativas };
  return [{ ...etapaUnica, titulo: desafio.titulo, enunciado: desafio.enunciado, dica: desafio.dica }];
}

function totalDeEtapas(alternativas) {
  return temVariasEtapas(alternativas) ? alternativas.etapas.length : 1;
}

// ---------- Validação da estrutura (seed e editor de admin) ----------

const textoPreenchido = (valor) => typeof valor === "string" && valor.trim().length > 0;

function validarOpcoes(opcoes, onde) {
  if (!Array.isArray(opcoes) || opcoes.length < 2) {
    throw erroDeValidacao(`${onde}: inclua ao menos duas alternativas.`);
  }
  if (!opcoes.some((opcao) => opcao.correta === true)) {
    throw erroDeValidacao(`${onde}: marque qual alternativa é a correta.`);
  }
  for (const opcao of opcoes) {
    if (!opcao.id || !textoPreenchido(opcao.texto)) {
      throw erroDeValidacao(`${onde}: cada alternativa precisa de id e texto.`);
    }
  }
}

function validarListaDeCodigo(lista, onde, nome) {
  if (!Array.isArray(lista) || lista.length === 0) {
    throw erroDeValidacao(`${onde}: informe ao menos um item em "${nome}".`);
  }
  for (const item of lista) {
    if (!item.id || !textoPreenchido(item.codigo)) {
      throw erroDeValidacao(`${onde}: cada item de "${nome}" precisa de id e código.`);
    }
  }
}

// Valida o conteúdo de um exercício conforme o tipo. "onde" identifica a
// etapa nas mensagens de erro.
function validarExercicio(conteudo, onde = "Desafio") {
  const tipo = tipoDoExercicio(conteudo);

  switch (tipo) {
    case "multipla_escolha":
      validarOpcoes(Array.isArray(conteudo) ? conteudo : conteudo.opcoes, onde);
      return;

    case "ordenar_blocos": {
      validarListaDeCodigo(conteudo.blocos, onde, "blocos");
      const ids = new Set(conteudo.blocos.map((bloco) => bloco.id));
      if (
        !Array.isArray(conteudo.ordemCorreta) ||
        conteudo.ordemCorreta.length !== conteudo.blocos.length ||
        !conteudo.ordemCorreta.every((id) => ids.has(id))
      ) {
        throw erroDeValidacao(`${onde}: a ordem correta precisa citar todos os blocos, uma vez cada.`);
      }
      return;
    }

    case "avaliar_codigo":
      validarListaDeCodigo(conteudo.cartas, onde, "cartas");
      if (!conteudo.cartas.every((carta) => typeof carta.correta === "boolean")) {
        throw erroDeValidacao(`${onde}: cada carta precisa dizer se o código está correto (true/false).`);
      }
      return;

    case "montar_pocao":
      validarListaDeCodigo(conteudo.ingredientesCorretos, onde, "ingredientesCorretos");
      if (conteudo.distratores !== undefined) validarListaDeCodigo(conteudo.distratores, onde, "distratores");
      return;

    case "batalha_chefe": {
      if (!Number.isInteger(conteudo.vidasNecessarias) || conteudo.vidasNecessarias < 1) {
        throw erroDeValidacao(`${onde}: informe vidasNecessarias (inteiro, 1 ou mais).`);
      }
      if (!Array.isArray(conteudo.perguntas) || conteudo.perguntas.length === 0) {
        throw erroDeValidacao(`${onde}: inclua ao menos uma pergunta.`);
      }
      conteudo.perguntas.forEach((pergunta, i) => {
        if (!pergunta.id) throw erroDeValidacao(`${onde}: a pergunta ${i + 1} precisa de id.`);
        validarOpcoes(pergunta.opcoes, `${onde}, pergunta ${i + 1}`);
      });
      return;
    }

    case "dissertativa":
      if (!Array.isArray(conteudo.criterios) || !conteudo.criterios.some(textoPreenchido)) {
        throw erroDeValidacao(`${onde}: inclua ao menos um critério de correção para a IA.`);
      }
      return;

    default:
      throw erroDeValidacao(
        `${onde}: tipo de exercício inválido — use ${TIPOS_EXERCICIO.join(", ")}.`
      );
  }
}

// Valida Desafio.alternativas inteiro (etapa única ou várias etapas).
function validarAlternativas(alternativas) {
  if (!temVariasEtapas(alternativas)) {
    validarExercicio(alternativas);
    return;
  }
  if (alternativas.etapas.length === 0) {
    throw erroDeValidacao("Inclua ao menos uma etapa no desafio.");
  }
  alternativas.etapas.forEach((etapa, i) => {
    const onde = `Etapa ${i + 1}`;
    if (!textoPreenchido(etapa.enunciado)) throw erroDeValidacao(`${onde}: o enunciado não pode ficar vazio.`);
    if (etapa.tipo === "etapas") throw erroDeValidacao(`${onde}: uma etapa não pode conter outras etapas.`);
    validarExercicio(etapa, onde);
  });
}

// ---------- Versão pública (sem gabarito) ----------

function embaralhar(lista) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

const semGabarito = (opcoes) => opcoes.map(({ id, texto }) => ({ id, texto }));
const soCodigo = (itens) => itens.map(({ id, codigo }) => ({ id, codigo }));

// O que a tela recebe de uma etapa: enunciado e o necessário pra responder,
// nunca o que é correto. Blocos e ingredientes vêm embaralhados.
function etapaPublica(etapa, indice) {
  const tipo = tipoDoExercicio(etapa);
  const base = {
    numero: indice + 1,
    tipo,
    titulo: etapa.titulo ?? null,
    enunciado: etapa.enunciado ?? null,
    codigo: etapa.codigo ?? null,
    dica: etapa.dica ?? null,
  };

  switch (tipo) {
    case "multipla_escolha":
      return { ...base, opcoes: semGabarito(etapa.opcoes) };
    case "ordenar_blocos":
      return { ...base, blocos: embaralhar(soCodigo(etapa.blocos)) };
    case "avaliar_codigo":
      return { ...base, cartas: soCodigo(etapa.cartas) };
    case "montar_pocao":
      return {
        ...base,
        // quantos ingredientes a poção leva — os distratores ficam misturados
        quantidadeIngredientes: etapa.ingredientesCorretos.length,
        ingredientes: embaralhar(soCodigo([...etapa.ingredientesCorretos, ...(etapa.distratores ?? [])])),
      };
    case "batalha_chefe":
      return {
        ...base,
        vidasNecessarias: etapa.vidasNecessarias,
        perguntas: etapa.perguntas.map((pergunta) => ({
          id: pergunta.id,
          enunciado: pergunta.enunciado ?? null,
          codigo: pergunta.codigo ?? null,
          opcoes: semGabarito(pergunta.opcoes),
        })),
      };
    case "dissertativa":
      // critérios e resposta de referência ficam só no servidor (com a IA)
      return base;
    default:
      return base;
  }
}

module.exports = {
  TIPOS_EXERCICIO,
  tipoDoExercicio,
  temVariasEtapas,
  etapasDoDesafio,
  totalDeEtapas,
  validarAlternativas,
  etapaPublica,
};
