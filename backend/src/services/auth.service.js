const bcrypt = require("bcryptjs");
const prisma = require("../config/prisma");
const { gerarToken } = require("../utils/jwt");
const { enviarEmailRecuperacao, enviarEmailVerificacao } = require("./email.service");
const { registrarTentativaLogin } = require("./loginHistorico.service");
const { gerarCodigo, conferirCodigo } = require("../utils/codigos");
const { esquecerConta } = require("../utils/sessaoCache");
const { VERSAO_TERMOS } = require("../config/privacidade");

const SALT_ROUNDS = 10;
const CODIGO_VALIDO_MINUTOS = 15;

function erroDeValidacao(mensagem) {
  const erro = new Error(mensagem);
  erro.status = 400;
  return erro;
}

// Força bruta no login: o limite por IP (rateLimit.middleware.js) fica na
// memória de cada instância da Vercel e o atacante pode trocar de IP. Este
// limite é POR CONTA e usa o histórico de login que já fica no banco:
// muitas senhas erradas seguidas pro mesmo e-mail bloqueiam novas tentativas
// por alguns minutos (o dono da conta também espera, mas a senha não cai).
const LOGIN_FALHAS_MAXIMAS = 8;
const LOGIN_JANELA_MINUTOS = 15;

async function contaBloqueadaPorTentativas(email) {
  const desde = new Date(Date.now() - LOGIN_JANELA_MINUTOS * 60 * 1000);
  const ultimoSucesso = await prisma.loginHistorico.findFirst({
    where: { emailTentado: email, sucesso: true, criadoEm: { gte: desde } },
    orderBy: { criadoEm: "desc" },
    select: { criadoEm: true },
  });
  const falhas = await prisma.loginHistorico.count({
    where: {
      emailTentado: email,
      sucesso: false,
      motivoFalha: "Senha incorreta",
      criadoEm: { gte: ultimoSucesso?.criadoEm ?? desde },
    },
  });
  return falhas >= LOGIN_FALHAS_MAXIMAS;
}

// Hash de uma senha qualquer, comparado quando o e-mail não existe: assim o
// tempo de resposta é o mesmo de uma senha errada e não denuncia quais
// e-mails têm conta.
// (hash fixo de uma senha aleatória descartada — calcular na partida custaria
// ~70 ms a cada instância nova da Vercel)
const HASH_FICTICIO = "$2a$10$iUXT7UniE./EwKAZcsVt4e6F0OVGbFihcMOlcfO/OTYrYUAR6sTSS";

function erroMuitasTentativas() {
  const erro = new Error(
    `Muitas tentativas de login nesta conta. Aguarde ${LOGIN_JANELA_MINUTOS} minutos ou redefina sua senha.`
  );
  erro.status = 429;
  return erro;
}

// Formato, tamanho e força de nome/e-mail/senha/idade/código são validados
// antes de chegar aqui, pelo middleware validar com os esquemas de
// validacoes/esquemas.js (o e-mail já chega aparado e em minúsculas).

// Busca a conta pelo e-mail sem diferenciar maiúsculas/minúsculas — contas
// criadas antes da normalização podem ter o e-mail gravado com maiúsculas,
// e continuam entrando normalmente. Sem semFiltro, ignora contas excluídas
// (soft delete, ver config/prisma.js).
function buscarPorEmail(email, cliente = prisma) {
  return cliente.usuario.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });
}

// Falha ao mandar um e-mail (Gmail fora do ar, cota estourada...) vira um
// 503 com mensagem clara, em vez do 500 genérico "Erro interno".
function erroDeEnvioDeEmail(causa) {
  console.error("Falha ao enviar e-mail:", causa?.message ?? causa);
  const erro = new Error("Não conseguimos enviar o e-mail agora. Tente novamente em alguns minutos.");
  erro.status = 503;
  return erro;
}

