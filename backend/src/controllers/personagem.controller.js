const personagemService = require("../services/personagem.service");

function idUsuario(req) {
  return req.usuario?.id ?? req.usuarioId;
}

async function getPersonagem(req, res, next) {
  try {
    const personagem = await personagemService.buscarPersonagem(idUsuario(req));
    return res.status(200).json(personagem);
  } catch (erro) {
    next(erro);
  }
}

async function putPersonagem(req, res, next) {
  try {
    const { nome, imagemUrl } = req.body;
    const personagem = await personagemService.atualizarPersonagem(idUsuario(req), {
      nome,
      imagemUrl,
    });
    return res.status(200).json(personagem);
  } catch (erro) {
    next(erro);
  }
}

async function equiparItem(req, res, next) {
  try {
    const { itemPersonagemId } = req.params;
    const itemAtualizado = await personagemService.equiparItem(idUsuario(req), itemPersonagemId);
    return res.status(200).json(itemAtualizado);
  } catch (erro) {
    next(erro);
  }
}

async function desequiparItem(req, res, next) {
  try {
    const { itemPersonagemId } = req.params;
    const itemAtualizado = await personagemService.desequiparItem(idUsuario(req), itemPersonagemId);
    return res.status(200).json(itemAtualizado);
  } catch (erro) {
    next(erro);
  }
}

module.exports = { getPersonagem, putPersonagem, equiparItem, desequiparItem };
