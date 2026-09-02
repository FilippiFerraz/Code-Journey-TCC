// Só confirma que a proteção de admin está funcionando. As rotas reais de
// gestão (editar desafios, dashboard de suporte, etc.) entram aqui depois.
async function getStatus(req, res) {
  res.status(200).json({ acesso: "administrador" });
}

module.exports = { getStatus };
