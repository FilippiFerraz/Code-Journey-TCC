const { Router } = require("express");
const {
  getStatus,
  getUsuarios,
  getExportarUsuarios,
  putUsuarioRole,
  putUsuarioAtivo,
  postResetarProgresso,
} = require("../controllers/admin.controller.js");
const {
  getDesafios,
  getDesafio,
  putDesafio,
  getItensCatalogo,
} = require("../controllers/desafio.controller.js");
const { getDashboard } = require("../controllers/dashboard.controller.js");
const { getLogs } = require("../controllers/log.controller.js");
const { getLoginHistorico } = require("../controllers/loginHistorico.controller.js");
const autenticar = require("../middlewares/auth.middleware.js");
const validar = require("../middlewares/validacao.middleware.js");
const { admin: esquemas } = require("../validacoes/esquemas.js");
const verificarAdmin = require("../middlewares/admin.middleware.js");

const router = Router();

// Toda rota aqui passa por autenticar + verificarAdmin: 401 sem token, 403
// se o usuário autenticado não for administrador.
router.use(autenticar, verificarAdmin);

// GET /api/admin/status — confirma acesso de administrador.
router.get("/status", getStatus);

// GET /api/admin/usuarios?busca=&pagina=&limite= — lista usuários
// cadastrados (ativos e desativados) pra tabela de administração.
router.get("/usuarios", validar(esquemas.listarUsuarios), getUsuarios);

// GET /api/admin/usuarios/exportar?busca= — baixa os mesmos usuários da
// busca acima como planilha .xlsx.
router.get("/usuarios/exportar", validar(esquemas.exportarUsuarios), getExportarUsuarios);

// PUT /api/admin/usuarios/:usuarioId/role — body { role: "administrador" | "jogador" }
router.put("/usuarios/:usuarioId/role", validar(esquemas.alterarPapel), putUsuarioRole);

// PUT /api/admin/usuarios/:usuarioId/ativo — body { ativo: boolean } — soft
// delete (false) ou reativação (true) da conta.
router.put("/usuarios/:usuarioId/ativo", validar(esquemas.alterarAtivo), putUsuarioAtivo);

// POST /api/admin/usuarios/:usuarioId/resetar-progresso — apaga desafios
// concluídos, itens do inventário e baús abertos, e zera o XP. A conta em
// si (nome, e-mail, senha, papel) não é tocada. Ação irreversível.
router.post("/usuarios/:usuarioId/resetar-progresso", validar(esquemas.usuarioId), postResetarProgresso);

// GET /api/admin/desafios — lista todos os desafios cadastrados (qualquer
// mundo/trilha), pra tela de gestão de desafios e recompensas.
router.get("/desafios", getDesafios);

// GET /api/admin/desafios/:desafioId — um desafio completo (enunciado,
// dica, alternativas, recompensa) pra tela de edição.
router.get("/desafios/:desafioId", validar(esquemas.desafioId), getDesafio);

// PUT /api/admin/desafios/:desafioId — atualiza qualquer subconjunto dos
// campos acima. Ver desafio.service.js::atualizarDesafio pros formatos
// aceitos em "alternativas" e as regras de "recompensa".
router.put("/desafios/:desafioId", validar(esquemas.desafioId), putDesafio);

// GET /api/admin/itens — catálogo de itens pro seletor de recompensa em
// EditarDesafioAdmin.jsx.
router.get("/itens", getItensCatalogo);

// GET /api/admin/dashboard — métricas agregadas pro painel de dashboards
// (usuários por idade, cadastros por mês, top XP, conclusão de desafios).
router.get("/dashboard", getDashboard);

// GET /api/admin/logs?pagina=&limite=&acao=&entidade= — histórico de
// auditoria das alterações feitas pelo painel (ver log.service.js).
router.get("/logs", validar(esquemas.logs), getLogs);

// GET /api/admin/login-historico?busca=&usuarioId=&sucesso=&pagina=&limite=
// — histórico de tentativas de login (sucesso e falha), com data, IP e
// motivo da falha (ver auth.service.js::login, que grava cada tentativa).
router.get("/login-historico", validar(esquemas.loginHistorico), getLoginHistorico);

module.exports = router;
