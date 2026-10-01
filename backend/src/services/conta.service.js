const bcrypt = require("bcryptjs");
const prisma = require("../config/prisma");
const { enviarEmailTrocaEmail } = require("./email.service");

// Tela "Minha Conta" (frontend/src/pages/Configuracoes/Conta): troca de nome,
// troca de e-mail com confirmação por código e exclusão da conta (soft delete).

// Nome e e-mail só podem mudar 1 vez a cada DIAS_ENTRE_ALTERACOES dias.
const DIAS_ENTRE_ALTERACOES = 30;
const CODIGO_VALIDO_MINUTOS = 15;
const TAMANHO_MINIMO_NOME = 2;
const TAMANHO_MAXIMO_NOME = 50;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// O jogador precisa digitar exatamente isso pra confirmar a exclusão.
const TEXTO_CONFIRMACAO_EXCLUSAO = "EXCLUIR";

const UM_DIA_MS = 24 * 60 * 60 * 1000;

function erroDeValidacao(mensagem) {
  const erro = new Error(mensagem);
  erro.status = 400;
  return erro;
}

function gerarCodigo() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// Quantos dias faltam pra poder alterar de novo (0 = já pode).
function diasRestantes(ultimaAlteracao) {
  if (!ultimaAlteracao) return 0;
  const liberaEm = new Date(ultimaAlteracao).getTime() + DIAS_ENTRE_ALTERACOES * UM_DIA_MS;
  return Math.max(0, Math.ceil((liberaEm - Date.now()) / UM_DIA_MS));
}

function textoDias(dias) {
  return dias === 1 ? "1 dia" : `${dias} dias`;
}

async function buscarUsuarioOuFalhar(usuarioId) {
  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
  if (!usuario) {
    const erro = new Error("Usuário não encontrado.");
    erro.status = 404;
    throw erro;
  }
  return usuario;
}

async function conferirSenha(usuario, senha) {
  if (!senha) throw erroDeValidacao("Digite sua senha atual para confirmar.");
  const senhaValida = await bcrypt.compare(senha, usuario.senha);
  if (!senhaValida) throw erroDeValidacao("Senha incorreta.");
}

function formatarConta(usuario) {
  return {
    nome: usuario.nome,
    email: usuario.email,
    emailPendente: usuario.emailPendente,
    nomeAlteradoEm: usuario.nomeAlteradoEm,
    emailAlteradoEm: usuario.emailAlteradoEm,
    diasParaAlterarNome: diasRestantes(usuario.nomeAlteradoEm),
    diasParaAlterarEmail: diasRestantes(usuario.emailAlteradoEm),
    diasEntreAlteracoes: DIAS_ENTRE_ALTERACOES,
  };
}

async function buscarConta(usuarioId) {
  return formatarConta(await buscarUsuarioOuFalhar(usuarioId));
}

// ---------- Nome ----------

async function alterarNome(usuarioId, nome) {
  const usuario = await buscarUsuarioOuFalhar(usuarioId);
  const nomeLimpo = String(nome ?? "").trim().replace(/\s+/g, " ");

  if (nomeLimpo.length < TAMANHO_MINIMO_NOME || nomeLimpo.length > TAMANHO_MAXIMO_NOME) {
    throw erroDeValidacao(
      `O nome precisa ter entre ${TAMANHO_MINIMO_NOME} e ${TAMANHO_MAXIMO_NOME} caracteres.`
    );
  }
  if (nomeLimpo === usuario.nome) {
    throw erroDeValidacao("Esse já é o seu nome atual.");
  }
  const faltam = diasRestantes(usuario.nomeAlteradoEm);
  if (faltam > 0) {
    throw erroDeValidacao(`Você só pode trocar de nome de novo daqui a ${textoDias(faltam)}.`);
  }

  const atualizado = await prisma.usuario.update({
    where: { id: usuarioId },
    data: { nome: nomeLimpo, nomeAlteradoEm: new Date() },
  });
  return formatarConta(atualizado);
}

// ---------- E-mail (em duas etapas) ----------

