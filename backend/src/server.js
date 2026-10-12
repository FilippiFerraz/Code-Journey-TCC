require("dotenv").config();
const app = require("./app");

const PORT = process.env.PORT || 3333;

// Só abre a porta quando executado direto (node src/server.js). Na Vercel o
// arquivo api/index.js importa o app e a plataforma cuida de receber as
// requisições — não pode haver um listen() aí.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
}

module.exports = app;
