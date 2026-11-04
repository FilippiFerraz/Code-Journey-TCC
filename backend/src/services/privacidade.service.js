// Direitos do titular e ciclo de vida dos dados pessoais (LGPD — Lei
// 13.709/2018). Ver também config/privacidade.js e a Política de
// Privacidade no frontend (pages/Privacidade).
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const prisma = require("../config/prisma");
const {
  RETENCAO_HISTORICO_LOGIN_DIAS,
  CADASTRO_NAO_CONFIRMADO_DIAS,
} = require("../config/privacidade");

const UM_DIA_MS = 24 * 60 * 60 * 1000;

// ---- Eliminação (art. 18, VI) ----
//
// Excluir a conta pelo próprio jogador ANONIMIZA os dados pessoais de forma
// irreversível (art. 5º, XI e art. 16): nome, e-mail, idade e senha somem e
// o que sobra (XP, progresso, itens) deixa de identificar alguém — fica só
// como estatística de uso do jogo. Antes era só um "esconder" (soft delete):
// nome, e-mail e idade continuavam guardados para sempre.
//
// O histórico de login (data/hora e IP) ligado à conta continua pelo prazo
// do Marco Civil (art. 15, 6 meses) e depois é apagado em
// limparDadosVencidos — mas já sem nome e e-mail.
//
// A desativação feita por um ADMINISTRADOR (admin.service.js::alterarAtivo)
// é outra coisa: moderação reversível, que mantém os dados.
async function anonimizarConta(usuarioId) {
  const sufixo = crypto.randomBytes(8).toString("hex");
  // senha aleatória descartada: ninguém mais consegue entrar nesta conta
  const senhaInutilizavel = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10);

  await prisma.$transaction([
    prisma.usuario.update({
      where: { id: usuarioId },
      data: {
        nome: "Conta excluída",
        // ".invalid" é um domínio reservado (RFC 2606): nunca recebe e-mail.
        // Libera o e-mail original pra um cadastro novo, se a pessoa quiser.
        email: `excluida-${usuarioId}-${sufixo}@conta-excluida.invalid`,
        senha: senhaInutilizavel,
        idade: null,
        codigoRecuperacao: null,
        codigoExpiraEm: null,
        codigoVerificacao: null,
        codigoVerificacaoExpiraEm: null,
        emailPendente: null,
        codigoTrocaEmail: null,
        codigoTrocaEmailExpiraEm: null,
        rankingVisivel: false,
        sessaoVersao: { increment: 1 },
        deletedAt: new Date(),
      },
    }),
    // o nome do herói é escolhido pelo jogador (pode ser o nome dele)
    prisma.personagem.updateMany({
      where: { usuarioId },
      data: { nome: "Guerreiro", imagemUrl: null },
    }),
    prisma.loginHistorico.updateMany({
      where: { usuarioId },
      data: { nomeUsuario: null, emailTentado: "conta-excluida" },
    }),
  ]);
}

