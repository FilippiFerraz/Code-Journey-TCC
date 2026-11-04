const { Router } = require("express");
const authController = require("../controllers/auth.controller");
const {
  limitadorLogin,
  limitadorCodigo,
  limitadorEmail,
} = require("../middlewares/rateLimit.middleware");
const validar = require("../middlewares/validacao.middleware");
const { auth: esquemas } = require("../validacoes/esquemas");

const router = Router();

router.post("/cadastro", limitadorEmail, validar(esquemas.cadastro), authController.cadastrar);
router.post("/login", limitadorLogin, validar(esquemas.login), authController.login);

router.post("/verificar-email", limitadorCodigo, validar(esquemas.emailECodigo), authController.verificarEmail);
router.post("/reenviar-verificacao", limitadorEmail, validar(esquemas.somenteEmail), authController.reenviarVerificacao);

router.post("/verificar-codigo", limitadorCodigo, validar(esquemas.emailECodigo), authController.verificarCodigo);
router.post("/redefinir-senha", limitadorCodigo, validar(esquemas.redefinirSenha), authController.redefinirSenha);
router.post("/esqueci-senha", limitadorEmail, validar(esquemas.somenteEmail), authController.esqueciSenha);

module.exports = router;
