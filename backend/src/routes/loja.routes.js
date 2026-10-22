const { Router } = require("express");
const { getLoja, postComprar, postUsar, postPular } = require("../controllers/loja.controller.js");
const autenticar = require("../middlewares/auth.middleware.js");
const validar = require("../middlewares/validacao.middleware.js");
const { loja: esquemas } = require("../validacoes/esquemas.js");

const router = Router();

// GET /api/loja — moedas do jogador e o catálogo da Lojinha do Mago (preço,
// limite e quantos de cada item ele já tem guardados).
router.get("/", autenticar, getLoja);

// POST /api/loja/comprar — { chave }: congelar | elixir | pular | bau. O
// Baú Misterioso ("bau") já devolve o item sorteado em itemGanho.
router.post("/comprar", autenticar, validar(esquemas.comprar), postComprar);

// POST /api/loja/usar — itens da mochila nos desafios: { chave: "congelar" }
// gasta uma Ampulheta Congelada (o cronômetro é pausado no navegador);
// { chave: "elixir", mundoId, dificuldade, numero } bebe um Elixir do Sábio.
router.post("/usar", autenticar, validar(esquemas.usar), postUsar);

// POST /api/loja/pular — { mundoId, dificuldade, numero }: gasta um
// Pergaminho do Atalho e marca o desafio como concluído, sem XP.
router.post("/pular", autenticar, validar(esquemas.pular), postPular);

module.exports = router;
