const authService = require("../services/auth.service");

async function cadastrar(req, res, next) {
  try {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({ erro: "Nome, email e senha são obrigatórios." });
    }

    const resultado = await authService.cadastrar({ nome, email, senha });
    return res.status(201).json(resultado);
  } catch (erro) {
    next(erro);
  }
}

async function login(req, res, next) {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ erro: "Email e senha são obrigatórios." });
    }

    const resultado = await authService.login({ email, senha });
    return res.status(200).json(resultado);
  } catch (erro) {
    next(erro);
  }
}

async function verificarCodigo(req, res, next) {
  try {
    const { email, codigo } = req.body;
    const resultado = await authService.verificarCodigo({ email, codigo });
    return res.status(200).json(resultado);
  } catch (erro) {
    return next(erro);
  }
}

async function redefinirSenha(req, res, next) {
  try {
    const { email, codigo, novaSenha } = req.body;
    const resultado = await authService.redefinirSenha({ email, codigo, novaSenha });
    return res.status(200).json(resultado);
  } catch (erro) {
    return next(erro);
  }
}

async function esqueciSenha(req, res, next) {
  try {
    const { email } = req.body;
    const resultado = await authService.esqueciSenha({ email });
    return res.status(200).json(resultado);
  } catch (erro) {
    return next(erro);
  }
}

async function esqueciSenha(req, res, next) {
  try {
    const { email } = req.body;
    const resultado = await authService.esqueciSenha({ email });
    return res.status(200).json(resultado);
  } catch (erro) {
    return next(erro);
  }
}

module.exports = { cadastrar, login, esqueciSenha, verificarCodigo, redefinirSenha };
