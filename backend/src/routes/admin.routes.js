const { Router } = require("express");
const { getStatus } = require("../controllers/admin.controller.js");
const autenticar = require("../middlewares/auth.middleware.js");
const verificarAdmin = require("../middlewares/admin.middleware.js");

const router = Router();

// GET /api/admin/status — confirma acesso de administrador (401 sem token,
// 403 se o usuário não for admin). Rotas de gestão futuras entram aqui,
// sempre atrás de autenticar + verificarAdmin.
router.get("/status", autenticar, verificarAdmin, getStatus);

module.exports = router;
