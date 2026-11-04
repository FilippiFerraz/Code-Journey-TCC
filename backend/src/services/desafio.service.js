const prisma = require("../config/prisma");
const { registrarLog } = require("./log.service");
const { calcularDiferencas } = require("../utils/diff");
const { validarAlternativas, temVariasEtapas, tipoDoExercicio } = require("./etapas.service");
const { limparCacheDesafios } = require("./desafiosCache");

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
// O conteúdo (alternativas) não vai na lista: só o tipo do exercício e, nos
// desafios de várias etapas (portal 3), quantas etapas e de quais tipos.
async function listarDesafios() {
  const desafios = await prisma.desafio.findMany({
    select: {
      id: true,
      mundoId: true,
      dificuldade: true,
      numero: true,
      titulo: true,
      alternativas: true,
      itemRecompensa: { select: { nome: true, icone: true } },
    },
    orderBy: [{ mundoId: "asc" }, { dificuldade: "asc" }, { numero: "asc" }],
  });

  return desafios.map(({ alternativas, ...desafio }) => {
    const variasEtapas = temVariasEtapas(alternativas);
    return {
      ...desafio,
      tipo: variasEtapas ? "etapas" : tipoDoExercicio(alternativas),
      tiposEtapas: variasEtapas ? alternativas.etapas.map(tipoDoExercicio) : null,
    };
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

// Catálogo de itens pro seletor de recompensa em EditarDesafioAdmin.jsx.
async function listarItensCatalogo() {
  // itens exclusivos de baú (de módulo ou Real) não podem ser recompensa de desafio
  return prisma.item.findMany({
    where: { exclusivoBau: false, exclusivoRei: false, exclusivoCristal: false, exclusivoDragao: false },
    select: { id: true, nome: true, icone: true, descricao: true, tipo: true, raridade: true },
    orderBy: { nome: "asc" },
  });
}

// Formato do conteúdo (Desafio.alternativas): validado por
// etapas.service.js::validarAlternativas, que aceita os 6 tipos de exercício
// e os desafios com várias etapas (portal 3).

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

  // Recompensa: a única recompensa personalizável de um desafio é um Item
  // de equipamento, que entra no inventário na primeira conclusão. null =
  // o desafio dá só XP.
  if (itemRecompensaId !== undefined) {
    if (!itemRecompensaId) {
      atualizacoes.itemRecompensaId = null;
    } else {
      const itemIdNumero = Number(itemRecompensaId);
      if (!Number.isInteger(itemIdNumero) || itemIdNumero < 1) {
        throw erroDeValidacao("Item de recompensa inválido.");
      }
      const item = await prisma.item.findUnique({ where: { id: itemIdNumero } });
      if (!item) throw erroNaoEncontrado("Item de recompensa não encontrado.");
      if (item.exclusivoBau || item.exclusivoRei || item.exclusivoCristal || item.exclusivoDragao) {
        throw erroDeValidacao("Este item é exclusivo de um baú e não pode ser recompensa de desafio.");
      }
      atualizacoes.itemRecompensaId = itemIdNumero;
    }
  }

  const atualizado = await prisma.desafio.update({ where: { id: desafioId }, data: atualizacoes });
  limparCacheDesafios();

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