// ---- Acesso e portabilidade (art. 18, II e V) ----
//
// Tudo o que o Code Journey guarda sobre o jogador, num JSON legível por
// pessoas e por máquinas (GET /api/conta/meus-dados). Ficam de fora só
// segredos de segurança (hash da senha, códigos de verificação), que não
// são "dados sobre a pessoa" e não podem sair do servidor.
async function exportarMeusDados(usuarioId) {
  const [usuario, personagem, progresso, itensLoja, baus, logins] = await Promise.all([
    prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        id: true,
        nome: true,
        email: true,
        idade: true,
        criadoEm: true,
        emailVerificado: true,
        role: true,
        xpTotal: true,
        moedas: true,
        rankingVisivel: true,
        fundoPerfil: true,
        tutorialVisto: true,
        introVista: true,
        nomeAlteradoEm: true,
        emailAlteradoEm: true,
        emailPendente: true,
        termosAceitosEm: true,
        termosVersao: true,
      },
    }),
    prisma.personagem.findUnique({
      where: { usuarioId },
      select: {
        nome: true,
        nivel: true,
        aparencia: true,
        criadoEm: true,
        itens: {
          select: { quantidade: true, equipado: true, obtidoEm: true, item: { select: { nome: true, tipo: true, raridade: true } } },
          orderBy: { obtidoEm: "asc" },
        },
      },
    }),
    prisma.progresso.findMany({
      where: { usuarioId },
      select: {
        concluido: true,
        tentativas: true,
        xpGanho: true,
        tempoSegundos: true,
        etapasConcluidas: true,
        dataConclusao: true,
        criadoEm: true,
        desafio: { select: { mundoId: true, dificuldade: true, numero: true, titulo: true } },
      },
      orderBy: { criadoEm: "asc" },
    }),
    prisma.itemLojaUsuario.findMany({ where: { usuarioId }, select: { chave: true, quantidade: true } }),
    prisma.bauMundo.findMany({
      where: { usuarioId },
      select: { mundoId: true, dificuldade: true, abertoEm: true, itemGanho: { select: { nome: true } } },
    }),
    prisma.loginHistorico.findMany({
      where: { usuarioId },
      select: { criadoEm: true, sucesso: true, motivoFalha: true, ip: true, userAgent: true },
      orderBy: { criadoEm: "desc" },
    }),
  ]);

  if (!usuario) {
    const erro = new Error("Usuário não encontrado.");
    erro.status = 404;
    throw erro;
  }

  return {
    sobre: {
      geradoEm: new Date().toISOString(),
      descricao:
        "Cópia de todos os dados pessoais que o Code Journey guarda sobre você (LGPD, art. 18). " +
        "Ficam de fora apenas segredos de segurança, como o hash da sua senha.",
      retencaoHistoricoLoginDias: RETENCAO_HISTORICO_LOGIN_DIAS,
    },
    conta: usuario,
    personagem,
    progresso: progresso.map(({ desafio, ...p }) => ({ ...desafio, ...p })),
    lojinha: itensLoja,
    bausAbertos: baus.map(({ itemGanho, ...b }) => ({ ...b, itemGanho: itemGanho?.nome ?? null })),
    historicoDeLogin: logins,
  };
}

// ---- Retenção (art. 15 e 16) ----
//
// Apaga o que já cumpriu a finalidade:
// - histórico de login com mais de 6 meses (mínimo do Marco Civil, art. 15);
// - cadastros nunca confirmados por e-mail depois de 30 dias (a pessoa não
//   chegou a usar o jogo — só sobraram nome, e-mail e idade sem finalidade).
// Roda de carona nos logins (ver loginHistorico.service.js), no máximo uma
// vez a cada INTERVALO_MS por instância — sem precisar de um agendador.
const INTERVALO_MS = 6 * 60 * 60 * 1000;
let ultimaLimpeza = 0;

async function limparDadosVencidos({ forcar = false } = {}) {
  if (!forcar && Date.now() - ultimaLimpeza < INTERVALO_MS) return null;
  ultimaLimpeza = Date.now();

  const limiteLogin = new Date(Date.now() - RETENCAO_HISTORICO_LOGIN_DIAS * UM_DIA_MS);
  const { count: loginsApagados } = await prisma.loginHistorico.deleteMany({
    where: { criadoEm: { lt: limiteLogin } },
  });

  const limiteCadastro = new Date(Date.now() - CADASTRO_NAO_CONFIRMADO_DIAS * UM_DIA_MS);
  // semFiltro: o cliente sem a extensão de soft delete — aqui é exclusão de
  // verdade. Só contas que nunca confirmaram o e-mail e não têm nada no jogo.
  const pendentes = await prisma.semFiltro.usuario.findMany({
    where: {
      emailVerificado: false,
      criadoEm: { lt: limiteCadastro },
      personagem: { is: null },
      progresso: { none: {} },
      bausMundo: { none: {} },
      itensLoja: { none: {} },
      logsAdmin: { none: {} },
    },
    select: { id: true },
  });
  let cadastrosApagados = 0;
  if (pendentes.length > 0) {
    const ids = pendentes.map((u) => u.id);
    const [, apagados] = await prisma.semFiltro.$transaction([
      prisma.semFiltro.loginHistorico.updateMany({
        where: { usuarioId: { in: ids } },
        data: { usuarioId: null, nomeUsuario: null },
      }),
      prisma.semFiltro.usuario.deleteMany({ where: { id: { in: ids }, emailVerificado: false } }),
    ]);
    cadastrosApagados = apagados.count;
  }

  return { loginsApagados, cadastrosApagados };
}

module.exports = { anonimizarConta, exportarMeusDados, limparDadosVencidos };
