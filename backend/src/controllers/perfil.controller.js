const { buscarPerfil } = require("../services/perfil.service.js");

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

module.exports = { getPerfil };