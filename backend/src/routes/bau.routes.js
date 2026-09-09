const { Router } = require("express");
const { getBaus, postAbrirBau } = require("../controllers/bau.controller.js");
const autenticar = require("../middlewares/auth.middleware.js");

const router = Router();

// GET /api/baus — pra cada trilha com desafios cadastrados, diz se o baú de
// fim de mundo está disponível pra abrir, já foi aberto (e com qual item),
// ou nenhum dos dois (mundo ainda não concluído). Usado por Home.jsx pra
// desenhar o ícone do baú nos portais do mapa.
router.get("/", autenticar, getBaus);

// POST /api/baus/:mundoId/abrir — abre o baú de uma trilha concluída: sorteia
// o item na roleta, credita no inventário e marca o baú como aberto (só
// funciona uma vez por trilha). Body opcional: { dificuldade } (padrão "iniciante").
router.post("/:mundoId/abrir", autenticar, postAbrirBau);

module.exports = router;
