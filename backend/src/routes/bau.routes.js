const { Router } = require("express");
const { getBaus, postAbrirBau, getBauEspecial, postAbrirBauEspecial } = require("../controllers/bau.controller.js");
const autenticar = require("../middlewares/auth.middleware.js");
const validar = require("../middlewares/validacao.middleware.js");
const { bau: esquemas } = require("../validacoes/esquemas.js");

const router = Router();

// GET /api/baus — pra cada trilha com desafios cadastrados, diz se o baú de
// fim de mundo está disponível pra abrir, já foi aberto (e com qual item),
// ou nenhum dos dois (mundo ainda não concluído). Usado por Home.jsx pra
// desenhar o ícone do baú nos portais do mapa.
router.get("/", autenticar, getBaus);

// GET /api/baus/:chave e POST /api/baus/:chave/abrir — baús especiais dos
// minijogos do mapa (chave "rei": Desafio do Rei; "cristal": Desafio da
// Cachoeira de Cristais; "dragao": Batalha do Dragão): situação
// (liberado/aberto) e abertura, uma vez só. O padrão só aceita essas chaves
// e vem antes de /:mundoId/abrir, senão elas seriam lidas como mundoId.
router.get("/:chave(rei|cristal|dragao)", autenticar, getBauEspecial);
router.post("/:chave(rei|cristal|dragao)/abrir", autenticar, postAbrirBauEspecial);

// POST /api/baus/:mundoId/abrir — abre o baú de uma trilha concluída: sorteia
// o item na roleta, credita no inventário e marca o baú como aberto (só
// funciona uma vez por trilha). Body opcional: { dificuldade } (padrão "iniciante").
router.post("/:mundoId/abrir", autenticar, validar(esquemas.abrir), postAbrirBau);

module.exports = router;
