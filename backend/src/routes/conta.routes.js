const { Router } = require("express");
const {
  getConta,
  putNome,
  postSolicitarTrocaEmail,
  postConfirmarTrocaEmail,
  deleteTrocaEmail,
  postExcluirConta,
} = require("../controllers/conta.controller.js");
const autenticar = require("../middlewares/auth.middleware.js");

const router = Router();

// Tela "Minha Conta" (Configurações > Conta) — tudo sobre o usuário logado.

// GET /api/conta — nome, e-mail, troca de e-mail pendente e quantos dias
// faltam pra poder alterar nome/e-mail de novo
router.get("/", autenticar, getConta);

// PUT /api/conta/nome — body: { nome } (1 troca a cada 30 dias)
router.put("/nome", autenticar, putNome);

// POST /api/conta/email — body: { novoEmail, senha } — manda um código pro
// e-mail novo; a troca só acontece em /email/confirmar (1 troca a cada 30 dias)
router.post("/email", autenticar, postSolicitarTrocaEmail);

// POST /api/conta/email/confirmar — body: { codigo }
router.post("/email/confirmar", autenticar, postConfirmarTrocaEmail);

// DELETE /api/conta/email — cancela a troca de e-mail pendente
router.delete("/email", autenticar, deleteTrocaEmail);

// POST /api/conta/excluir — body: { senha, confirmacao: "EXCLUIR" } — soft
// delete (só marca deletedAt; um administrador pode reativar)
router.post("/excluir", autenticar, postExcluirConta);

module.exports = router;
