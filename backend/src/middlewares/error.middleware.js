function tratarErros(erro, req, res, next) {
  console.error(erro);

  const status = erro.status || 500;
  const mensagem = erro.status ? erro.message : "Erro interno no servidor.";

  res.status(status).json({ erro: mensagem });
}

module.exports = tratarErros;
