import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login/Login";
import Cadastro from "./pages/Cadastro/Cadastro";
import EsqueciSenha from "./pages/EsqueciSenha/EsqueciSenha";
import Home from "./pages/Home/Home";
import SelecionarDificuldade from "./pages/SelecionarDificuldade/SelecionarDificuldade";
import Desafios from "./pages/Desafios/Desafios";
import DesafioIntro from "./pages/DesafioIntro/DesafioIntro";
import ResolverDesafio from "./pages/ResolverDesafio/ResolverDesafio";
import Perfil from "./pages/Perfil/Perfil";
import EditarPersonagem from "./pages/EditarPersonagem/EditarPersonagem";




function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/cadastrar" element={<Cadastro />} />
        <Route path="/esqueci-senha" element={<EsqueciSenha />} />
        <Route path="/home" element={<Home />} />
        <Route path="/dificuldade/:mundoId" element={<SelecionarDificuldade />} />
        <Route path="/desafios/:mundoId/:dificuldade" element={<Desafios />} />
        <Route path="/desafio/:mundoId/:dificuldade/:desafioId" element={<DesafioIntro />} />
        <Route path="/codigo/:mundoId/:dificuldade/:desafioId" element={<ResolverDesafio />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/editar-personagem" element={<EditarPersonagem />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;