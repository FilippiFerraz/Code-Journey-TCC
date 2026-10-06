const { Router } = require("express");
const {
  responderDesafio,
  listarProgresso,
} = require("../controllers/progresso.controller.js");
const autenticar = require("../middlewares/auth.middleware.js");
const validar = require("../middlewares/validacao.middleware.js");
const { progresso: esquemas } = require("../validacoes/esquemas.js");
const { limitadorCorrecaoIA } = require("../middlewares/rateLimit.middleware.js");

const router = Router();

// POST /api/progresso — submete a resposta de um desafio (grava tentativa,
// marca concluído no acerto e soma o XP do desafio em Usuario.xpTotal).
// Body: { mundoId, dificuldade, numero, opcaoId } para desafios de múltipla
// escolha, ou { mundoId, dificuldade, numero, ordem } (ordem = array de ids
// de blocos) para desafios de "ordenar blocos". mundoId/dificuldade/numero
// são os mesmos valores da URL do frontend (ex: /codigo/:mundoId/:dificuldade/:desafioId,
// onde desafioId == numero). tempoSegundos (opcional) é quanto o jogador
// levou até essa resposta — só é usado (bônus de velocidade + primeira
// tentativa em cima de Desafio.xpConcedido) na resposta que conclui o
// desafio pela primeira vez, ver progresso.service.js.
router.post("/", autenticar, validar(esquemas.responder), limitadorCorrecaoIA, responderDesafio);

// GET /api/progresso — progresso do usuário logado, opcionalmente filtrado
// por trilha via ?mundoId=&dificuldade=
router.get("/", autenticar, validar(esquemas.listar), listarProgresso);

module.exports = router;
