const { buscarDesafioParaJogar, verificarAcaoDaEtapa } = require("../services/desafioJogo.service");

async function getDesafioParaJogar(req, res, next) {
  try {
    res.status(200).json(await buscarDesafioParaJogar(req.usuarioId, req.params));
  } catch (erro) {
    next(erro);
  }
}

async function postVerificarAcao(req, res, next) {
  try {
    res.status(200).json(await verificarAcaoDaEtapa(req.usuarioId, req.params, req.body));
  } catch (erro) {
    next(erro);
  }
}

module.exports = { getDesafioParaJogar, postVerificarAcao };
