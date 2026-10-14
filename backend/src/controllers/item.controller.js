const itemService = require("../services/item.service");
const { filtroItensBauEspecial } = require("../services/bau.service");

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

module.exports = { getItens, getItensBauEspecial };
