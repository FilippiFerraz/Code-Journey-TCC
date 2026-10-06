const { Router } = require("express");
const {
  getPerfil,
  postTutorialVisto,
  getBuscarUsuarios,
  getPerfilPublico,
} = require("../controllers/perfil.controller.js");
const autenticar = require("../middlewares/auth.middleware.js");
const validar = require("../middlewares/validacao.middleware.js");
const { perfil: esquemas } = require("../validacoes/esquemas.js");

const router = Router();

// GET /api/perfil — dados do usuário logado (rota protegida por JWT)
router.get("/", autenticar, getPerfil);

// GET /api/perfil/buscar?nome= — busca jogadores pelo nome pra barra de
// pesquisa da Home. Precisa vir ANTES de "/:usuarioId" abaixo, senão o
// Express entenderia "buscar" como um id.
router.get("/buscar", autenticar, validar(esquemas.buscar), getBuscarUsuarios);

// POST /api/perfil/tutorial-visto — marca o tutorial guiado da Home como visto
router.post("/tutorial-visto", autenticar, postTutorialVisto);

// GET /api/perfil/:usuarioId — perfil público de OUTRO usuário, aberto a
// partir de um resultado da busca (ver Perfil.jsx em modo "visita"). Fica
// por último pra não capturar nenhuma das rotas fixas acima.
router.get("/:usuarioId", autenticar, validar(esquemas.publico), getPerfilPublico);

module.exports = router;