const { Router } = require("express");
const {
  getMeusDados,
  getConta,
  putNome,
  postSolicitarTrocaEmail,
  postConfirmarTrocaEmail,
  deleteTrocaEmail,
  postExcluirConta,
} = require("../controllers/conta.controller.js");
const autenticar = require("../middlewares/auth.middleware.js");
const validar = require("../middlewares/validacao.middleware.js");
const { conta: esquemas } = require("../validacoes/esquemas.js");

const router = Router();

// Tela "Minha Conta" (Configurações > Conta) — tudo sobre o usuário logado.

// GET /api/conta — nome, e-mail, troca de e-mail pendente e quantos dias
// faltam pra poder alterar nome/e-mail de novo
router.get("/", autenticar, getConta);

// PUT /api/conta/nome — body: { nome } (1 troca a cada 30 dias)
router.put("/nome", autenticar, validar(esquemas.nome), putNome);

// POST /api/conta/email — body: { novoEmail, senha } — manda um código pro
// e-mail novo; a troca só acontece em /email/confirmar (1 troca a cada 30 dias)
router.post("/email", autenticar, validar(esquemas.solicitarTrocaEmail), postSolicitarTrocaEmail);

// POST /api/conta/email/confirmar — body: { codigo }
router.post("/email/confirmar", autenticar, validar(esquemas.confirmarTrocaEmail), postConfirmarTrocaEmail);

// DELETE /api/conta/email — cancela a troca de e-mail pendente
router.delete("/email", autenticar, deleteTrocaEmail);

// GET /api/conta/meus-dados — LGPD art. 18: download de todos os dados
// pessoais do jogador (JSON). Ver privacidade.service.js::exportarMeusDados
router.get("/meus-dados", autenticar, getMeusDados);

// POST /api/conta/excluir — body: { senha, confirmacao: "EXCLUIR" } —
// anonimiza nome, e-mail, idade e senha de forma irreversível (LGPD art. 16;
// ver privacidade.service.js::anonimizarConta)
router.post("/excluir", autenticar, validar(esquemas.excluir), postExcluirConta);

module.exports = router;
