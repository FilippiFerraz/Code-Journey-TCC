const itemService = require("../services/item.service");

async function getItens(req, res, next) {
  try {
    const itens = await itemService.listarItens();
    return res.status(200).json(itens);
  } catch (erro) {
    next(erro);
  }
}

module.exports = { getItens };
