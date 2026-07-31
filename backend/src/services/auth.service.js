const bcrypt = require("bcryptjs");
const prisma = require("../config/prisma");
const { gerarToken } = require("../utils/jwt");
const { enviarEmailRecuperacao } = require("./email.service");

const SALT_ROUNDS = 10;
const CODIGO_VALIDO_MINUTOS = 15;

async function cadastrar({ nome, email, senha }) {
  const usuarioExistente = await prisma.usuario.findUnique({ where: { email } });

  if (usuarioExistente) {
    const erro = new Error("Este email já está cadastrado.");
    erro.status = 409;
    throw erro;
  }

  const senhaCriptografada = await bcrypt.hash(senha, SALT_ROUNDS);

  const usuario = await prisma.usuario.create({
    data: { nome, email, senha: senhaCriptografada },
  });

  const token = gerarToken({ id: usuario.id });

  return {
    usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email },
    token,
  };
}

async function login({ email, senha }) {
  const usuario = await prisma.usuario.findUnique({ where: { email } });

  if (!usuario) {
    const erro = new Error("Email ou senha inválidos.");
    erro.status = 401;
    throw erro;
  }

  const senhaValida = await bcrypt.compare(senha, usuario.senha);

  if (!senhaValida) {
    const erro = new Error("Email ou senha inválidos.");
    erro.status = 401;
    throw erro;
  }

  const token = gerarToken({ id: usuario.id });

  return {
    usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email },
    token,
  };
}

// --- Recuperação de senha ---

function erroDeValidacao(mensagem) {
  const erro = new Error(mensagem);
  erro.status = 400;
  return erro;
}

// Gera um código de 6 dígitos, salva no banco com validade e envia por email
async function esqueciSenha({ email }) {
  const usuario = await prisma.usuario.findUnique({ where: { email } });

  // Resposta sempre igual, exista ou não o email — não revela quem tem conta
  const resposta = {
    mensagem: "Se este email estiver cadastrado, você receberá um código.",
  };

  if (!usuario) return resposta;

  const codigo = String(Math.floor(100000 + Math.random() * 900000));
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
  if (!novaSenha || novaSenha.length < 6) {
    throw erroDeValidacao("A nova senha precisa ter pelo menos 6 caracteres.");
  }

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
  esqueciSenha,
  verificarCodigo,
  redefinirSenha,
};