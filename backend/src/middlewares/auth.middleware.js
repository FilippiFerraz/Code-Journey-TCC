const prisma = require("../config/prisma");
const { verificarToken } = require("../utils/jwt");

async function autenticar(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ erro: "Token não informado." });
  }

  const [, token] = authHeader.split(" ");

  let payload;
  try {
    payload = verificarToken(token);
  } catch (erro) {
    return res.status(401).json({ erro: "Token inválido ou expirado." });
  }

  // O token continua "válido" até expirar mesmo depois que a conta é
  // excluída (soft delete, pelo próprio jogador ou por um administrador).
  // Por isso confere se a conta ainda existe: findUnique já ignora contas
  // com deletedAt preenchido (ver config/prisma.js).
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: payload.id },
      select: { id: true },
    });
    if (!usuario) {
      return res.status(401).json({ erro: "Esta conta foi desativada." });
    }
  } catch (erro) {
    return next(erro);
  }

  req.usuarioId = payload.id;
  return next();
}

module.exports = autenticar;
