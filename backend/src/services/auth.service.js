const bcrypt = require("bcryptjs");
const prisma = require("../config/prisma");
const { gerarToken } = require("../utils/jwt");
const { enviarEmailRecuperacao, enviarEmailVerificacao } = require("./email.service");
const { registrarTentativaLogin } = require("./loginHistorico.service");

const SALT_ROUNDS = 10;
const CODIGO_VALIDO_MINUTOS = 15;

function erroDeValidacao(mensagem) {
  const erro = new Error(mensagem);
  erro.status = 400;
  return erro;
}

function gerarCodigo() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// Mínimo 6 caracteres, pelo menos 1 letra maiúscula e pelo menos 1 caractere
// especial (não letra/dígito/espaço).
const SENHA_REGEX = /^(?=.*[A-Z])(?=.*[^A-Za-z0-9\s]).{6,}$/;

function validarSenha(senha) {
  if (!SENHA_REGEX.test(senha || "")) {
    throw erroDeValidacao(
      "A senha precisa ter no mínimo 6 caracteres, com pelo menos uma letra maiúscula e um caractere especial."
    );
  }
}

// Formato básico — só pra rejeitar besteira antes de tentar enviar o
// e-mail de verificação. Quem realmente confirma que a caixa existe é o
// código enviado logo abaixo, não este regex.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validarFormatoEmail(email) {
  if (!EMAIL_REGEX.test(String(email || "").trim())) {
    throw erroDeValidacao("Informe um e-mail válido.");
  }
}

// Obrigatória no cadastro (mesmo a coluna sendo opcional no banco, pra não
// quebrar contas criadas antes desse campo existir).
function validarIdade(idade) {
  const numero = Number(idade);
  if (idade === undefined || idade === null || idade === "" || !Number.isInteger(numero)) {
    throw erroDeValidacao("Informe sua idade.");
  }
  if (numero < 13 || numero > 120) {
    throw erroDeValidacao("Informe uma idade válida.");
  }
  return numero;
}

async function cadastrar({ nome, email, senha, idade }) {
  validarFormatoEmail(email);
  const idadeValidada = validarIdade(idade);

  const usuarioExistente = await prisma.usuario.findUnique({ where: { email } });

  if (usuarioExistente) {
    const erro = new Error("Este email já está cadastrado.");
    erro.status = 409;
    throw erro;
  }

  validarSenha(senha);

  const senhaCriptografada = await bcrypt.hash(senha, SALT_ROUNDS);
  const codigo = gerarCodigo();
  const expiraEm = new Date(Date.now() + CODIGO_VALIDO_MINUTOS * 60 * 1000);

  const usuario = await prisma.usuario.create({
    data: {
      nome,
      email,
      senha: senhaCriptografada,
      idade: idadeValidada,
      codigoVerificacao: codigo,
      codigoVerificacaoExpiraEm: expiraEm,
    },
  });

  await enviarEmailVerificacao(usuario.email, usuario.nome, codigo);

  // Sem token aqui de propósito — a conta só fica utilizável depois de
  // confirmar o e-mail em POST /auth/verificar-email.
  return {
    mensagem: "Conta criada! Enviamos um código de confirmação para o seu e-mail.",
    email: usuario.email,
  };
}

// Grava a tentativa no histórico de login (ver loginHistorico.service.js) —
// nunca deixa uma falha na gravação derrubar o login em si (ex: banco fora
// do ar): a auditoria é "melhor esforço", não parte crítica do fluxo.
async function registrarTentativa({ usuarioId, nomeUsuario, emailTentado, sucesso, motivoFalha, ip, userAgent }) {
  try {
    await registrarTentativaLogin({
      usuarioId: usuarioId ?? null,
      nomeUsuario: nomeUsuario ?? null,
      emailTentado,
      sucesso,
      motivoFalha: motivoFalha ?? null,
      ip,
      userAgent,
    });
  } catch (erroLog) {
    console.error("Não foi possível registrar o histórico de login:", erroLog);
  }
}

async function login({ email, senha, ip, userAgent }) {
  // findUnique já filtra deletedAt: null automaticamente (extensão de soft
  // delete em config/prisma.js), então um usuário excluído cai aqui como
  // "não encontrado" — por isso a checagem extra abaixo, só pra dar uma
  // mensagem melhor nesse caso específico.
  const usuario = await prisma.usuario.findUnique({ where: { email } });

  if (!usuario) {
    // Busca sem o filtro de soft delete só pra saber se é uma conta
    // desativada (pra vincular usuarioId/nomeUsuario no histórico mesmo
    // nesse caso) — não muda a mensagem de erro nem o comportamento do login.
    const usuarioExcluido = await prisma.semFiltro.usuario.findUnique({ where: { email } });

    if (usuarioExcluido?.deletedAt) {
      await registrarTentativa({
        usuarioId: usuarioExcluido.id,
        nomeUsuario: usuarioExcluido.nome,
        emailTentado: email,
        sucesso: false,
        motivoFalha: "Conta desativada",
        ip,
        userAgent,
      });
      const erro = new Error("Esta conta foi desativada.");
      erro.status = 401;
      throw erro;
    }

    await registrarTentativa({
      emailTentado: email,
      sucesso: false,
      motivoFalha: "E-mail não cadastrado",
      ip,
      userAgent,
    });
    const erro = new Error("Email ou senha inválidos.");
    erro.status = 401;
    throw erro;
  }

  const senhaValida = await bcrypt.compare(senha, usuario.senha);

  if (!senhaValida) {
    await registrarTentativa({
      usuarioId: usuario.id,
      nomeUsuario: usuario.nome,
      emailTentado: email,
      sucesso: false,
      motivoFalha: "Senha incorreta",
      ip,
      userAgent,
    });
    const erro = new Error("Email ou senha inválidos.");
    erro.status = 401;
    throw erro;
  }

  if (!usuario.emailVerificado) {
    await registrarTentativa({
      usuarioId: usuario.id,
      nomeUsuario: usuario.nome,
      emailTentado: email,
      sucesso: false,
      motivoFalha: "E-mail não verificado",
      ip,
      userAgent,
    });
    const erro = new Error(
      "Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada ou peça um novo código."
    );
    erro.status = 403;
    throw erro;
  }

  const token = gerarToken({ id: usuario.id });

  await registrarTentativa({
    usuarioId: usuario.id,
    nomeUsuario: usuario.nome,
    emailTentado: email,
    sucesso: true,
    ip,
    userAgent,
  });

  return {
    usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, role: usuario.role },
    token,
  };
}

