const { Router } = require("express");
const { getBaus, postAbrirBau, getBauRei, postAbrirBauRei } = require("../controllers/bau.controller.js");
const autenticar = require("../middlewares/auth.middleware.js");
const validar = require("../middlewares/validacao.middleware.js");
const { bau: esquemas } = require("../validacoes/esquemas.js");

const router = Router();

// GET /api/baus — pra cada trilha com desafios cadastrados, diz se o baú de
// fim de mundo está disponível pra abrir, já foi aberto (e com qual item),
// ou nenhum dos dois (mundo ainda não concluído). Usado por Home.jsx pra
// desenhar o ícone do baú nos portais do mapa.
router.get("/", autenticar, getBaus);

// GET /api/baus/rei e POST /api/baus/rei/abrir — Baú Real do Desafio do Rei
// (minijogo do castelo): situação (liberado/aberto) e abertura, uma vez só.
// Declaradas antes de /:mundoId/abrir pra "rei" não ser lido como mundoId.
router.get("/rei", autenticar, getBauRei);
router.post("/rei/abrir", autenticar, postAbrirBauRei);

// POST /api/baus/:mundoId/abrir — abre o baú de uma trilha concluída: sorteia
// o item na roleta, credita no inventário e marca o baú como aberto (só
// funciona uma vez por trilha). Body opcional: { dificuldade } (padrão "iniciante").
router.post("/:mundoId/abrir", autenticar, validar(esquemas.abrir), postAbrirBau);

module.exports = router;
