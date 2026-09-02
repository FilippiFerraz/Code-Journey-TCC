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
import Perfil from "./pages/Perfil/Perfil";
import Ranking from "./pages/Ranking/Ranking";
import EditarPersonagem from "./pages/EditarPersonagem/EditarPersonagem";
import RecompensaDesafio from './pages/RecompensaDesafio/RecompensaDesafio';



function App() {
  return (
    <BrowserRouter>
      {/* Todo o design é pensado pra celular — essa moldura limita a
          largura numa tela de computador em vez de esticar tudo. */}
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
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/ranking" element={<Ranking />} />
          <Route path="/editar-personagem" element={<EditarPersonagem />} />
          <Route path="/recompensa/:mundoId/:dificuldade/:desafioId" element={<RecompensaDesafio />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;