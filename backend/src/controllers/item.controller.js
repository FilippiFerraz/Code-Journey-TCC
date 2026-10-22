const itemService = require("../services/item.service");
const { filtroItensBauEspecial } = require("../services/bau.service");
const { FILTRO_ITENS_BAU_LOJA } = require("../services/loja.service");

async function getItens(req, res, next) {
  try {
    const itens = await itemService.listarItens();
    return res.status(200).json(itens);
  } catch (erro) {
    next(erro);
  }
}

// :chave = rei | cristal — itens da roleta de um baú especial
async function getItensBauEspecial(req, res, next) {
  try {
    const itens = await itemService.listarItens({ filtro: filtroItensBauEspecial(req.params.chave) });
    return res.status(200).json(itens);
  } catch (erro) {
    next(erro);
  }
}

// Itens que podem sair no Baú Misterioso da Lojinha do Mago (todos os de baú)
async function getItensBauLoja(req, res, next) {
  try {
    const itens = await itemService.listarItens({ filtro: FILTRO_ITENS_BAU_LOJA });
    return res.status(200).json(itens);
  } catch (erro) {
    next(erro);
  }
}

module.exports = { getItens, getItensBauEspecial, getItensBauLoja };
