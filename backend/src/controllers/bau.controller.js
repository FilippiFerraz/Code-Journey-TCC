const bauService = require("../services/bau.service");

function idUsuario(req) {
  return req.usuario?.id ?? req.usuarioId;
}

async function getBaus(req, res, next) {
  try {
    const baus = await bauService.listarBaus(idUsuario(req));
    res.status(200).json(baus);
  } catch (err) {
    next(err);
  }
}

async function postAbrirBau(req, res, next) {
  try {
    const { mundoId } = req.params;
    // Só a trilha "iniciante" tem desafios reais hoje (ver
    // frontend/src/data/progresso.js) — mesmo padrão usado no resto do app.
    const dificuldade = req.body.dificuldade || "iniciante";
    const resultado = await bauService.abrirBau(idUsuario(req), mundoId, dificuldade);
    res.status(200).json(resultado);
  } catch (err) {
    next(err);
  }
}

// :chave = rei | cristal (ver BAUS_ESPECIAIS em bau.service.js)
async function getBauEspecial(req, res, next) {
  try {
    res.status(200).json(await bauService.situacaoBauEspecial(idUsuario(req), req.params.chave));
  } catch (err) {
    next(err);
  }
}

async function postAbrirBauEspecial(req, res, next) {
  try {
    res.status(200).json(await bauService.abrirBauEspecial(idUsuario(req), req.params.chave));
  } catch (err) {
    next(err);
  }
}

module.exports = { getBaus, postAbrirBau, getBauEspecial, postAbrirBauEspecial };
