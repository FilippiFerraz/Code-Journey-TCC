const { Router } = require("express");
const {
  getPersonagem,
  putPersonagem,
  equiparItem,
  desequiparItem,
} = require("../controllers/personagem.controller.js");
const autenticar = require("../middlewares/auth.middleware.js");
const validar = require("../middlewares/validacao.middleware.js");
const { personagem: esquemas } = require("../validacoes/esquemas.js");

const router = Router();

// GET /api/personagem — personagem do usuário logado + inventário
// (cria o registro na primeira vez que o usuário acessa)
router.get("/", autenticar, getPersonagem);

// PUT /api/personagem — atualiza o nome do personagem (imagemUrl não é mais
// aceito — ver esquemas.js)
router.put("/", autenticar, validar(esquemas.atualizar), putPersonagem);

// POST /api/personagem/inventario/:itemPersonagemId/equipar
router.post("/inventario/:itemPersonagemId/equipar", autenticar, validar(esquemas.item), equiparItem);

// POST /api/personagem/inventario/:itemPersonagemId/desequipar
router.post("/inventario/:itemPersonagemId/desequipar", autenticar, validar(esquemas.item), desequiparItem);

module.exports = router;
