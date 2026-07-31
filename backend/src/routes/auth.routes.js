const { Router } = require("express");
const authController = require("../controllers/auth.controller");

const router = Router();

router.post("/cadastro", authController.cadastrar);
router.post("/login", authController.login);

router.post("/verificar-codigo", authController.verificarCodigo);
router.post("/redefinir-senha", authController.redefinirSenha);
router.post("/esqueci-senha", authController.esqueciSenha);

module.exports = router;
