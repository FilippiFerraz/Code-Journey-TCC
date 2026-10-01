const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rotas = require("./routes");
const tratarErros = require("./middlewares/error.middleware");


const app = express();

// Cabeçalhos de segurança padrão (bloqueia a API de ser aberta dentro de
// <iframe>, impede o navegador de "adivinhar" o tipo do conteúdo, esconde o
// "X-Powered-By: Express" etc.).
app.use(helmet());

// Só o frontend pode chamar a API pelo navegador. FRONTEND_URL aceita mais
// de uma origem separada por vírgula (ex: dev + produção); sem ela, vale o
// endereço padrão do Vite em desenvolvimento.
const origensPermitidas = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((origem) => origem.trim())
  .filter(Boolean);

app.use(cors({ origin: origensPermitidas }));
app.use(express.json());

app.use("/api", rotas);

app.use(tratarErros);

module.exports = app;