async function cadastrar({ nome, email, senha, idade, aceiteTermos }) {
  // a rota já exige (esquemas.js); conferido de novo por ser base do tratamento
  if (aceiteTermos !== true) {
    throw erroDeValidacao("Para criar a conta, leia e aceite os Termos de Uso e a Política de Privacidade.");
  }

  // semFiltro: o e-mail de uma conta excluída (soft delete) continua
  // ocupado no banco (Usuario.email é único) — sem isso, o create abaixo
  // estourava erro 500 em vez desta mensagem.
  const usuarioExistente = await buscarPorEmail(email, prisma.semFiltro);

  if (usuarioExistente) {
    const erro = new Error("Este email já está cadastrado.");
    erro.status = 409;
    throw erro;
  }

  const senhaCriptografada = await bcrypt.hash(senha, SALT_ROUNDS);
  const codigo = gerarCodigo();
  const expiraEm = new Date(Date.now() + CODIGO_VALIDO_MINUTOS * 60 * 1000);

  const usuario = await prisma.usuario.create({
    data: {
      nome,
      email,
      senha: senhaCriptografada,
      idade,
      codigoVerificacao: codigo,
      codigoVerificacaoExpiraEm: expiraEm,
      // LGPD: registro de quando e qual versão dos termos foi aceita
      termosAceitosEm: new Date(),
      termosVersao: VERSAO_TERMOS,
    },
  });

  // Sem o e-mail a conta nunca seria confirmada — e, criada, o e-mail ficava
  // ocupado: tentar de novo dava "Este email já está cadastrado". Então, se
  // o envio falhar, a conta recém-criada (ainda sem nada ligado a ela) é
  // apagada de verdade (semFiltro: o delete normal só marcaria deletedAt).
  try {
    await enviarEmailVerificacao(usuario.email, usuario.nome, codigo);
  } catch (erroEnvio) {
    await prisma.semFiltro.usuario.delete({ where: { id: usuario.id } });
    throw erroDeEnvioDeEmail(erroEnvio);
  }

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
  // Uma consulta só, sem o filtro de conta excluída: serve tanto pra achar o
  // usuário quanto pra saber se a conta foi desativada (antes eram duas
  // consultas em sequência no caminho de falha).
  const usuarioBruto = await buscarPorEmail(email, prisma.semFiltro);
  const usuario = usuarioBruto?.deletedAt ? null : usuarioBruto;

  if (!usuario) {
    // mesmo custo de uma senha errada: o tempo de resposta não denuncia
    // quais e-mails têm conta
    await bcrypt.compare(senha, HASH_FICTICIO);
    // Busca sem o filtro de soft delete só pra saber se é uma conta
    // desativada (pra vincular usuarioId/nomeUsuario no histórico mesmo
    // nesse caso) — não muda a mensagem de erro nem o comportamento do login.
    const usuarioExcluido = usuarioBruto;

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

  if (await contaBloqueadaPorTentativas(email)) {
    await registrarTentativa({
      usuarioId: usuario.id,
      nomeUsuario: usuario.nome,
      emailTentado: email,
      sucesso: false,
      motivoFalha: "Bloqueado por excesso de tentativas",
      ip,
      userAgent,
    });
    throw erroMuitasTentativas();
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

  const token = gerarToken({ id: usuario.id, v: usuario.sessaoVersao });

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
  const usuario = await buscarPorEmail(email);

  await conferirCodigo(usuario, codigo, {
    campos: {
      codigo: "codigoVerificacao",
      expiraEm: "codigoVerificacaoExpiraEm",
      tentativas: "codigoVerificacaoTentativas",
    },
  });

  const usuarioAtualizado = await prisma.usuario.update({
    where: { id: usuario.id },
    data: {
      emailVerificado: true,
      codigoVerificacao: null,
      codigoVerificacaoExpiraEm: null,
      codigoVerificacaoTentativas: 0,
    },
  });

  const token = gerarToken({ id: usuarioAtualizado.id, v: usuarioAtualizado.sessaoVersao });

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

  const usuario = await buscarPorEmail(email);
  if (!usuario || usuario.emailVerificado) return resposta;

  const codigo = gerarCodigo();
  const expiraEm = new Date(Date.now() + CODIGO_VALIDO_MINUTOS * 60 * 1000);

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { codigoVerificacao: codigo, codigoVerificacaoExpiraEm: expiraEm, codigoVerificacaoTentativas: 0 },
  });

  try {
    await enviarEmailVerificacao(usuario.email, usuario.nome, codigo);
  } catch (erroEnvio) {
    throw erroDeEnvioDeEmail(erroEnvio);
  }

  return resposta;
}

// --- Recuperação de senha ---

// Gera um código de 6 dígitos, salva no banco com validade e envia por email
async function esqueciSenha({ email }) {
  const usuario = await buscarPorEmail(email);

  // Resposta sempre igual, exista ou não o email — não revela quem tem conta
  const resposta = {
    mensagem: "Se este email estiver cadastrado, você receberá um código.",
  };

  if (!usuario) return resposta;

  const codigo = gerarCodigo();
  const expiraEm = new Date(Date.now() + CODIGO_VALIDO_MINUTOS * 60 * 1000);

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { codigoRecuperacao: codigo, codigoExpiraEm: expiraEm, codigoRecuperacaoTentativas: 0 },
  });

  try {
    await enviarEmailRecuperacao(usuario.email, usuario.nome, codigo);
  } catch (erroEnvio) {
    throw erroDeEnvioDeEmail(erroEnvio);
  }

  return resposta;
}

// Busca o usuário e confere se o código bate e ainda está válido
async function validarCodigoRecuperacao(email, codigo) {
  const usuario = await buscarPorEmail(email);

  // limite de tentativas POR CÓDIGO, no banco (ver utils/codigos.js)
  return conferirCodigo(usuario, codigo, {
    campos: {
      codigo: "codigoRecuperacao",
      expiraEm: "codigoExpiraEm",
      tentativas: "codigoRecuperacaoTentativas",
    },
    mensagens: {
      semCodigo: "Código inválido. Solicite um novo código.",
      expirado: "Código expirado. Solicite um novo código.",
    },
  });
}

async function verificarCodigo({ email, codigo }) {
  await validarCodigoRecuperacao(email, codigo);
  return { mensagem: "Código válido." };
}

async function redefinirSenha({ email, codigo, novaSenha }) {
  const usuario = await validarCodigoRecuperacao(email, codigo);
  const senhaHash = await bcrypt.hash(novaSenha, SALT_ROUNDS);

  // Salva a nova senha e queima o código, para não poder ser usado de novo.
  // sessaoVersao + 1 derruba todas as sessões abertas (tokens antigos) — se
  // a senha foi trocada porque alguém invadiu a conta, o invasor sai junto.
  await prisma.usuario.update({
    where: { id: usuario.id },
    data: {
      senha: senhaHash,
      codigoRecuperacao: null,
      codigoExpiraEm: null,
      codigoRecuperacaoTentativas: 0,
      sessaoVersao: { increment: 1 },
    },
  });
  esquecerConta(usuario.id);

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
