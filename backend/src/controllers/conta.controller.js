const contaService = require("../services/conta.service");
const { exportarMeusDados } = require("../services/privacidade.service");

// LGPD, art. 18 (II e V): cópia de todos os dados pessoais do jogador em JSON
async function getMeusDados(req, res, next) {
  try {
    const dados = await exportarMeusDados(idUsuario(req));
    res.setHeader("Content-Disposition", 'attachment; filename="meus-dados-code-journey.json"');
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(dados);
  } catch (erro) {
    next(erro);
  }
}

function idUsuario(req) {
  return req.usuario?.id ?? req.usuarioId;
}

async function getConta(req, res, next) {
  try {
    res.status(200).json(await contaService.buscarConta(idUsuario(req)));
  } catch (erro) {
    next(erro);
  }
}

async function putNome(req, res, next) {
  try {
    res.status(200).json(await contaService.alterarNome(idUsuario(req), req.body.nome));
  } catch (erro) {
    next(erro);
  }
}

async function postSolicitarTrocaEmail(req, res, next) {
  try {
    const { novoEmail, senha } = req.body;
    res.status(200).json(await contaService.solicitarTrocaEmail(idUsuario(req), { novoEmail, senha }));
  } catch (erro) {
    next(erro);
  }
}

async function postConfirmarTrocaEmail(req, res, next) {
  try {
    res.status(200).json(await contaService.confirmarTrocaEmail(idUsuario(req), req.body.codigo));
  } catch (erro) {
    next(erro);
  }
}

async function deleteTrocaEmail(req, res, next) {
  try {
    res.status(200).json(await contaService.cancelarTrocaEmail(idUsuario(req)));
  } catch (erro) {
    next(erro);
  }
}

async function postExcluirConta(req, res, next) {
  try {
    const { senha, confirmacao } = req.body;
    res.status(200).json(await contaService.excluirConta(idUsuario(req), { senha, confirmacao }));
  } catch (erro) {
    next(erro);
  }
}

module.exports = {
  getMeusDados,
  getConta,
  putNome,
  postSolicitarTrocaEmail,
  postConfirmarTrocaEmail,
  deleteTrocaEmail,
  postExcluirConta,
};
