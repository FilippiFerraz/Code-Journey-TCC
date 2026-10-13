// Telas do app carregadas sob demanda (code splitting).
//
// Antes, todas as telas (inclusive o painel de admin, as batalhas e o
// framer-motion) iam num único arquivo JavaScript que o navegador baixava e
// executava ANTES de mostrar qualquer coisa. Agora cada tela vira um arquivo
// próprio, baixado só quando o jogador entra nela — e prefetchTelas() puxa as
// mais usadas em segundo plano, depois que a primeira tela já apareceu, pra a
// navegação seguinte continuar instantânea.
//
// Pra adicionar uma tela: coloque uma linha em `carregadores` e use
// `telas.NomeDaTela` em App.jsx.
import { lazy } from "react";

const carregadores = {
  Cadastro: () => import("./pages/Cadastro/Cadastro"),
  VerificarEmail: () => import("./pages/VerificarEmail/VerificarEmail"),
  EsqueciSenha: () => import("./pages/EsqueciSenha/EsqueciSenha"),
  Home: () => import("./pages/Home/Home"),
  SelecionarDificuldade: () => import("./pages/SelecionarDificuldade/SelecionarDificuldade"),
  Desafios: () => import("./pages/Desafios/Desafios"),
  DesafioIntro: () => import("./pages/DesafioIntro/DesafioIntro"),
  ResolverDesafio: () => import("./pages/ResolverDesafio/ResolverDesafio"),
  DesafioChefe: () => import("./pages/DesafioChefe/DesafioChefe"),
  DesafioIntroPocao: () => import("./pages/DesafioIntroPocao/DesafioIntroPocao"),
  ResolverDesafioPocao: () => import("./pages/ResolverDesafioPocao/ResolverDesafioPocao"),
  DesafioEtapas: () => import("./pages/DesafioEtapas/DesafioEtapas"),
  Perfil: () => import("./pages/Perfil/Perfil"),
  Ranking: () => import("./pages/Ranking/Ranking"),
  EditarPersonagem: () => import("./pages/Editarpersonagem/EditarPersonagem"),
  RecompensaDesafio: () => import("./pages/RecompensaDesafio/RecompensaDesafio"),
  BauDaSorte: () => import("./pages/BauDaSorte/BauDaSorte"),
  DesafioRei: () => import("./pages/DesafioRei/DesafioRei"),
  Configuracoes: () => import("./pages/Configuracoes/Configuracoes"),
  Conta: () => import("./pages/Configuracoes/Conta/Conta"),
  Admin: () => import("./pages/Admin/Admin"),
  AdminUsuarios: () => import("./pages/Admin/Usuarios/AdminUsuarios"),
  AdminDesafios: () => import("./pages/Admin/Desafios/AdminDesafios"),
  EditarDesafioAdmin: () => import("./pages/Admin/Desafios/EditarDesafioAdmin"),
  AdminDashboard: () => import("./pages/Admin/Dashboard/AdminDashboard"),
  AdminLogs: () => import("./pages/Admin/Logs/AdminLogs"),
  AdminLoginHistorico: () => import("./pages/Admin/LoginHistorico/AdminLoginHistorico"),
};

export const telas = Object.fromEntries(
  Object.entries(carregadores).map(([nome, carregar]) => [nome, lazy(carregar)])
);

// Telas que o jogador quase sempre abre logo depois de entrar.
const TELAS_QUENTES = [
  "Home",
  "Desafios",
  "SelecionarDificuldade",
  "Perfil",
  "EditarPersonagem",
  "Ranking",
  "DesafioIntro",
  "ResolverDesafio",
  "RecompensaDesafio",
];

// Baixa as telas mais usadas em segundo plano, quando o navegador está
// ocioso, sem atrapalhar o que o jogador está vendo. Chamar mais de uma vez
// não baixa de novo (o import() é guardado em cache pelo navegador).
export function prefetchTelas(nomes = TELAS_QUENTES) {
  const rodar = () => nomes.forEach((nome) => carregadores[nome]?.().catch(() => {}));
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(rodar, { timeout: 4000 });
  } else {
    setTimeout(rodar, 1500);
  }
}
