const { Router } = require("express");
const {
  responderDesafio,
  listarProgresso,
} = require("../controllers/progresso.controller.js");
const autenticar = require("../middlewares/auth.middleware.js");

const router = Router();

// POST /api/progresso — submete a resposta de um desafio (grava tentativa,
// marca concluído no acerto e soma o XP do desafio em Usuario.xpTotal).
// Body: { mundoId, dificuldade, numero, opcaoId } para desafios de múltipla
// escolha, ou { mundoId, dificuldade, numero, ordem } (ordem = array de ids
// de blocos) para desafios de "ordenar blocos". mundoId/dificuldade/numero
// são os mesmos valores da URL do frontend (ex: /codigo/:mundoId/:dificuldade/:desafioId,
// onde desafioId == numero).
router.post("/", autenticar, responderDesafio);

// GET /api/progresso — progresso do usuário logado, opcionalmente filtrado
// por trilha via ?mundoId=&dificuldade=
router.get("/", autenticar, listarProgresso);

module.exports = router;
