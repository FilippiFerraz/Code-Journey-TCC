const jwt = require("jsonwebtoken");

const SEGREDO = process.env.JWT_SECRET;
const EXPIRA_EM = "7d";
// Algoritmo fixo: o servidor só aceita tokens assinados exatamente como ele
// assina (HMAC-SHA256 com o JWT_SECRET) — nunca deixa o próprio token
// "escolher" o algoritmo de verificação.
const ALGORITMO = "HS256";

// Sem segredo (ou com um segredo curto) qualquer um poderia forjar tokens:
// melhor o servidor não subir do que subir inseguro.
if (!SEGREDO || SEGREDO.length < 32) {
  throw new Error("JWT_SECRET ausente ou curto demais (mínimo 32 caracteres).");
}

// payload: { id, v } — v = Usuario.sessaoVersao no momento do login (ver
// middlewares/auth.middleware.js)
function gerarToken(payload) {
  return jwt.sign(payload, SEGREDO, { expiresIn: EXPIRA_EM, algorithm: ALGORITMO });
}

function verificarToken(token) {
  return jwt.verify(token, SEGREDO, { algorithms: [ALGORITMO] });
}

module.exports = { gerarToken, verificarToken };
