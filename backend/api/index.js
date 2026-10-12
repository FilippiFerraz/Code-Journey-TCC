// Entrada da Vercel: cada requisição para este projeto cai aqui (ver
// vercel.json) e é entregue ao app do Express, que já monta tudo em /api.
// Em desenvolvimento nada disso é usado — o servidor sobe por src/server.js.
require("dotenv").config();
module.exports = require("../src/app");
