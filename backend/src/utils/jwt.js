const jwt = require("jsonwebtoken");

const SEGREDO = process.env.JWT_SECRET;
const EXPIRA_EM = "7d";

function gerarToken(payload) {
  return jwt.sign(payload, SEGREDO, { expiresIn: EXPIRA_EM });
}

function verificarToken(token) {
  return jwt.verify(token, SEGREDO);
}

module.exports = { gerarToken, verificarToken };
