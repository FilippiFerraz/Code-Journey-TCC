const adminService = require("../services/admin.service.js");

function idParametroOuFalhar(req) {
  const usuarioIdAlvo = Number(req.params.usuarioId);
  if (!Number.isInteger(usuarioIdAlvo)) {
    const erro = new Error("Usuário inválido.");
    erro.status = 400;
    throw erro;
  }
  return usuarioIdAlvo;
}

// Só confirma que a proteção de admin está funcionando (ver AdminAcesso em
// Admin.jsx). As rotas reais de gestão ficam abaixo.
async function getStatus(req, res) {
  res.status(200).json({ acesso: "administrador" });
}

async function getUsuarios(req, res, next) {
  try {
    const { busca, pagina, limite } = req.query;
    const resultado = await adminService.listarUsuarios({ busca, pagina, limite });
    res.status(200).json(resultado);
  } catch (err) {
    next(err);
  }
}

async function getExportarUsuarios(req, res, next) {
  try {
    const buffer = await adminService.exportarUsuariosXlsx({ busca: req.query.busca });
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", 'attachment; filename="usuarios.xlsx"');
    res.status(200).send(buffer);
  } catch (err) {
    next(err);
  }
}

async function putUsuarioRole(req, res, next) {
  try {
    const usuarioIdAlvo = idParametroOuFalhar(req);
    const resultado = await adminService.alterarRole(
      req.usuarioAdmin,
      usuarioIdAlvo,
      req.body.role
    );
    res.status(200).json(resultado);
  } catch (err) {
    next(err);
  }
}

async function putUsuarioAtivo(req, res, next) {
  try {
    const usuarioIdAlvo = idParametroOuFalhar(req);
    const resultado = await adminService.alterarAtivo(
      req.usuarioAdmin,
      usuarioIdAlvo,
      Boolean(req.body.ativo)
    );
    res.status(200).json(resultado);
  } catch (err) {
    next(err);
  }
}

async function postResetarProgresso(req, res, next) {
  try {
    const usuarioIdAlvo = idParametroOuFalhar(req);
    const resultado = await adminService.resetarProgresso(req.usuarioAdmin, usuarioIdAlvo);
    res.status(200).json(resultado);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getStatus,
  getUsuarios,
  getExportarUsuarios,
  putUsuarioRole,
  putUsuarioAtivo,
  postResetarProgresso,
};
