const { Router } = require("express");
const { getItens, getItensBauEspecial, getItensBauLoja } = require("../controllers/item.controller.js");
const autenticar = require("../middlewares/auth.middleware.js");

const router = Router();

// GET /api/itens — catálogo de itens do jogo (só leitura), mesmo critério de
// autenticação das outras rotas de jogo. Usado pela roleta do Baú da Sorte.
router.get("/", autenticar, getItens);

// GET /api/itens/rei, /cristal e /dragao — os itens da roleta de um baú
// especial (Baú Real, Baú de Cristal, Baú do Dragão).
router.get("/:chave(rei|cristal|dragao)", autenticar, getItensBauEspecial);

// GET /api/itens/loja — itens da roleta do Baú Misterioso (Lojinha do Mago).
router.get("/loja", autenticar, getItensBauLoja);

module.exports = router;
