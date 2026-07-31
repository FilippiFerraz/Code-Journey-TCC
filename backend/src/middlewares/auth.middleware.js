const { verificarToken } = require("../utils/jwt");

function autenticar(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ erro: "Token não informado." });
  }

  const [, token] = authHeader.split(" ");

  try {
    const payload = verificarToken(token);
    req.usuarioId = payload.id;
    return next();
  } catch (erro) {
    return res.status(401).json({ erro: "Token inválido ou expirado." });
  }
}

module.exports = autenticar;
