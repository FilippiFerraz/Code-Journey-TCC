import { Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import Login from "./pages/Login/Login";
import { telas } from "./telas";
import TelaCarregando from "./components/TelaCarregando";
import { RotaAdmin, RotaDesafio, RotaProtegida, RotaPublica } from "./components/Rotas";

// Cada tela é um arquivo à parte, baixado só quando o jogador entra nela
// (ver telas.js) — o Login, primeira tela, continua no pacote principal.
const {
  Cadastro, VerificarEmail, EsqueciSenha, Home, SelecionarDificuldade, Desafios,
  DesafioIntro, ResolverDesafio, DesafioChefe, DesafioIntroPocao, ResolverDesafioPocao,
  DesafioEtapas, Perfil, Ranking, EditarPersonagem, RecompensaDesafio, BauDaSorte, DesafioRei, DesafioCristais, BatalhaDragao,
  Configuracoes, Conta, Admin, AdminUsuarios, AdminDesafios, EditarDesafioAdmin,
  AdminDashboard, AdminLogs, AdminLoginHistorico,
} = telas;

function App() {
  return (
    <BrowserRouter>
      {/* Todo o design é pensado pra celular — essa moldura limita a
          largura numa tela de computador em vez de esticar tudo.
          Exceção: telas com MainLayout em modo desktop (sidebar + coluna
          direita, ver layouts/MainLayout.jsx) usam a largura cheia — a
          moldura estreita ali causava o "aplicativo bugado" com barras
          laterais enormes (ver .app-frame:has(...) em App.css). */}
      <div className="app-frame">
        <Suspense fallback={<TelaCarregando />}>
        <Routes>
          {/* Só para quem NÃO está logado — logado vai direto pra Home */}
          <Route element={<RotaPublica />}>
            <Route path="/" element={<Login />} />
            <Route path="/cadastrar" element={<Cadastro />} />
          </Route>
          <Route path="/verificar-email" element={<VerificarEmail />} />
          <Route path="/esqueci-senha" element={<EsqueciSenha />} />

          {/* Só para quem está logado (ver components/Rotas.jsx) */}
          <Route element={<RotaProtegida />}>
            <Route path="/home" element={<Home />} />
            <Route path="/dificuldade/:mundoId" element={<RotaDesafio exigir="mundo"><SelecionarDificuldade /></RotaDesafio>} />
            <Route path="/desafios/:mundoId/:dificuldade" element={<RotaDesafio exigir="mundo"><Desafios /></RotaDesafio>} />
            <Route path="/desafio/:mundoId/:dificuldade/:desafioId" element={<RotaDesafio exigir="desafio"><DesafioIntro /></RotaDesafio>} />
            <Route path="/codigo/:mundoId/:dificuldade/:desafioId" element={<RotaDesafio exigir="desafio"><ResolverDesafio /></RotaDesafio>} />
            <Route path="/desafio-chefe/:mundoId/:dificuldade/:desafioId" element={<RotaDesafio exigir="desafio"><DesafioChefe /></RotaDesafio>} />
            <Route path="/desafio-pocao/:mundoId/:dificuldade/:desafioId" element={<RotaDesafio exigir="desafio"><DesafioIntroPocao /></RotaDesafio>} />
            <Route path="/pocao/:mundoId/:dificuldade/:desafioId" element={<RotaDesafio exigir="desafio"><ResolverDesafioPocao /></RotaDesafio>} />
            {/* Desafios com várias etapas (portal 3): tela genérica, conteúdo vindo da API */}
            <Route path="/etapas/:mundoId/:dificuldade/:desafioId" element={<RotaDesafio exigir="desafio"><DesafioEtapas /></RotaDesafio>} />
            <Route path="/recompensa/:mundoId/:dificuldade/:desafioId" element={<RotaDesafio exigir="concluido"><RecompensaDesafio /></RotaDesafio>} />
            <Route path="/bau/:mundoId/:dificuldade" element={<RotaDesafio exigir="mundo"><BauDaSorte /></RotaDesafio>} />
            {/* Desafio do Rei (castelo do mapa) e o Baú Real dele — a própria
                tela e o backend conferem se os dois primeiros portais foram concluídos */}
            <Route path="/desafio-do-rei" element={<DesafioRei />} />
            <Route path="/bau-rei" element={<BauDaSorte bauEspecial="rei" />} />
            {/* Desafio da Cachoeira de Cristais (cristal gigante / cachoeira do
                mapa) e o Baú de Cristal dele — liberados com o portal 1 concluído */}
            <Route path="/desafio-dos-cristais" element={<DesafioCristais />} />
            <Route path="/bau-cristal" element={<BauDaSorte bauEspecial="cristal" />} />
            {/* Batalha contra o Dragão do Código Fonte (dragão da arena do mapa)
                e o Baú do Dragão — liberados com os três portais concluídos */}
            <Route path="/batalha-do-dragao" element={<BatalhaDragao />} />
            <Route path="/bau-dragao" element={<BauDaSorte bauEspecial="dragao" />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/perfil/:usuarioId" element={<Perfil />} />
            <Route path="/ranking" element={<Ranking />} />
            <Route path="/editar-personagem" element={<EditarPersonagem />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            <Route path="/conta" element={<Conta />} />

            {/* Só para administradores */}
            <Route element={<RotaAdmin />}>
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/usuarios" element={<AdminUsuarios />} />
              <Route path="/admin/desafios" element={<AdminDesafios />} />
              <Route path="/admin/desafios/:desafioId" element={<EditarDesafioAdmin />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/logs" element={<AdminLogs />} />
              <Route path="/admin/login-historico" element={<AdminLoginHistorico />} />
            </Route>
          </Route>

          {/* URL que não existe: volta pro início (Login, ou Home se logado) */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </div>
    </BrowserRouter>
  );
}

export default App;