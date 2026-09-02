const { Router } = require("express");
const authController = require("../controllers/auth.controller");

const router = Router();

router.post("/cadastro", authController.cadastrar);
router.post("/login", authController.login);

router.post("/verificar-email", authController.verificarEmail);
router.post("/reenviar-verificacao", authController.reenviarVerificacao);

router.post("/verificar-codigo", authController.verificarCodigo);
router.post("/redefinir-senha", authController.redefinirSenha);
router.post("/esqueci-senha", authController.esqueciSenha);

module.exports = router;