// Etapa 1: confere a senha, guarda o e-mail novo como pendente e manda um
// código PRA ELE. O e-mail da conta ainda não muda aqui.
async function solicitarTrocaEmail(usuarioId, { novoEmail, senha }) {
  const usuario = await buscarUsuarioOuFalhar(usuarioId);
  const emailLimpo = String(novoEmail ?? "").trim().toLowerCase();

  if (!EMAIL_REGEX.test(emailLimpo)) {
    throw erroDeValidacao("Digite um e-mail válido.");
  }
  if (emailLimpo === usuario.email.toLowerCase()) {
    throw erroDeValidacao("Esse já é o e-mail da sua conta.");
  }
  const faltam = diasRestantes(usuario.emailAlteradoEm);
  if (faltam > 0) {
    throw erroDeValidacao(`Você só pode trocar de e-mail de novo daqui a ${textoDias(faltam)}.`);
  }
  await conferirSenha(usuario, senha);

  // semFiltro: um e-mail de conta excluída (soft delete) continua ocupado no
  // banco (Usuario.email é único), então também não pode ser reaproveitado.
  const emUso = await prisma.semFiltro.usuario.findFirst({
    where: { email: { equals: emailLimpo, mode: "insensitive" } },
    select: { id: true },
  });
  if (emUso) {
    throw erroDeValidacao("Esse e-mail já está em uso por outra conta.");
  }

  const codigo = gerarCodigo();
  const atualizado = await prisma.usuario.update({
    where: { id: usuarioId },
    data: {
      emailPendente: emailLimpo,
      codigoTrocaEmail: codigo,
      codigoTrocaEmailExpiraEm: new Date(Date.now() + CODIGO_VALIDO_MINUTOS * 60 * 1000),
    },
  });

  try {
    await enviarEmailTrocaEmail(emailLimpo, usuario.nome, codigo);
  } catch (erroEnvio) {
    console.error("Falha ao enviar o código de troca de e-mail:", erroEnvio);
    await cancelarTrocaEmail(usuarioId);
    const erro = new Error("Não foi possível enviar o código para esse e-mail. Tente novamente.");
    erro.status = 502;
    throw erro;
  }

  return formatarConta(atualizado);
}

// Etapa 2: com o código certo (e dentro do prazo), o e-mail novo passa a
// ser o e-mail da conta — inclusive o de login.
async function confirmarTrocaEmail(usuarioId, codigo) {
  const usuario = await buscarUsuarioOuFalhar(usuarioId);

  if (!usuario.emailPendente || !usuario.codigoTrocaEmail) {
    throw erroDeValidacao("Não há nenhuma troca de e-mail em andamento.");
  }
  if (!usuario.codigoTrocaEmailExpiraEm || usuario.codigoTrocaEmailExpiraEm < new Date()) {
    throw erroDeValidacao("O código expirou. Peça um novo código.");
  }
  if (String(codigo ?? "").trim() !== usuario.codigoTrocaEmail) {
    throw erroDeValidacao("Código incorreto.");
  }

  // Confere de novo: alguém pode ter se cadastrado com esse e-mail enquanto
  // o código estava pendente.
  const emUso = await prisma.semFiltro.usuario.findFirst({
    where: {
      email: { equals: usuario.emailPendente, mode: "insensitive" },
      id: { not: usuarioId },
    },
    select: { id: true },
  });
  if (emUso) {
    await cancelarTrocaEmail(usuarioId);
    throw erroDeValidacao("Esse e-mail passou a ser usado por outra conta. Escolha outro.");
  }

  const atualizado = await prisma.usuario.update({
    where: { id: usuarioId },
    data: {
      email: usuario.emailPendente,
      emailAlteradoEm: new Date(),
      emailPendente: null,
      codigoTrocaEmail: null,
      codigoTrocaEmailExpiraEm: null,
    },
  });
  return formatarConta(atualizado);
}

async function cancelarTrocaEmail(usuarioId) {
  const atualizado = await prisma.usuario.update({
    where: { id: usuarioId },
    data: { emailPendente: null, codigoTrocaEmail: null, codigoTrocaEmailExpiraEm: null },
  });
  return formatarConta(atualizado);
}

// ---------- Exclusão (soft delete) ----------

// Não apaga nada: prisma.usuario.delete é interceptado pela extensão de soft
// delete (ver config/prisma.js) e só preenche Usuario.deletedAt. A conta
// some do jogo (login, ranking, busca) mas continua no banco — um
// administrador consegue reativá-la no painel (Admin > Usuários).
async function excluirConta(usuarioId, { senha, confirmacao }) {
  const usuario = await buscarUsuarioOuFalhar(usuarioId);

  if (String(confirmacao ?? "").trim().toUpperCase() !== TEXTO_CONFIRMACAO_EXCLUSAO) {
    throw erroDeValidacao(`Digite ${TEXTO_CONFIRMACAO_EXCLUSAO} para confirmar a exclusão.`);
  }
  await conferirSenha(usuario, senha);

  await prisma.usuario.delete({ where: { id: usuarioId } });
  return { excluida: true };
}

module.exports = {
  buscarConta,
  alterarNome,
  solicitarTrocaEmail,
  confirmarTrocaEmail,
  cancelarTrocaEmail,
  excluirConta,
};
