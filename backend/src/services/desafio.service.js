const prisma = require("../config/prisma");
const { registrarLog } = require("./log.service");
const { calcularDiferencas } = require("../utils/diff");

const TIPOS_RECOMPENSA_VALIDOS = ["insignia", "item"];

function erroDeValidacao(mensagem) {
  const erro = new Error(mensagem);
  erro.status = 400;
  return erro;
}

function erroNaoEncontrado(mensagem) {
  const erro = new Error(mensagem);
  erro.status = 404;
  return erro;
}

// Lista todos os desafios cadastrados (qualquer mundo/trilha), só com o que
// a tela de listagem do admin precisa mostrar — ver AdminDesafios.jsx.
async function listarDesafios() {
  return prisma.desafio.findMany({
    select: {
      id: true,
      mundoId: true,
      dificuldade: true,
      numero: true,
      titulo: true,
      tipoRecompensa: true,
      nomeRecompensa: true,
    },
    orderBy: [{ mundoId: "asc" }, { dificuldade: "asc" }, { numero: "asc" }],
  });
}

async function buscarDesafioPorId(desafioId) {
  const desafio = await prisma.desafio.findUnique({
    where: { id: desafioId },
    include: { itemRecompensa: true },
  });
  if (!desafio) throw erroNaoEncontrado("Desafio não encontrado.");
  return desafio;
}

// Catálogo de itens pro seletor de recompensa em EditarDesafioAdmin.jsx —
// mesmos campos que ele precisa pra preencher nome/ícone/descrição
// automaticamente quando o admin escolhe um item.
async function listarItensCatalogo() {
  return prisma.item.findMany({
    select: { id: true, nome: true, icone: true, descricao: true, tipo: true, raridade: true },
    orderBy: { nome: "asc" },
  });
}

// Aceita os dois formatos usados em ResolverDesafio.jsx (ver comentário em
// schema.prisma): array de alternativas de múltipla escolha, ou objeto de
// "ordenar blocos". Qualquer outra coisa é rejeitada antes de chegar no banco.
function validarAlternativas(alternativas) {
  if (Array.isArray(alternativas)) {
    if (alternativas.length < 2) {
      throw erroDeValidacao("Inclua ao menos duas alternativas.");
    }
    if (!alternativas.some((alt) => alt.correta === true)) {
      throw erroDeValidacao("Marque qual alternativa é a correta.");
    }
    for (const alt of alternativas) {
      if (!alt.id || typeof alt.texto !== "string" || !alt.texto.trim()) {
        throw erroDeValidacao("Cada alternativa precisa de id e texto.");
      }
    }
    return;
  }

  if (alternativas && alternativas.tipo === "ordenar_blocos") {
    if (!Array.isArray(alternativas.blocos) || alternativas.blocos.length === 0) {
      throw erroDeValidacao("Informe ao menos um bloco de código.");
    }
    if (
      !Array.isArray(alternativas.ordemCorreta) ||
      alternativas.ordemCorreta.length !== alternativas.blocos.length
    ) {
      throw erroDeValidacao("A ordem correta precisa ter o mesmo tanto de itens que os blocos.");
    }
    const idsBlocos = new Set(alternativas.blocos.map((bloco) => bloco.id));
    if (!alternativas.ordemCorreta.every((id) => idsBlocos.has(id))) {
      throw erroDeValidacao("A ordem correta cita um bloco que não existe na lista de blocos.");
    }
    return;
  }

  throw erroDeValidacao(
    'Formato de alternativas inválido — use uma lista de alternativas ou um objeto "ordenar_blocos".'
  );
}

