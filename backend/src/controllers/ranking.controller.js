const { listarRanking } = require("../services/ranking.service.js");

async function getRanking(req, res, next) {
  try {
    const usuarioId = req.usuario?.id ?? req.usuarioId;
    const ranking = await listarRanking(usuarioId);
    res.json(ranking);
  } catch (err) {
    next(err);
  }
}

module.exports = { getRanking };