// --- Confirmação de e-mail no cadastro ---

async function verificarEmailCadastro({ email, codigo }) {
  const emailNormalizado = String(email || "").trim();
  const codigoInformado = String(codigo || "").trim();

  const usuario = await prisma.usuario.findUnique({ where: { email: emailNormalizado } });

  if (!usuario || !usuario.codigoVerificacao || !usuario.codigoVerificacaoExpiraEm) {
    throw erroDeValidacao("Código inválido. Peça um novo código.");
  }

  if (usuario.codigoVerificacao !== codigoInformado) {
    throw erroDeValidacao("Código incorreto.");
  }

  if (new Date() > usuario.codigoVerificacaoExpiraEm) {
    throw erroDeValidacao("Código expirado. Peça um novo código.");
  }

  const usuarioAtualizado = await prisma.usuario.update({
    where: { id: usuario.id },
    data: {
      emailVerificado: true,
      codigoVerificacao: null,
      codigoVerificacaoExpiraEm: null,
    },
  });

  const token = gerarToken({ id: usuarioAtualizado.id });

  return {
    usuario: {
      id: usuarioAtualizado.id,
      nome: usuarioAtualizado.nome,
      email: usuarioAtualizado.email,
      role: usuarioAtualizado.role,
    },
    token,
  };
}

// Gera e reenvia um novo código pra quem ainda não confirmou o e-mail.
// Resposta sempre igual (exista a conta ou já esteja verificada), pro mesmo
// motivo de esqueciSenha: não revelar quais e-mails têm conta.
async function reenviarVerificacaoEmail({ email }) {
  const resposta = {
    mensagem: "Se este e-mail tiver uma conta pendente de confirmação, reenviamos o código.",
  };

  const usuario = await prisma.usuario.findUnique({ where: { email } });
  if (!usuario || usuario.emailVerificado) return resposta;

  const codigo = gerarCodigo();
  const expiraEm = new Date(Date.now() + CODIGO_VALIDO_MINUTOS * 60 * 1000);

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { codigoVerificacao: codigo, codigoVerificacaoExpiraEm: expiraEm },
  });

  await enviarEmailVerificacao(usuario.email, usuario.nome, codigo);

  return resposta;
}

// --- Recuperação de senha ---

// Gera um código de 6 dígitos, salva no banco com validade e envia por email
async function esqueciSenha({ email }) {
  const usuario = await prisma.usuario.findUnique({ where: { email } });

  // Resposta sempre igual, exista ou não o email — não revela quem tem conta
  const resposta = {
    mensagem: "Se este email estiver cadastrado, você receberá um código.",
  };

  if (!usuario) return resposta;

  const codigo = gerarCodigo();
  const expiraEm = new Date(Date.now() + CODIGO_VALIDO_MINUTOS * 60 * 1000);

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { codigoRecuperacao: codigo, codigoExpiraEm: expiraEm },
  });

  await enviarEmailRecuperacao(usuario.email, usuario.nome, codigo);

  return resposta;
}

// Busca o usuário e confere se o código bate e ainda está válido
async function validarCodigoRecuperacao(email, codigo) {
  const emailNormalizado = String(email || "").trim();
  const codigoInformado = String(codigo || "").trim();

  const usuario = await prisma.usuario.findUnique({
    where: { email: emailNormalizado },
  });

  if (!usuario || !usuario.codigoRecuperacao || !usuario.codigoExpiraEm) {
    throw erroDeValidacao("Código inválido. Solicite um novo código.");
  }

  if (usuario.codigoRecuperacao !== codigoInformado) {
    throw erroDeValidacao("Código incorreto.");
  }

  if (new Date() > usuario.codigoExpiraEm) {
    throw erroDeValidacao("Código expirado. Solicite um novo código.");
  }

  return usuario;
}

async function verificarCodigo({ email, codigo }) {
  await validarCodigoRecuperacao(email, codigo);
  return { mensagem: "Código válido." };
}

async function redefinirSenha({ email, codigo, novaSenha }) {
  validarSenha(novaSenha);

  const usuario = await validarCodigoRecuperacao(email, codigo);
  const senhaHash = await bcrypt.hash(novaSenha, SALT_ROUNDS);

  // Salva a nova senha e queima o código, para não poder ser usado de novo
  await prisma.usuario.update({
    where: { id: usuario.id },
    data: {
      senha: senhaHash,
      codigoRecuperacao: null,
      codigoExpiraEm: null,
    },
  });

  return { mensagem: "Senha redefinida com sucesso." };
}

module.exports = {
  cadastrar,
  login,
  verificarEmailCadastro,
  reenviarVerificacaoEmail,
  esqueciSenha,
  verificarCodigo,
  redefinirSenha,
};
