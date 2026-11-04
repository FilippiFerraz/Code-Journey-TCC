const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rotas = require("./routes");
const tratarErros = require("./middlewares/error.middleware");


const app = express();

// Atrás do proxy da hospedagem (Vercel, Render...) o IP de quem chama vem no
// cabeçalho X-Forwarded-For. Sem isto, o express-rate-limit enxergaria TODOS
// os jogadores com o IP do proxy (um só limite pra todo mundo) e reclamaria
// do cabeçalho. "1" = confia só no primeiro proxy da frente.
app.set("trust proxy", 1);

// Cabeçalhos de segurança padrão (bloqueia a API de ser aberta dentro de
// <iframe>, impede o navegador de "adivinhar" o tipo do conteúdo, esconde o
// "X-Powered-By: Express" etc.).
app.use(helmet());

// Só o frontend pode chamar a API pelo navegador. FRONTEND_URL aceita mais
// de uma origem separada por vírgula (ex: dev + produção); sem ela, vale o
// endereço padrão do Vite em desenvolvimento.
// A origem do navegador nunca termina em "/", então uma barra no fim da
// variável (erro comum ao colar a URL do Vercel) é descartada — senão o CORS
// recusaria todas as chamadas.
function tirarBarraFinal(origem) {
  let fim = origem.length;
  while (fim > 0 && origem[fim - 1] === "/") fim--;
  return origem.slice(0, fim);
}

const origensPermitidas = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((origem) => tirarBarraFinal(origem.trim()))
  .filter(Boolean);

// maxAge: o navegador lembra a resposta da pré-verificação (OPTIONS) por 2h
// em vez de repeti-la antes de CADA chamada — cada pré-verificação é uma ida
// e volta de rede inteira (o Chrome limita esse cache a 2h, então 7200).
app.use(cors({ origin: origensPermitidas, maxAge: 7200 }));
app.use(express.json());

app.use("/api", rotas);

app.use(tratarErros);

module.exports = app;
