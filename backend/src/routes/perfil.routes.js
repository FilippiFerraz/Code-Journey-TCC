const { Router } = require("express");
const { getPerfil } = require("../controllers/perfil.controller.js");
const autenticar = require("../middlewares/auth.middleware.js");

const router = Router();

// GET /api/perfil — dados do usuário logado (rota protegida por JWT)
router.get("/", autenticar, getPerfil);

module.exports = router;