const { Router } = require("express");
const { getPerfil, postTutorialVisto } = require("../controllers/perfil.controller.js");
const autenticar = require("../middlewares/auth.middleware.js");

const router = Router();

// GET /api/perfil — dados do usuário logado (rota protegida por JWT)
router.get("/", autenticar, getPerfil);

// POST /api/perfil/tutorial-visto — marca o tutorial guiado da Home como visto
router.post("/tutorial-visto", autenticar, postTutorialVisto);

module.exports = router;