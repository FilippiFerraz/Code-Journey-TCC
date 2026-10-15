// scripts/cadastrarItensGuardiaoCristal.js
//
// Cadastra só os itens da coleção "Guardião de Cristal" (Baú de Cristal —
// ver prisma/itensGuardiaoCristal.js) num banco que já está em uso, sem
// rodar o seed inteiro (que também regrava os desafios e desfaria edições
// feitas pelo painel de admin).
//
// Só cria o que ainda não existe (procura pelo nome); item que já existe
// não é alterado. Pode rodar quantas vezes quiser.
//
// Uso:
//   npm run itens:guardiao-cristal

require("dotenv").config();
const prisma = require("../src/config/prisma");
const itens = require("../prisma/itensGuardiaoCristal");

async function main() {
  for (const dados of itens) {
    const existente = await prisma.item.findFirst({ where: { nome: dados.nome } });
    if (existente) {
      console.log(`Já existe: ${dados.nome} (id ${existente.id})`);
      continue;
    }
    const criado = await prisma.item.create({ data: dados });
    console.log(`Cadastrado: ${criado.nome} (id ${criado.id})`);
  }
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
