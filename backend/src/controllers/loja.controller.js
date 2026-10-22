const lojaService = require("../services/loja.service");

function idUsuario(req) {
  return req.usuario?.id ?? req.usuarioId;
}

async function getLoja(req, res, next) {
  try {
    res.status(200).json(await lojaService.situacaoLoja(idUsuario(req)));
  } catch (err) {
    next(err);
  }
}

async function postComprar(req, res, next) {
  try {
    res.status(200).json(await lojaService.comprar(idUsuario(req), req.body.chave));
  } catch (err) {
    next(err);
  }
}

async function postUsar(req, res, next) {
  try {
    const { chave, mundoId, dificuldade, numero } = req.body;
    res.status(200).json(await lojaService.usarItem(idUsuario(req), { chave, mundoId, dificuldade, numero }));
  } catch (err) {
    next(err);
  }
}

async function postPular(req, res, next) {
  try {
    const { mundoId, dificuldade, numero } = req.body;
    res.status(200).json(await lojaService.pularDesafio(idUsuario(req), { mundoId, dificuldade, numero }));
  } catch (err) {
    next(err);
  }
}

module.exports = { getLoja, postComprar, postUsar, postPular };
