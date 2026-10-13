const { Router } = require("express");
const { getItens, getItensRei } = require("../controllers/item.controller.js");
const autenticar = require("../middlewares/auth.middleware.js");

const router = Router();

// GET /api/itens — catálogo de itens do jogo (só leitura), mesmo critério de
// autenticação das outras rotas de jogo. Usado pela roleta do Baú da Sorte.
router.get("/", autenticar, getItens);

// GET /api/itens/rei — os itens da roleta do Baú Real (Desafio do Rei).
router.get("/rei", autenticar, getItensRei);

module.exports = router;
