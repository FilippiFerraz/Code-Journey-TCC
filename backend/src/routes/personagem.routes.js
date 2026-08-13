const { Router } = require("express");
const {
  getPersonagem,
  putPersonagem,
  equiparItem,
  desequiparItem,
} = require("../controllers/personagem.controller.js");
const autenticar = require("../middlewares/auth.middleware.js");

const router = Router();

// GET /api/personagem — personagem do usuário logado + inventário
// (cria o registro na primeira vez que o usuário acessa)
router.get("/", autenticar, getPersonagem);

// PUT /api/personagem — atualiza nome/imagem do personagem
router.put("/", autenticar, putPersonagem);

// POST /api/personagem/inventario/:itemPersonagemId/equipar
router.post("/inventario/:itemPersonagemId/equipar", autenticar, equiparItem);

// POST /api/personagem/inventario/:itemPersonagemId/desequipar
router.post("/inventario/:itemPersonagemId/desequipar", autenticar, desequiparItem);

module.exports = router;
