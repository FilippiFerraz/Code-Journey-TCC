const prisma = require("../config/prisma");

// Faixas etárias fixas — a ordem importa pro gráfico (eixo ordenado por
// idade), por isso não vem de config nenhuma, fica hardcoded mesmo.
const FAIXAS_IDADE = [
  { rotulo: "< 18", min: 0, max: 17 },
  { rotulo: "18–24", min: 18, max: 24 },
  { rotulo: "25–34", min: 25, max: 34 },
  { rotulo: "35–44", min: 35, max: 44 },
  { rotulo: "45+", min: 45, max: 999 },
];
const ROTULO_SEM_IDADE = "Não informado";

function classificarFaixa(idade) {
  if (idade === null || idade === undefined) return ROTULO_SEM_IDADE;
  const faixa = FAIXAS_IDADE.find((f) => idade >= f.min && idade <= f.max);
  return faixa ? faixa.rotulo : ROTULO_SEM_IDADE;
}

// Últimos 6 meses (incluindo o atual), do mais antigo pro mais recente —
// pra sempre mostrar uma janela fixa mesmo em meses sem cadastro nenhum.
function ultimosMeses(quantidade) {
  const agora = new Date();
  const meses = [];
  for (let i = quantidade - 1; i >= 0; i--) {
    const data = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
    meses.push({ ano: data.getFullYear(), mes: data.getMonth() });
  }
  return meses;
}

// Métricas do painel de administração (ver AdminDashboard.jsx). Usa
// prisma.semFiltro de propósito nas contagens de usuário — as métricas
// gerais (total, por idade, por mês) precisam contar todo mundo, inclusive
// contas desativadas, senão o painel subestima o histórico real.
async function buscarMetricas() {
  const usuarios = await prisma.semFiltro.usuario.findMany({
    select: {
      id: true,
      nome: true,
      idade: true,
      role: true,
      xpTotal: true,
      criadoEm: true,
      deletedAt: true,
    },
  });

  const totalUsuarios = usuarios.length;
  const totalAdmins = usuarios.filter((u) => u.role === "administrador").length;
  const totalAtivos = usuarios.filter((u) => !u.deletedAt).length;
  const totalDesativados = totalUsuarios - totalAtivos;

  // ---- distribuição por faixa etária ----
  const rotulosFaixa = [...FAIXAS_IDADE.map((f) => f.rotulo), ROTULO_SEM_IDADE];
  const contagemPorFaixa = new Map(rotulosFaixa.map((rotulo) => [rotulo, 0]));
  usuarios.forEach((usuario) => {
    const faixa = classificarFaixa(usuario.idade);
    contagemPorFaixa.set(faixa, contagemPorFaixa.get(faixa) + 1);
  });
  const porIdade = rotulosFaixa.map((rotulo) => ({
    faixa: rotulo,
    total: contagemPorFaixa.get(rotulo),
  }));

  // ---- cadastros por mês (últimos 6 meses) ----
  const porMes = ultimosMeses(6).map(({ ano, mes }) => {
    const total = usuarios.filter((usuario) => {
      const data = new Date(usuario.criadoEm);
      return data.getFullYear() === ano && data.getMonth() === mes;
    }).length;

    return {
      mes: new Date(ano, mes, 1).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
      total,
    };
  });

  // ---- top 5 por XP (só contas ativas) ----
  const topXp = usuarios
    .filter((usuario) => !usuario.deletedAt)
    .sort((a, b) => b.xpTotal - a.xpTotal)
    .slice(0, 5)
    .map((usuario) => ({ nome: usuario.nome || "—", xpTotal: usuario.xpTotal }));

  // ---- taxa de conclusão por desafio ----
  const desafios = await prisma.desafio.findMany({
    select: { id: true, mundoId: true, dificuldade: true, numero: true, titulo: true },
    orderBy: [{ mundoId: "asc" }, { dificuldade: "asc" }, { numero: "asc" }],
  });

  const concluidosPorDesafio = await prisma.progresso.groupBy({
    by: ["desafioId"],
    where: { concluido: true },
    _count: { _all: true },
  });
  const mapaConcluidos = new Map(
    concluidosPorDesafio.map((linha) => [linha.desafioId, linha._count._all])
  );

  const taxaConclusao = desafios.map((desafio) => {
    const concluidos = mapaConcluidos.get(desafio.id) || 0;
    return {
      rotulo: `Mundo ${desafio.mundoId} • Desafio ${desafio.numero}`,
      concluidos,
      percentual: totalUsuarios > 0 ? Math.round((concluidos / totalUsuarios) * 100) : 0,
    };
  });

  return {
    resumo: { totalUsuarios, totalAdmins, totalAtivos, totalDesativados },
    porIdade,
    porMes,
    topXp,
    taxaConclusao,
  };
}

module.exports = { buscarMetricas };
