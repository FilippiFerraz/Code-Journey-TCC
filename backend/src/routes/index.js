const express = require("express");
const authRoutes = require("./auth.routes");

const router = express.Router();
router.use("/auth", authRoutes);

const perfilRoutes = require("./perfil.routes.js");
router.use("/perfil", perfilRoutes);

const progressoRoutes = require("./progresso.routes.js");
router.use("/progresso", progressoRoutes);

const personagemRoutes = require("./personagem.routes.js");
router.use("/personagem", personagemRoutes);

module.exports = router;