// Atualiza só os campos vindos no corpo da requisição — mesmo padrão de
// "patch parcial" usado em perfil.service.js::atualizarPerfil. "admin" é
// { id, nome, role } (ver middlewares/admin.middleware.js) — usado só pra
// gravar quem fez a alteração em LogAdmin, no fim da função.
async function atualizarDesafio(desafioId, dados, admin) {
  const desafio = await prisma.desafio.findUnique({ where: { id: desafioId } });
  if (!desafio) throw erroNaoEncontrado("Desafio não encontrado.");

  const {
    titulo,
    enunciado,
    dica,
    alternativas,
    xpConcedido,
    tipoRecompensa,
    nomeRecompensa,
    descricaoRecompensa,
    iconeRecompensa,
    itemRecompensaId,
  } = dados;

  const atualizacoes = {};

  if (titulo !== undefined) {
    if (!titulo.trim()) throw erroDeValidacao("Título não pode ficar vazio.");
    atualizacoes.titulo = titulo.trim();
  }

  if (enunciado !== undefined) {
    if (!enunciado.trim()) throw erroDeValidacao("Enunciado não pode ficar vazio.");
    atualizacoes.enunciado = enunciado.trim();
  }

  if (dica !== undefined) {
    atualizacoes.dica = dica?.trim() || null;
  }

  if (alternativas !== undefined) {
    validarAlternativas(alternativas);
    atualizacoes.alternativas = alternativas;
  }

  if (xpConcedido !== undefined) {
    const xpNumero = Number(xpConcedido);
    if (!Number.isInteger(xpNumero) || xpNumero < 0) {
      throw erroDeValidacao("XP concedido precisa ser um número inteiro, 0 ou mais.");
    }
    atualizacoes.xpConcedido = xpNumero;
  }

  // Recompensa: valida o conjunto final (tipo + item), não só o que veio
  // nesta requisição, pra nunca deixar "tipo item" sem item selecionado
  // mesmo que o admin só tenha mandado um dos dois campos.
  if (tipoRecompensa !== undefined || itemRecompensaId !== undefined) {
    const tipoFinal = tipoRecompensa !== undefined ? tipoRecompensa || null : desafio.tipoRecompensa;
    const itemFinal = itemRecompensaId !== undefined ? itemRecompensaId : desafio.itemRecompensaId;

    if (tipoFinal !== null && !TIPOS_RECOMPENSA_VALIDOS.includes(tipoFinal)) {
      throw erroDeValidacao('Tipo de recompensa inválido — use "insignia" ou "item".');
    }
    if (tipoFinal === "item" && !itemFinal) {
      throw erroDeValidacao("Selecione um item pra recompensa do tipo item.");
    }

    if (tipoRecompensa !== undefined) atualizacoes.tipoRecompensa = tipoRecompensa || null;

    if (itemRecompensaId !== undefined) {
      if (!itemRecompensaId) {
        atualizacoes.itemRecompensaId = null;
      } else {
        const itemIdNumero = Number(itemRecompensaId);
        const item = await prisma.item.findUnique({ where: { id: itemIdNumero } });
        if (!item) throw erroNaoEncontrado("Item de recompensa não encontrado.");
        atualizacoes.itemRecompensaId = itemIdNumero;
      }
    }
  }

  if (nomeRecompensa !== undefined) atualizacoes.nomeRecompensa = nomeRecompensa?.trim() || null;
  if (descricaoRecompensa !== undefined) {
    atualizacoes.descricaoRecompensa = descricaoRecompensa?.trim() || null;
  }
  if (iconeRecompensa !== undefined) atualizacoes.iconeRecompensa = iconeRecompensa?.trim() || null;

  const atualizado = await prisma.desafio.update({ where: { id: desafioId }, data: atualizacoes });

  if (admin && Object.keys(atualizacoes).length > 0) {
    const alteracoes = calcularDiferencas(desafio, atualizado, Object.keys(atualizacoes));
    if (Object.keys(alteracoes).length > 0) {
      await registrarLog({
        usuarioId: admin.id,
        nomeUsuario: admin.nome,
        role: admin.role,
        acao: "desafio.atualizar",
        entidade: "Desafio",
        entidadeId: atualizado.id,
        descricao: `Atualizou o desafio "${atualizado.titulo}" (Mundo ${atualizado.mundoId} • ${atualizado.dificuldade} • Desafio ${atualizado.numero}).`,
        alteracoes,
      });
    }
  }

  return atualizado;
}

module.exports = {
  listarDesafios,
  buscarDesafioPorId,
  listarItensCatalogo,
  atualizarDesafio,
};
