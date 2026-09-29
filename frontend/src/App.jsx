import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import Login from "./pages/Login/Login";
import Cadastro from "./pages/Cadastro/Cadastro";
import VerificarEmail from "./pages/VerificarEmail/VerificarEmail";
import EsqueciSenha from "./pages/EsqueciSenha/EsqueciSenha";
import Home from "./pages/Home/Home";
import SelecionarDificuldade from "./pages/SelecionarDificuldade/SelecionarDificuldade";
import Desafios from "./pages/Desafios/Desafios";
import DesafioIntro from "./pages/DesafioIntro/DesafioIntro";
import ResolverDesafio from "./pages/ResolverDesafio/ResolverDesafio";
import DesafioChefe from "./pages/DesafioChefe/DesafioChefe";
import DesafioIntroPocao from "./pages/DesafioIntroPocao/DesafioIntroPocao";
import ResolverDesafioPocao from "./pages/ResolverDesafioPocao/ResolverDesafioPocao";
import Perfil from "./pages/Perfil/Perfil";
import Ranking from "./pages/Ranking/Ranking";
import EditarPersonagem from "./pages/EditarPersonagem/EditarPersonagem";
import RecompensaDesafio from './pages/RecompensaDesafio/RecompensaDesafio';
import BauDaSorte from "./pages/BauDaSorte/BauDaSorte";
import Configuracoes from "./pages/Configuracoes/Configuracoes";
import Conta from "./pages/Configuracoes/Conta/Conta";
import Admin from "./pages/Admin/Admin";
import AdminUsuarios from "./pages/Admin/Usuarios/AdminUsuarios";
import AdminDesafios from "./pages/Admin/Desafios/AdminDesafios";
import EditarDesafioAdmin from "./pages/Admin/Desafios/EditarDesafioAdmin";
import AdminDashboard from "./pages/Admin/Dashboard/AdminDashboard";
import AdminLogs from "./pages/Admin/Logs/AdminLogs";
import AdminLoginHistorico from "./pages/Admin/LoginHistorico/AdminLoginHistorico";



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
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/cadastrar" element={<Cadastro />} />
          <Route path="/verificar-email" element={<VerificarEmail />} />
          <Route path="/esqueci-senha" element={<EsqueciSenha />} />
          <Route path="/home" element={<Home />} />
          <Route path="/dificuldade/:mundoId" element={<SelecionarDificuldade />} />
          <Route path="/desafios/:mundoId/:dificuldade" element={<Desafios />} />
          <Route path="/desafio/:mundoId/:dificuldade/:desafioId" element={<DesafioIntro />} />
          <Route path="/codigo/:mundoId/:dificuldade/:desafioId" element={<ResolverDesafio />} />
          <Route path="/desafio-chefe/:mundoId/:dificuldade/:desafioId" element={<DesafioChefe />} />
          <Route path="/desafio-pocao/:mundoId/:dificuldade/:desafioId" element={<DesafioIntroPocao />} />
          <Route path="/pocao/:mundoId/:dificuldade/:desafioId" element={<ResolverDesafioPocao />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/perfil/:usuarioId" element={<Perfil />} />
          <Route path="/ranking" element={<Ranking />} />
          <Route path="/editar-personagem" element={<EditarPersonagem />} />
          <Route path="/recompensa/:mundoId/:dificuldade/:desafioId" element={<RecompensaDesafio />} />
          <Route path="/bau/:mundoId/:dificuldade" element={<BauDaSorte />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
          <Route path="/conta" element={<Conta />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/usuarios" element={<AdminUsuarios />} />
          <Route path="/admin/desafios" element={<AdminDesafios />} />
          <Route path="/admin/desafios/:desafioId" element={<EditarDesafioAdmin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/logs" element={<AdminLogs />} />
          <Route path="/admin/login-historico" element={<AdminLoginHistorico />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;