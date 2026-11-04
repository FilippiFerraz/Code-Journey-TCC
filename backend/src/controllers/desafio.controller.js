const desafioService = require("../services/desafio.service.js");

function idParametroOuFalhar(req) {
  const desafioId = Number(req.params.desafioId);
  if (!Number.isInteger(desafioId)) {
    const erro = new Error("Desafio inválido.");
    erro.status = 400;
    throw erro;
  }
  return desafioId;
}

async function getDesafios(req, res, next) {
  try {
    const desafios = await desafioService.listarDesafios();
    res.status(200).json(desafios);
  } catch (err) {
    next(err);
  }
}

async function getDesafio(req, res, next) {
  try {
    const desafioId = idParametroOuFalhar(req);
    const desafio = await desafioService.buscarDesafioPorId(desafioId);
    res.status(200).json(desafio);
  } catch (err) {
    next(err);
  }
}

async function putDesafio(req, res, next) {
  try {
    const desafioId = idParametroOuFalhar(req);
    const desafio = await desafioService.atualizarDesafio(desafioId, req.body, req.usuarioAdmin);
    res.status(200).json(desafio);
  } catch (err) {
    next(err);
  }
}

async function getItensCatalogo(req, res, next) {
  try {
    const itens = await desafioService.listarItensCatalogo();
    res.status(200).json(itens);
  } catch (err) {
    next(err);
  }
}

module.exports = { getDesafios, getDesafio, putDesafio, getItensCatalogo };
