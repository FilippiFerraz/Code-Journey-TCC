const {
  buscarPerfil,
  marcarTutorialVisto,
  buscarUsuariosPorNome,
  buscarPerfilPublico,
} = require("../services/perfil.service.js");

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

async function getBuscarUsuarios(req, res, next) {
  try {
    const usuarioId = req.usuario?.id ?? req.usuarioId;
    const resultados = await buscarUsuariosPorNome(usuarioId, req.query.nome);
    res.status(200).json(resultados);
  } catch (err) {
    next(err);
  }
}

async function getPerfilPublico(req, res, next) {
  try {
    const usuarioIdAlvo = Number(req.params.usuarioId);
    if (!Number.isInteger(usuarioIdAlvo)) {
      const erro = new Error("Usuário inválido.");
      erro.status = 400;
      throw erro;
    }
    const perfil = await buscarPerfilPublico(usuarioIdAlvo);
    res.status(200).json(perfil);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getPerfil,
  postTutorialVisto,
  getBuscarUsuarios,
  getPerfilPublico,
};