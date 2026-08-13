const progressoService = require("../services/progresso.service");

async function responderDesafio(req, res, next) {
  try {
    const usuarioId = req.usuario?.id ?? req.usuarioId;
    const { mundoId, dificuldade, numero, opcaoId } = req.body;

    const resultado = await progressoService.responderDesafio({
      usuarioId,
      mundoId,
      dificuldade,
      numero,
      opcaoId,
    });

    return res.status(200).json(resultado);
  } catch (erro) {
    next(erro);
  }
}

async function listarProgresso(req, res, next) {
  try {
    const usuarioId = req.usuario?.id ?? req.usuarioId;
    const { mundoId, dificuldade } = req.query;

    const progresso = await progressoService.listarProgresso({
      usuarioId,
      mundoId,
      dificuldade,
    });

    return res.status(200).json(progresso);
  } catch (erro) {
    next(erro);
  }
}

module.exports = { responderDesafio, listarProgresso };
