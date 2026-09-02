const { Router } = require("express");
const { getRanking } = require("../controllers/ranking.controller.js");
const autenticar = require("../middlewares/auth.middleware.js");

const router = Router();

// GET /api/ranking — top jogadores por XP + a posição de quem está logado
// (protegida, porque precisa saber quem é "eu" pra destacar a posição dele)
router.get("/", autenticar, getRanking);

module.exports = router;
