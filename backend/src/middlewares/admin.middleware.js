const prisma = require("../config/prisma");

// Roda depois de auth.middleware.js (precisa de req.usuarioId já definido).
// Busca o papel do usuário no banco a cada requisição — não confia num
// "role" salvo no token, pra uma revogação de admin valer na hora, sem
// esperar o usuário logar de novo.
async function verificarAdmin(req, res, next) {
  try {
    const usuarioId = req.usuario?.id ?? req.usuarioId;

    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { id: true, nome: true, role: true },
    });

    if (!usuario || usuario.role !== "administrador") {
      return res.status(403).json({ erro: "Acesso restrito a administradores." });
    }

    // Disponibiliza { id, nome, role } pros controllers de admin usarem no
    // registro de auditoria (ver log.service.js) sem precisar buscar o
    // usuário de novo — evita um segundo SELECT idêntico a este.
    req.usuarioAdmin = usuario;

    return next();
  } catch (erro) {
    return next(erro);
  }
}

module.exports = verificarAdmin;
