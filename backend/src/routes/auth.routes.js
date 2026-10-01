const { Router } = require("express");
const authController = require("../controllers/auth.controller");
const {
  limitadorLogin,
  limitadorCodigo,
  limitadorEmail,
} = require("../middlewares/rateLimit.middleware");

const router = Router();

router.post("/cadastro", limitadorEmail, authController.cadastrar);
router.post("/login", limitadorLogin, authController.login);

router.post("/verificar-email", limitadorCodigo, authController.verificarEmail);
router.post("/reenviar-verificacao", limitadorEmail, authController.reenviarVerificacao);

router.post("/verificar-codigo", limitadorCodigo, authController.verificarCodigo);
router.post("/redefinir-senha", limitadorCodigo, authController.redefinirSenha);
router.post("/esqueci-senha", limitadorEmail, authController.esqueciSenha);

module.exports = router;
