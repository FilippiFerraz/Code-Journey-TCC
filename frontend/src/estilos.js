// Todo o CSS do app, carregado no pacote principal NA ORDEM EXATA em que o site
// antigo (um único pacote) o aplicava.
//
// Por que isto existe: as telas agora são carregadas sob demanda (ver
// telas.js), mas o CSS delas continua global — algumas telas definem as MESMAS
// classes (.botao-avante, .vitoria-recompensa...) e o site sempre dependeu de
// a última definição valer pra todas. Se cada tela trouxesse o próprio CSS só
// quando abre, o visual passaria a mudar conforme a ordem em que o jogador
// navega (o cronômetro mudava de canto, o botão AVANTE de lugar). Carregar o
// CSS aqui, na ordem de sempre, mantém o visual idêntico; o custo é pequeno
// (~28 KB comprimidos, e o navegador guarda em cache). O ganho de verdade está
// no JavaScript, nas imagens e nas chamadas à API.
//
// NÃO reordene: a ordem é parte do estilo. CSS novo: adicione no FIM da lista.
import "./App.css";
import "./styles/botaoPixel.css";
import "./styles/campoSenha.css";
import "./pages/Login/Login.css";
import "./pages/Cadastro/Cadastro.css";
import "./pages/VerificarEmail/VerificarEmail.css";
import "./pages/EsqueciSenha/EsqueciSenha.css";
import "./layouts/MainLayout.css";
import "./pages/Home/TutorialHome.css";
import "./pages/Home/Home.css";
import "./pages/SelecionarDificuldade/SelecionarDificuldade.css";
import "./pages/Desafios/Desafios.css";
import "./components/AvatarPersonagem.css";
import "./components/ControlesFalas.css";
import "./pages/DesafioIntro/DesafioIntro.css";
import "./components/ConfirmarSairDesafio.css";
import "./components/Temporizador.css";
import "./pages/ResolverDesafio/ResolverDesafio.css";
import "./pages/DesafioChefe/DesafioChefe.css";
import "./pages/DesafioIntroPocao/DesafioIntroPocao.css";
import "./pages/ResolverDesafioPocao/ResolverDesafioPocao.css";
import "./pages/Perfil/Perfil.css";
import "./pages/Ranking/Ranking.css";
import "./pages/Editarpersonagem/EditarPersonagem.css";
import "./pages/RecompensaDesafio/RecompensaDesafio.css";
import "./pages/BauDaSorte/BauDaSorte.css";
import "./pages/Configuracoes/Configuracoes.css";
import "./pages/Configuracoes/Conta/Conta.css";
import "./pages/Admin/Admin.css";
import "./pages/Admin/Usuarios/AdminUsuarios.css";
import "./pages/Admin/Desafios/AdminDesafios.css";
import "./pages/Admin/Dashboard/AdminDashboard.css";
import "./pages/Admin/Logs/AdminLogs.css";
import "./pages/Admin/LoginHistorico/AdminLoginHistorico.css";
import "./pages/DesafioEtapas/DesafioEtapas.css";
import "./components/TelaCarregando.css";
import "./pages/DesafioRei/DesafioRei.css";
import "./components/IconePixel.css";
import "./pages/DesafioCristais/DesafioCristais.css";
import "./pages/BatalhaDragao/BatalhaDragao.css";
import "./components/PerfilJogadorCard.css";
