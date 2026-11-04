const authService = require("../services/auth.service");

async function cadastrar(req, res, next) {
  try {
    const { nome, email, senha, idade } = req.body;

    if (!nome || !email || !senha || idade === undefined || idade === null || idade === "") {
      return res.status(400).json({ erro: "Nome, email, senha e idade são obrigatórios." });
    }

    const resultado = await authService.cadastrar({ nome, email, senha, idade });
    return res.status(201).json(resultado);
  } catch (erro) {
    next(erro);
  }
}

// Prioriza X-Forwarded-For (quem chega primeiro na cadeia de proxies, ex:
// atrás de um load balancer/CDN em produção) e cai pro req.ip do Express
// como fallback (ex: em dev, direto sem proxy).
function ipDaRequisicao(req) {
  const encaminhado = req.headers["x-forwarded-for"];
  if (encaminhado) return encaminhado.split(",")[0].trim();
  return req.ip;
}

async function login(req, res, next) {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ erro: "Email e senha são obrigatórios." });
    }

    const resultado = await authService.login({
      email,
      senha,
      ip: ipDaRequisicao(req),
      userAgent: req.headers["user-agent"] || null,
    });
    return res.status(200).json(resultado);
  } catch (erro) {
    next(erro);
  }
}

async function verificarEmail(req, res, next) {
  try {
    const { email, codigo } = req.body;
    const resultado = await authService.verificarEmailCadastro({ email, codigo });
    return res.status(200).json(resultado);
  } catch (erro) {
    return next(erro);
  }
}

async function reenviarVerificacao(req, res, next) {
  try {
    const { email } = req.body;
    const resultado = await authService.reenviarVerificacaoEmail({ email });
    return res.status(200).json(resultado);
  } catch (erro) {
    return next(erro);
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

module.exports = {
  cadastrar,
  login,
  verificarEmail,
  reenviarVerificacao,
  esqueciSenha,
  verificarCodigo,
  redefinirSenha,
};
