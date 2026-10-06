// Esquemas de validação por rota, usados com o middleware validar
// (middlewares/validacao.middleware.js) nos arquivos de routes/. Cada campo
// declara a regra (ver regras.js) e o rótulo que aparece nas mensagens de
// erro. Campo que não está aqui é descartado antes de chegar no controller.
const r = require("./regras");

function campo(rotulo, regra) {
  return { rotulo, regra };
}

// Trilhas que existem hoje (ver SelecionarDificuldade.jsx no frontend).
const DIFICULDADES = ["iniciante", "guerreiro"];
const PAPEIS = ["jogador", "administrador"];

const LIMITE_POR_PAGINA = 100;
const paginacao = {
  pagina: campo("página", r.opcional(r.inteiro({ min: 1, max: 100000 }))),
  limite: campo("limite", r.opcional(r.inteiro({ min: 1, max: LIMITE_POR_PAGINA }))),
};

// ---------- /api/auth ----------

const auth = {
  cadastro: {
    body: {
      nome: campo("nome", r.nome),
      email: campo("e-mail", r.email),
      senha: campo("senha", r.senhaNova),
      idade: campo("idade", r.idade),
    },
  },
  login: {
    body: {
      email: campo("e-mail", r.email),
      senha: campo("senha", r.senhaInformada),
    },
  },
  somenteEmail: {
    body: { email: campo("e-mail", r.email) },
  },
  emailECodigo: {
    body: {
      email: campo("e-mail", r.email),
      codigo: campo("código", r.codigoSeisDigitos),
    },
  },
  redefinirSenha: {
    body: {
      email: campo("e-mail", r.email),
      codigo: campo("código", r.codigoSeisDigitos),
      novaSenha: campo("nova senha", r.senhaNova),
    },
  },
};

// ---------- /api/conta ----------

const conta = {
  nome: {
    body: { nome: campo("nome", r.nome) },
  },
  solicitarTrocaEmail: {
    body: {
      novoEmail: campo("novo e-mail", r.email),
      senha: campo("senha", r.senhaInformada),
    },
  },
  confirmarTrocaEmail: {
    body: { codigo: campo("código", r.codigoSeisDigitos) },
  },
  excluir: {
    body: {
      senha: campo("senha", r.senhaInformada),
      confirmacao: campo("confirmação", r.texto({ max: 20 })),
    },
  },
};

// ---------- /api/perfil ----------

const perfil = {
  buscar: {
    query: { nome: campo("busca", r.opcional(r.texto({ max: r.NOME_MAXIMO }))) },
  },
  publico: {
    params: { usuarioId: campo("usuário", r.idPositivo) },
  },
};

// ---------- /api/personagem ----------

const personagem = {
  // imagemUrl não é aceito: nenhuma tela usa esse campo hoje, e um
  // endereço livre de imagem é dado que o sistema não precisa receber.
  atualizar: {
    body: { nome: campo("nome do personagem", r.opcional(r.texto({ min: 2, max: 20 }))) },
  },
  item: {
    params: { itemPersonagemId: campo("item", r.idPositivo) },
  },
};

// ---------- /api/progresso ----------

const identificadores = (rotulo) => campo(rotulo, r.opcional(r.lista(r.identificador)));

const progresso = {
  responder: {
    body: {
      mundoId: campo("mundo", r.idPositivo),
      dificuldade: campo("dificuldade", r.umDe(DIFICULDADES)),
      numero: campo("número do desafio", r.idPositivo),
      opcaoId: campo("alternativa", r.opcional(r.identificador)),
      ordem: identificadores("ordem dos blocos"),
      ingredientes: identificadores("ingredientes"),
      classificacoes: campo("classificações", r.opcional(r.lista(r.booleano))),
      respostas: campo(
        "respostas da batalha",
        r.opcional(
          r.lista(
            r.objeto({
              perguntaId: r.identificador,
              opcaoId: r.identificador,
            })
          )
        )
      ),
      // Mesmo limite da correção por IA (TAMANHO_MAXIMO_RESPOSTA em ia.service.js).
      respostaTexto: campo(
        "resposta",
        r.opcional(r.texto({ max: 2000, removerQuebras: false }))
      ),
      // Até 24h — acima disso não é tempo de resolução real.
      tempoSegundos: campo("tempo", r.opcional(r.numero({ min: 0, max: 86400 }))),
    },
  },
  listar: {
    query: {
      mundoId: campo("mundo", r.opcional(r.idPositivo)),
      dificuldade: campo("dificuldade", r.opcional(r.umDe(DIFICULDADES))),
    },
  },
};

// ---------- /api/baus ----------

const bau = {
  abrir: {
    params: { mundoId: campo("mundo", r.idPositivo) },
    body: { dificuldade: campo("dificuldade", r.opcional(r.umDe(DIFICULDADES))) },
  },
};

// ---------- /api/admin ----------

const admin = {
  usuarioId: {
    params: { usuarioId: campo("usuário", r.idPositivo) },
  },
  listarUsuarios: {
    query: { busca: campo("busca", r.opcional(r.texto({ max: 100 }))), ...paginacao },
  },
  exportarUsuarios: {
    query: { busca: campo("busca", r.opcional(r.texto({ max: 100 }))) },
  },
  alterarPapel: {
    params: { usuarioId: campo("usuário", r.idPositivo) },
    body: { role: campo("papel", r.umDe(PAPEIS)) },
  },
  alterarAtivo: {
    params: { usuarioId: campo("usuário", r.idPositivo) },
    body: { ativo: campo("ativo", r.booleano) },
  },
  // Só o id: o corpo da edição de desafio tem vários formatos e já é
  // validado campo a campo em desafio.service.js::atualizarDesafio.
  desafioId: {
    params: { desafioId: campo("desafio", r.idPositivo) },
  },
  logs: {
    query: {
      acao: campo("ação", r.opcional(r.texto({ max: 50 }))),
      entidade: campo("entidade", r.opcional(r.texto({ max: 50 }))),
      ...paginacao,
    },
  },
  loginHistorico: {
    query: {
      busca: campo("busca", r.opcional(r.texto({ max: 100 }))),
      usuarioId: campo("usuário", r.opcional(r.idPositivo)),
      // login-historico.service compara com o texto "true"/"false".
      sucesso: campo("sucesso", r.opcional(r.umDe(["true", "false"]))),
      ...paginacao,
    },
  },
};

module.exports = { auth, conta, perfil, personagem, progresso, bau, admin };
