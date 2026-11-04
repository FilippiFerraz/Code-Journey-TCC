const prisma = require("../config/prisma");
const { verificarToken } = require("../utils/jwt");
const { versaoEmCache, lembrarContaAtiva } = require("../utils/sessaoCache");

async function autenticar(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ erro: "Token não informado." });
  }

  const [tipo, token] = authHeader.split(" ");
  if (tipo !== "Bearer" || !token) {
    return res.status(401).json({ erro: "Token inválido ou expirado." });
  }

  let payload;
  try {
    payload = verificarToken(token);
  } catch (erro) {
    return res.status(401).json({ erro: "Token inválido ou expirado." });
  }
  if (!Number.isInteger(payload?.id)) {
    return res.status(401).json({ erro: "Token inválido ou expirado." });
  }

  // O token continua "válido" até expirar mesmo depois que a conta é
  // excluída (soft delete, pelo próprio jogador ou por um administrador) ou
  // que a senha é redefinida. Por isso confere se a conta ainda existe
  // (findUnique já ignora contas com deletedAt — ver config/prisma.js) e se
  // o token é da versão de sessão atual (Usuario.sessaoVersao sobe a cada
  // redefinição de senha). Tokens de antes desse campo não têm "v": valem
  // como versão 0, a inicial de toda conta.
  // A confirmação fica em memória por alguns segundos (utils/sessaoCache.js):
  // sem isso, toda requisição pagava uma ida e volta ao banco só aqui.
  let sessaoVersao = versaoEmCache(payload.id);
  if (sessaoVersao === undefined) {
    try {
      const usuario = await prisma.usuario.findUnique({
        where: { id: payload.id },
        select: { id: true, sessaoVersao: true },
      });
      if (!usuario) {
        return res.status(401).json({ erro: "Esta conta foi desativada." });
      }
      sessaoVersao = usuario.sessaoVersao;
      lembrarContaAtiva(payload.id, sessaoVersao);
    } catch (erro) {
      return next(erro);
    }
  }

  if ((payload.v ?? 0) !== sessaoVersao) {
    return res.status(401).json({ erro: "Sua sessão expirou. Entre novamente." });
  }

  req.usuarioId = payload.id;
  return next();
}

module.exports = autenticar;
