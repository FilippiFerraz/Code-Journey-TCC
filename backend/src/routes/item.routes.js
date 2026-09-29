const { Router } = require("express");
const { getItens } = require("../controllers/item.controller.js");
const autenticar = require("../middlewares/auth.middleware.js");

const router = Router();

// GET /api/itens — catálogo de itens do jogo (só leitura), mesmo critério de
// autenticação das outras rotas de jogo. Usado pela roleta do Baú da Sorte.
router.get("/", autenticar, getItens);

module.exports = router;
