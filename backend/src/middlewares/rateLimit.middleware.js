const { rateLimit } = require("express-rate-limit");

// Limites de requisição por IP nas rotas públicas de /api/auth — sem eles
// dava pra testar senhas (ou os códigos de 6 dígitos de verificação e
// recuperação) em sequência sem parar, ou disparar e-mails em massa pra
// qualquer endereço. A resposta segue o mesmo formato { erro } do resto da
// API (ver error.middleware.js), então as telas já mostram a mensagem.
function criarLimitador({ janelaMinutos, maximo, mensagem, ignorarSucessos = false }) {
  return rateLimit({
    windowMs: janelaMinutos * 60 * 1000,
    limit: maximo,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    // Login certo não conta — só quem erra a senha várias vezes é barrado.
    skipSuccessfulRequests: ignorarSucessos,
    handler: (req, res, next, opcoes) => {
      res.status(opcoes.statusCode).json({ erro: mensagem });
    },
  });
}

// POST /auth/login — 10 senhas erradas a cada 15 minutos.
const limitadorLogin = criarLimitador({
  janelaMinutos: 15,
  maximo: 10,
  ignorarSucessos: true,
  mensagem: "Muitas tentativas de login. Aguarde 15 minutos e tente novamente.",
});

// Rotas que conferem um código de 6 dígitos (verificação de e-mail e
// recuperação de senha) — 10 tentativas a cada 15 minutos.
const limitadorCodigo = criarLimitador({
  janelaMinutos: 15,
  maximo: 10,
  ignorarSucessos: true,
  mensagem: "Muitas tentativas com código. Aguarde 15 minutos e tente novamente.",
});

// Rotas que enviam e-mail (cadastro, reenviar código, esqueci a senha) —
// 5 por hora.
const limitadorEmail = criarLimitador({
  janelaMinutos: 60,
  maximo: 5,
  mensagem: "Muitas solicitações. Aguarde um pouco antes de pedir outro e-mail.",
});

module.exports = { limitadorLogin, limitadorCodigo, limitadorEmail };
