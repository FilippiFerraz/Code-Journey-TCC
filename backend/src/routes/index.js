const express = require("express");
const authRoutes = require("./auth.routes");

const router = express.Router();
router.use("/auth", authRoutes);

const perfilRoutes = require("./perfil.routes.js");
router.use("/perfil", perfilRoutes);

module.exports = router;