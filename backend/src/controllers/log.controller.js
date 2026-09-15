const logService = require("../services/log.service.js");

async function getLogs(req, res, next) {
  try {
    const { pagina, limite, acao, entidade } = req.query;
    const resultado = await logService.listarLogs({ pagina, limite, acao, entidade });
    res.status(200).json(resultado);
  } catch (err) {
    next(err);
  }
}

module.exports = { getLogs };
