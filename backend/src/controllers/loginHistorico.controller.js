const loginHistoricoService = require("../services/loginHistorico.service.js");

async function getLoginHistorico(req, res, next) {
  try {
    const { busca, usuarioId, sucesso, pagina, limite } = req.query;
    const resultado = await loginHistoricoService.listarLoginHistorico({
      busca,
      usuarioId,
      sucesso,
      pagina,
      limite,
    });
    res.status(200).json(resultado);
  } catch (err) {
    next(err);
  }
}

module.exports = { getLoginHistorico };
