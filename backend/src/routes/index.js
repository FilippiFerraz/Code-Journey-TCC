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

const adminRoutes = require("./admin.routes.js");
router.use("/admin", adminRoutes);

const rankingRoutes = require("./ranking.routes.js");
router.use("/ranking", rankingRoutes);

const bauRoutes = require("./bau.routes.js");
router.use("/baus", bauRoutes);

const itemRoutes = require("./item.routes.js");
router.use("/itens", itemRoutes);

const contaRoutes = require("./conta.routes.js");
router.use("/conta", contaRoutes);

module.exports = router;