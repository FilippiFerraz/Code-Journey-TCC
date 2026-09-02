const { buscarPerfil, marcarTutorialVisto } = require("../services/perfil.service.js");

async function getPerfil(req, res, next) {
  try {
    // O auth.middleware coloca o usuário autenticado na requisição.
    // Suporta as duas convenções comuns: req.usuario.id OU req.usuarioId.
    const usuarioId = req.usuario?.id ?? req.usuarioId;

    const perfil = await buscarPerfil(usuarioId);
    res.json(perfil);
  } catch (err) {
    next(err); // cai no error.middleware centralizado
  }
}

async function postTutorialVisto(req, res, next) {
  try {
    const usuarioId = req.usuario?.id ?? req.usuarioId;
    await marcarTutorialVisto(usuarioId);
    res.status(200).json({ tutorialVisto: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { getPerfil, postTutorialVisto };