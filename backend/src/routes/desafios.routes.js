const { Router } = require("express");
const { getDesafioParaJogar, postVerificarAcao } = require("../controllers/desafioJogo.controller.js");
const autenticar = require("../middlewares/auth.middleware.js");
const validar = require("../middlewares/validacao.middleware.js");
const { desafioJogo: esquemas } = require("../validacoes/esquemas.js");

const router = Router();

// GET /api/desafios/:mundoId/:dificuldade/:numero — conteúdo de um desafio
// pra jogar (enunciado e etapas, SEM gabarito) e o avanço do jogador nele.
// As respostas continuam indo pra POST /api/progresso (com "etapa" nos
// desafios de várias etapas). Desafio trancado = 403.
router.get("/:mundoId/:dificuldade/:numero", autenticar, validar(esquemas.buscar), getDesafioParaJogar);

// POST /api/desafios/:mundoId/:dificuldade/:numero/verificar — confere UMA
// ação de uma etapa (um cartão, um ingrediente, um golpe no chefe) sem
// registrar nada, pra tela dar retorno imediato. Ver desafioJogo.service.js.
router.post("/:mundoId/:dificuldade/:numero/verificar", autenticar, validar(esquemas.verificar), postVerificarAcao);

module.exports = router;
