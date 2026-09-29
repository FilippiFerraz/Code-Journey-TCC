import { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Check, X } from "lucide-react";
import api from "../../services/api";
import { usePersonagemAvatar } from "../../hooks/usePersonagemAvatar";
import { useCronometro } from "../../hooks/useCronometro";
import { formatarTempo } from "../../utils/tempo";
import { tocarSom } from "../../utils/sons";
import BotaoPixel from "../../components/BotaoPixel";
import ConfirmarSairDesafio from "../../components/ConfirmarSairDesafio";
import guerreiroAtaque from "../../assets/images/Guerreiro_ataque.gif";
import slime from "../../assets/images/Slime.png";
import goblinJS from "../../assets/images/GoblinJS.png";
import esqueletoInimigo from "../../assets/images/esqueleto_inimigo.png";
import mercadorInimigo from "../../assets/images/mercador_inimigo.png";
import bruxaInimigo from "../../assets/images/bruxa_inimigo.png";
import fundoBatalha from "../../assets/images/Fundo_batalha.png";
import fundoBatalha2 from "../../assets/images/Fundo_batalha2.png";
import "./ResolverDesafio.css";

const VIDA_MAXIMA = 3;

// Quanto tempo o GIF de ataque fica visível antes de voltar pro herói
// parado. Ajuste esse valor pra bater com a duração real do
// Guerreiro_ataque.gif (hoje está um pouco antes do golpe "conectar"
// no slime, que acontece em 450ms — ver vencer()).
const DURACAO_GIF_ATAQUE_MS = 600;

// Enquanto a rota de desafios não existe no backend, o conteúdo fica aqui.
// Depois é só trocar por um GET /desafios/:mundoId/:dificuldade/:desafioId
//
// Aninhado por mundoId -> numero do desafio (mesmo motivo do INTROS em
// DesafioIntro.jsx): o numero se repete em cada trilha/portal.
//
// "tipo" diferencia o formato do exercício:
// - "multipla_escolha" (padrão, se omitido): desafio.opcoes com { id, texto, correta }
// - "ordenar_blocos": desafio.blocos (embaralhados na tela) + desafio.ordemCorreta
//   com a sequência de ids que forma o programa certo
// - "dissertativa": o jogador escreve a resposta com as próprias palavras
//   num <textarea> (com um trecho de código opcional em desafio.codigo) e
//   quem corrige é a IA no backend — POST /api/progresso com respostaTexto,
//   ver responderDissertativa e backend/src/services/ia.service.js
// - "avaliar_codigo": desafio.cartas com { id, codigo, correta, explicacao } —
//   mecânica de arrastar ao estilo Tinder (ver renderAvaliarCodigo): o
//   jogador arrasta cada cartão pra direita se achar o código CERTO, ou pra
//   esquerda se achar ERRADO. Precisa acertar a classificação dos cartoes
//   na ordem em que aparecem (um errado não pula pro próximo — perde vida e
//   tenta esse mesmo cartão de novo) pra derrotar o inimigo.
const DESAFIOS = {
  1: {
    1: {
      numero: 1,
      titulo: "Print de Dados",
      enunciado: "Qual comando mostra uma mensagem no console em JavaScript?",
      dica: "É o comando que todo programador usa para conferir se o código chegou até ali.",
      inimigo: { imagem: slime, nome: "Slime" },
      fundo: fundoBatalha,
      opcoes: [
        { id: "a", texto: 'console.log("Olá, mundo!")', correta: true },
        { id: "b", texto: 'print("Olá, mundo!")', correta: false },
        { id: "c", texto: 'System.out.println("Olá, mundo!")', correta: false },
        { id: "d", texto: 'echo "Olá, mundo!"', correta: false },
      ],
    },
    2: {
      numero: 2,
      titulo: "Tipos na Atribuição",
      enunciado:
        'Qual é o valor e o tipo de "x" depois de executar este código?\n\nlet x = "5";\nx = x + 1;',
      dica: "Em JavaScript, o operador + entre uma string e um número concatena, não soma — o número é convertido para texto.",
      inimigo: { imagem: goblinJS, nome: "GoblinJS" },
      fundo: fundoBatalha2,
      opcoes: [
        { id: "a", texto: '"51" (string)', correta: true },
        { id: "b", texto: "6 (number)", correta: false },
        { id: "c", texto: "51 (number)", correta: false },
        { id: "d", texto: "NaN (number)", correta: false },
      ],
    },
    3: {
      numero: 3,
      tipo: "ordenar_blocos",
      titulo: "Soma de Números",
      enunciado:
        "O Esqueleto Contador guarda a passagem seguinte e só deixa passar quem consegue somar dois números corretamente.\n\nEscreva um programa em JavaScript que declare duas variáveis com valores numéricos, guarde a soma delas em uma terceira variável e exiba o resultado no console.\n\nOrganize os blocos de código na sequência correta para formar um programa JavaScript funcional.",
      dica: "toda variável só pode ser usada depois de declarada — a soma dos dois números precisa vir antes do console.log() que exibe o resultado.",
      // Largura igual à do guerreiro (120px, ver cena-heroi mais abaixo).
      inimigo: { imagem: esqueletoInimigo, nome: "Esqueleto Contador", largura: 120 },
      fundo: fundoBatalha,
      blocos: [
        { id: "b1", codigo: "let numeroA = 4;" },
        { id: "b2", codigo: "let numeroB = 7;" },
        { id: "b3", codigo: "let soma = numeroA + numeroB;" },
        { id: "b4", codigo: "console.log(soma);" },
      ],
      ordemCorreta: ["b1", "b2", "b3", "b4"],
    },
    4: {
      numero: 4,
      tipo: "avaliar_codigo",
      titulo: "Certo ou Errado?",
      enunciado:
        "O Elfo Mercador quer saber se você reconhece código correto de verdade.\n\nArraste cada cartão para a direita se achar que o código está CERTO, ou para a esquerda se achar que está ERRADO. Acerte os 3 cartões para derrotá-lo.",
      dica: "leia com calma — às vezes o erro está em um detalhe pequeno, como um sinal de igual sozinho ou uma chave que não fecha.",
      // Largura um pouco maior que a do guerreiro (120px, ver cena-heroi
      // logo abaixo) — o Elfo Mercador é mais alto que os outros inimigos.
      inimigo: { imagem: mercadorInimigo, nome: "Elfo Mercador", largura: 136 },
      fundo: fundoBatalha2,
      cartas: [
        {
          id: "c1",
          codigo: 'function somar(a, b) {\n  return a + b;\n}\n\nconsole.log(somar(2, 3));',
          correta: true,
          explicacao:
            "Certo! A função declara os parâmetros direito, usa return pra devolver o resultado, e o console.log() exibe 5 corretamente.",
        },
        {
          id: "c2",
          codigo: 'function saudacao(nome) {\n  console.log("Olá, " + nome);\n\nsaudacao("Ana");',
          correta: false,
          explicacao:
            "Errado! Falta a chave de fechamento } da função saudacao() — sem ela, o código tem um erro de sintaxe e nem chega a rodar.",
        },
        {
          id: "c3",
          codigo:
            'let nota = 8;\n\nif (nota >= 6) {\n  console.log("Aprovado");\n} else {\n  console.log("Reprovado");\n}',
          correta: true,
          explicacao:
            "Certo! O operador >= compara nota com 6 corretamente, e o if/else cobre os dois resultados possíveis.",
        },
      ],
    },
  },
  2: {
    // Mesmo conteúdo do desafio 1 do mundo 2 em backend/prisma/seed.js —
    // os ids dos blocos e a ordem correta precisam bater com o banco, que é
    // quem valida a resposta.
    1: {
      numero: 1,
      tipo: "ordenar_blocos",
      titulo: "Desafio JavaScript",
      enunciado:
        'Você está desenvolvendo um sistema que verifica se uma pessoa pode acessar uma área restrita.\n\nO programa deve receber a idade de uma pessoa e verificar se ela possui 18 anos ou mais. Caso tenha, deve exibir "Acesso permitido". Caso contrário, deve exibir "Acesso negado".\n\nOrganize os blocos de código na sequência correta para formar um programa JavaScript funcional.',
      dica: "o bloco if/else só executa o trecho entre chaves quando a condição é avaliada — preste atenção em qual chave abre e qual fecha cada parte.",
      inimigo: { imagem: goblinJS, nome: "Goblin Sentinela" },
      fundo: fundoBatalha2,
      blocos: [
        { id: "b1", codigo: "let idade = 20;" },
        { id: "b2", codigo: "if (idade >= 18) {" },
        { id: "b3", codigo: 'console.log("Acesso permitido");', indent: 1 },
        { id: "b4", codigo: "} else {" },
        { id: "b5", codigo: 'console.log("Acesso negado");', indent: 1 },
        { id: "b6", codigo: "}" },
      ],
      ordemCorreta: ["b1", "b2", "b3", "b4", "b5", "b6"],
    },
    // Desafio corrigido por IA. Enunciado e código iguais aos de
    // backend/prisma/desafios/desafioIA.js — os critérios de correção ficam
    // SÓ no backend (o jogador não deve ver o gabarito pelo navegador).
    2: {
      numero: 2,
      tipo: "dissertativa",
      titulo: "O Enigma da Bruxa",
      enunciado:
        "A Bruxa do Acampamento guarda o portão com um enigma e só deixa passar quem entende de verdade como o JavaScript toma decisões.\n\nLeia o código abaixo e explique, com suas palavras, qual mensagem aparece no console e por quê.",
      codigo: `let moedas = 7;

if (moedas >= 10) {
  console.log("Você pode comprar a espada!");
} else if (moedas >= 5) {
  console.log("Você pode comprar o escudo!");
} else {
  console.log("Continue juntando moedas.");
}`,
      dica: "o JavaScript testa as condições de cima para baixo e executa só o primeiro bloco cuja condição for verdadeira.",
      inimigo: { imagem: bruxaInimigo, nome: "Bruxa do Acampamento" },
      fundo: fundoBatalha2,
    },
  },
  3: {
    1: {
      numero: 1,
      tipo: "dissertativa",
      titulo: "Explique com suas palavras",
      enunciado:
        "O Goblin Sábio bloqueia o caminho e exige uma explicação antes de deixar você passar.\n\nCom suas próprias palavras, explique o que o comando console.log() faz em JavaScript e para que ele é usado.",
      dica: "pense no que aparece no console do navegador quando esse comando roda, e por que isso ajuda quem está programando.",
      // Reaproveitando a arte do GoblinJS — o portal 3 ainda não tem
      // inimigo nem cenário próprios desenhados.
      inimigo: { imagem: goblinJS, nome: "Goblin Sábio" },
      fundo: fundoBatalha2,
    },
    2: {
      numero: 2,
      tipo: "dissertativa",
      titulo: "Domine o Laço de Repetição",
      enunciado:
        "O Slime da Arena te desafia a provar que domina os laços de repetição.\n\nEscreva um bloco de código em JavaScript que use um laço de repetição (for ou while) para exibir os números de 1 a 5 no console, um por linha.",
      dica: "um laço for tem três partes separadas por ; — início, condição de continuar, e o que muda a cada volta. Coloque o console.log() dentro das chaves { } pra ele rodar em cada repetição.",
      // Reaproveitando a arte do Slime — o portal 3 ainda não tem inimigo
      // nem cenário próprios desenhados.
      inimigo: { imagem: slime, nome: "Slime da Arena" },
      fundo: fundoBatalha,
    },
  },
};

// Embaralha uma lista sem alterar a original (Fisher-Yates) — usado para
// espalhar os blocos de código na área "disponíveis" a cada tentativa.
function embaralhar(lista) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

// Mesmo limite do backend (TAMANHO_MAXIMO_RESPOSTA em ia.service.js).
const TAMANHO_MAXIMO_RESPOSTA = 2000;

// Falas do golpe, em ordem de vida restante (2 -> 1 coração).
// A intenção é dar o tom de "tomou dano" sem desanimar o jogador.
// Recebem o nome do inimigo do desafio atual pra bater com a imagem exibida.
function falasGolpe(nomeInimigo) {
  return [
    `${nomeInimigo} avança e te acerta! Sacuda a poeira e tente de novo.`,
    "Mais um golpe! Respira, olha com calma — a resposta está aí.",
  ];
}

function falaDerrota(nomeInimigo) {
  return `${nomeInimigo} te derrubou desta vez... mas todo herói cai antes de aprender o golpe. Levante e tente novamente!`;
}

function ResolverDesafio() {
  const { mundoId, dificuldade, desafioId } = useParams();
  const navigate = useNavigate();
  const guerreiro = usePersonagemAvatar();

  const desafio = DESAFIOS[mundoId]?.[desafioId] || DESAFIOS[1][1];
  const ehOrdenarBlocos = desafio.tipo === "ordenar_blocos";
  const ehDissertativa = desafio.tipo === "dissertativa";
  const ehAvaliarCodigo = desafio.tipo === "avaliar_codigo";

  const [opcaoSelecionada, setOpcaoSelecionada] = useState(null);
  // null | "erro" | "derrota" | "acertando" | "vitoria"
  const [resultado, setResultado] = useState(null);
  const [vida, setVida] = useState(VIDA_MAXIMA);

  // Estado do exercício "ordenar_blocos": ids ainda disponíveis pra usar e
  // ids já colocados na resposta, na ordem em que o jogador os organizou.
  const [blocosDisponiveis, setBlocosDisponiveis] = useState(() =>
    ehOrdenarBlocos ? embaralhar(desafio.blocos.map((b) => b.id)) : []
  );
  const [blocosResposta, setBlocosResposta] = useState([]);
  const blocosPorId = Object.fromEntries((desafio.blocos || []).map((b) => [b.id, b]));

  // Estado do exercício "dissertativa": texto que o jogador escreveu,
  // se a correção mockada por IA está rodando, e o feedback que ela
  // devolveu (mostrado tanto no acerto quanto no erro).
  const [respostaTexto, setRespostaTexto] = useState("");
  const [corrigindo, setCorrigindo] = useState(false);
  const [feedbackDissertativa, setFeedbackDissertativa] = useState("");

  // Estado do exercício "avaliar_codigo": índice do cartão atual (0 até
  // cartas.length - 1), quanto o cartão foi arrastado no eixo X (controla a
  // rotação/translação dele e a opacidade dos selos CERTO/ERRADO), se o
  // arraste está em andamento, pra qual lado o cartão acabou de ser solto
  // (dispara a animação de saída antes de revelar o resultado), e se o
  // cartão atual já foi acertado e está aguardando o jogador confirmar
  // "Próximo cartão" — só o ÚLTIMO acerto dispara vencer().
  const [indiceCartao, setIndiceCartao] = useState(0);
  const [arrasteCartaoX, setArrasteCartaoX] = useState(0);
  const [arrastandoCartao, setArrastandoCartao] = useState(false);
  const [cartaoSolto, setCartaoSolto] = useState(null); // null | "certo" | "errado"
  const [aguardandoProximoCartao, setAguardandoProximoCartao] = useState(false);
  // O que o jogador marcou (true = "certo", false = "errado") em cada
  // cartão já respondido corretamente até agora, na ordem — enviado pro
  // backend junto com a vitória do último cartão, pra ele revalidar a
  // resposta inteira em vez de confiar só na contagem (ver
  // avaliarCartoes em progresso.service.js).
  const [classificacoesCorretas, setClassificacoesCorretas] = useState([]);
  const origemArrasteCartaoRef = useRef(0);

  // Resposta de POST /api/progresso (xpGanho, itemGanho, ...), levada pra
  // tela de recompensa. Fica null se a chamada ainda não voltou ou falhou —
  // RecompensaDesafio cai de volta pro conteúdo hardcoded nesse caso.
  const [recompensaApi, setRecompensaApi] = useState(null);

  // Popup de confirmação do botão "Voltar" — sair no meio de uma tentativa
  // descarta a vida/blocos/resposta em andamento (nada disso é persistido),
  // então avisamos antes de navegar pra fora da tela.
  const [mostrarConfirmarSair, setMostrarConfirmarSair] = useState(false);

  // flags de animação da cena
  const [tomandoGolpe, setTomandoGolpe] = useState(false); // herói leva dano
  const [golpeHeroi, setGolpeHeroi] = useState(false); // herói ataca (GIF tocando)
  const [slimeMorrendo, setSlimeMorrendo] = useState(false); // slime dissolve
  const [focoSlime, setFocoSlime] = useState(false); // "câmera" foca no slime

  // Incrementa a cada ataque pra forçar o <img> do GIF a remontar e
  // reiniciar do primeiro quadro (senão, num segundo ataque, o GIF
  // simplesmente não tocaria de novo — ficaria parado no último frame).
  const [cicloAtaque, setCicloAtaque] = useState(0);

  const atacando = resultado === "acertando";
  const venceu = resultado === "vitoria";
  const perdeu = resultado === "derrota";
  const travado = atacando || venceu || perdeu || tomandoGolpe || corrigindo;

  // Cronômetro do desafio: conta enquanto o jogador está de fato pensando
  // ou tentando de novo depois de um erro, e pausa durante animações/espera
  // (acerto, vitória, derrota, correção da IA) — esse tempo pausado não deve
  // contar contra a pontuação. Usado pro bônus de velocidade no backend (ver
  // registrarVitoria) e mostrado ao vivo na cena (ver HUD abaixo).
  const cronometroAtivo = resultado === null || resultado === "erro";
  const [segundosDecorridos, reiniciarCronometro] = useCronometro(cronometroAtivo);

  function selecionarOpcao(id) {
    if (travado) return;
    setOpcaoSelecionada(id);
    if (resultado === "erro") setResultado(null);
  }

  function sofrerGolpe(vidaRestante) {
    tocarSom("erro");
    setTomandoGolpe(true);
    setVida(vidaRestante);
    setResultado(vidaRestante <= 0 ? "derrota" : "erro");
    setTimeout(() => setTomandoGolpe(false), 600);
  }

  // Registra a vitória no backend (XP + item de recompensa, se o desafio
  // tiver um) assim que a resposta certa é confirmada. Roda em paralelo com
  // a animação de vencer() — se falhar (ex: offline), o jogo continua e a
  // tela de recompensa usa o conteúdo hardcoded como reserva.
  async function registrarVitoria(respostaExtra) {
    try {
      const resposta = await api.post("/progresso", {
        mundoId: Number(mundoId),
        dificuldade,
        numero: Number(desafioId),
        tempoSegundos: segundosDecorridos,
        ...respostaExtra,
      });
      setRecompensaApi(resposta.data);
    } catch (erro) {
      console.error("Não foi possível registrar o progresso no servidor:", erro);
    }
  }

  function vencer() {
    tocarSom("acerto");

    // 1) herói avança e desfere o golpe — troca a imagem parada pelo GIF
    setResultado("acertando");
    setCicloAtaque((ciclo) => ciclo + 1);
    setGolpeHeroi(true);

    // 2) golpe conecta -> slime começa a morrer e a câmera foca nele
    setTimeout(() => {
      setSlimeMorrendo(true);
      setFocoSlime(true);
    }, 450);

    // 3) GIF de ataque termina -> volta o herói pra imagem parada
    setTimeout(() => setGolpeHeroi(false), DURACAO_GIF_ATAQUE_MS);

    // 4) slime desfeito -> painel de vitória (prepara XP/recompensa)
    setTimeout(() => setResultado("vitoria"), 1700);
  }

  // Vitória confirmada -> tela de recompensa (insígnia/item), que depois
  // volta para a lista de desafios da trilha. Compartilhada pelos dois
  // tipos de exercício — é o onClick do botão "VER RECOMPENSA".
  function irParaRecompensa() {
    navigate(`/recompensa/${mundoId}/${dificuldade}/${desafioId}`, {
      state: { resultado: recompensaApi },
    });
  }

  function abrirConfirmarSair() {
    setMostrarConfirmarSair(true);
  }

  function fecharConfirmarSair() {
    setMostrarConfirmarSair(false);
  }

  function confirmarSairDesafio() {
    navigate("/home");
  }

  function responderMultiplaEscolha() {
    if (!opcaoSelecionada || travado) return;

    const escolhida = desafio.opcoes.find((o) => o.id === opcaoSelecionada);
    if (escolhida.correta) {
      registrarVitoria({ opcaoId: escolhida.id });
      vencer();
    } else {
      sofrerGolpe(vida - 1);
    }
  }

  // Compara a sequência montada pelo jogador com o gabarito do desafio.
  // Em erro, os blocos continuam onde estavam — o jogador só reorganiza e
  // tenta de novo, sem perder o que já tinha montado certo.
  function verificarBlocos() {
    if (travado || blocosResposta.length !== desafio.blocos.length) return;

    const correta = desafio.ordemCorreta.every((id, i) => blocosResposta[i] === id);
    if (correta) {
      registrarVitoria({ ordem: blocosResposta });
      vencer();
    } else {
      sofrerGolpe(vida - 1);
    }
  }

  function alterarRespostaTexto(texto) {
    if (travado) return;
    setRespostaTexto(texto);
    if (resultado === "erro") setResultado(null);
  }

  // Envia a resposta dissertativa pra correção. Enquanto "corrigindo" está
  // true, a tela mostra o painel de "avaliando" (ver renderPainel) — feito
  // assim, e não com um resultado "acertando" comum, porque o veredito só
  // chega depois da resposta da correção, diferente dos outros dois tipos
  // de desafio, que sabem na hora se acertaram.
  //
  // A correção é feita pela IA no backend, na mesma chamada que grava o
  // progresso (POST /api/progresso com respostaTexto) — por isso aqui não
  // passa por registrarVitoria: o acerto já volta registrado, com o XP e a
  // recompensa. Se a IA falhar (servidor fora, chave não configurada...),
  // o jogador vê o aviso e tenta de novo SEM perder vida: a falha não foi dele.
  async function responderDissertativa() {
    if (travado || !respostaTexto.trim()) return;

    setCorrigindo(true);
    let dados;
    try {
      const resposta = await api.post("/progresso", {
        mundoId: Number(mundoId),
        dificuldade,
        numero: Number(desafioId),
        tempoSegundos: segundosDecorridos,
        respostaTexto,
      });
      dados = resposta.data;
    } catch (erro) {
      setCorrigindo(false);
      setFeedbackDissertativa(
        `⚠️ ${erro.response?.data?.erro || "Não foi possível falar com o mago agora. Verifique sua conexão e tente de novo."}`
      );
      setResultado("erro");
      return;
    }
    setCorrigindo(false);
    setFeedbackDissertativa(dados.feedbackIA || "");

    if (dados.correta) {
      setRecompensaApi(dados);
      vencer();
    } else {
      sofrerGolpe(vida - 1);
    }
  }

  function iniciarArrasteCartao(e) {
    if (travado || cartaoSolto) return;
    setArrastandoCartao(true);
    origemArrasteCartaoRef.current = e.clientX;
    e.currentTarget.setPointerCapture(e.pointerId);
    // Limpa o aviso de erro da tentativa anterior nesse cartão assim que o
    // jogador começa a arrastar de novo — mesmo padrão de selecionarOpcao/
    // alterarRespostaTexto pros outros tipos de exercício.
    if (resultado === "erro") setResultado(null);
  }

  function moverArrasteCartao(e) {
    if (!arrastandoCartao) return;
    setArrasteCartaoX(e.clientX - origemArrasteCartaoRef.current);
  }

  // Solta o cartão: acima do limiar em qualquer direção conta como resposta
  // (direita = "certo", esquerda = "errado"); abaixo disso, volta pro
  // centro sem responder nada.
  const LIMIAR_ARRASTE_CARTAO = 90;

  function soltarArrasteCartao() {
    if (!arrastandoCartao) return;
    setArrastandoCartao(false);

    if (arrasteCartaoX > LIMIAR_ARRASTE_CARTAO) {
      responderCartao(true);
    } else if (arrasteCartaoX < -LIMIAR_ARRASTE_CARTAO) {
      responderCartao(false);
    } else {
      setArrasteCartaoX(0);
    }
  }

  // Quanto tempo o cartão leva pra sair voando da tela (ver deslocamentoX
  // em renderAvaliarCodigo) antes de revelar o resultado — dá tempo do
  // jogador ver pra qual lado ele decidiu a resposta.
  const DURACAO_SAIDA_CARTAO_MS = 260;

  function responderCartao(marcouCerto) {
    const carta = desafio.cartas[indiceCartao];
    setCartaoSolto(marcouCerto ? "certo" : "errado");

    setTimeout(() => {
      const classificacaoCorreta = marcouCerto === carta.correta;
      if (classificacaoCorreta) {
        const novasClassificacoes = [...classificacoesCorretas, marcouCerto];
        const ultimoCartao = indiceCartao === desafio.cartas.length - 1;
        if (ultimoCartao) {
          registrarVitoria({ classificacoes: novasClassificacoes });
          vencer();
        } else {
          tocarSom("acerto");
          setClassificacoesCorretas(novasClassificacoes);
          setAguardandoProximoCartao(true);
        }
      } else {
        sofrerGolpe(vida - 1);
      }
      setCartaoSolto(null);
      setArrasteCartaoX(0);
    }, DURACAO_SAIDA_CARTAO_MS);
  }

  function avancarCartao() {
    setAguardandoProximoCartao(false);
    setIndiceCartao((i) => i + 1);
  }

  function moverParaResposta(id) {
    if (travado) return;
    setBlocosDisponiveis((atual) => atual.filter((x) => x !== id));
    setBlocosResposta((atual) => [...atual, id]);
    if (resultado === "erro") setResultado(null);
  }

  function removerDaResposta(id) {
    if (travado) return;
    setBlocosResposta((atual) => atual.filter((x) => x !== id));
    setBlocosDisponiveis((atual) => [...atual, id]);
  }

  function moverBloco(indice, delta) {
    if (travado) return;
    setBlocosResposta((atual) => {
      const alvo = indice + delta;
      if (alvo < 0 || alvo >= atual.length) return atual;
      const novo = [...atual];
      [novo[indice], novo[alvo]] = [novo[alvo], novo[indice]];
      return novo;
    });
  }

  // Drag and drop nativo (HTML5) — reordena/realoca ao soltar. Cada bloco
  // também pode ser movido por toque/clique (moverParaResposta,
  // removerDaResposta, moverBloco), então o recurso funciona sem mouse.
  function iniciarArraste(e, id, origem) {
    e.dataTransfer.setData("text/plain", JSON.stringify({ id, origem }));
    e.dataTransfer.effectAllowed = "move";
  }

  function permitirSolto(e) {
    e.preventDefault();
  }

  function soltarNaResposta(e, indiceAlvo) {
    e.preventDefault();
    e.stopPropagation();
    if (travado) return;

    const dados = e.dataTransfer.getData("text/plain");
    if (!dados) return;
    const { id } = JSON.parse(dados);

    setBlocosDisponiveis((atual) => atual.filter((x) => x !== id));
    setBlocosResposta((atual) => {
      const semId = atual.filter((x) => x !== id);
      const alvo = Math.min(indiceAlvo, semId.length);
      return [...semId.slice(0, alvo), id, ...semId.slice(alvo)];
    });
    if (resultado === "erro") setResultado(null);
  }

  function soltarNoPool(e) {
    e.preventDefault();
    if (travado) return;

    const dados = e.dataTransfer.getData("text/plain");
    if (!dados) return;
    const { id } = JSON.parse(dados);

    setBlocosResposta((atual) => atual.filter((x) => x !== id));
    setBlocosDisponiveis((atual) => (atual.includes(id) ? atual : [...atual, id]));
  }

  function tentarNovamente() {
    setVida(VIDA_MAXIMA);
    setResultado(null);
    setOpcaoSelecionada(null);
    setTomandoGolpe(false);
    setRecompensaApi(null);
    reiniciarCronometro();
    // reset das flags de animação da batalha anterior, senão uma nova
    // tentativa pode começar com o slime já "morto" ou a câmera focada nele
    setGolpeHeroi(false);
    setSlimeMorrendo(false);
    setFocoSlime(false);
    if (ehOrdenarBlocos) {
      setBlocosDisponiveis(embaralhar(desafio.blocos.map((b) => b.id)));
      setBlocosResposta([]);
    }
    if (ehDissertativa) {
      setRespostaTexto("");
      setCorrigindo(false);
      setFeedbackDissertativa("");
    }
    if (ehAvaliarCodigo) {
      setIndiceCartao(0);
      setArrasteCartaoX(0);
      setArrastandoCartao(false);
      setCartaoSolto(null);
      setAguardandoProximoCartao(false);
      setClassificacoesCorretas([]);
    }
  }

  // "" | "selecionada" | "errada" — usado tanto na moldura (opcao--X)
  // quanto no miolo (opcao-miolo--X) do BotaoPixel dessa alternativa.
  function estadoDaOpcao(opcao) {
    if (opcaoSelecionada !== opcao.id) return "";
    if (resultado === "erro" || resultado === "derrota") return "errada";
    return "selecionada";
  }

  const golpesInimigo = falasGolpe(desafio.inimigo.nome);
  const falaGolpe = golpesInimigo[VIDA_MAXIMA - 1 - vida] || golpesInimigo.at(-1);
  const mostrarDica = vida <= 1;

  function renderPainel() {
    if (perdeu) {
      return (
        <div className="derrota">
          <h2 className="derrota-titulo">Você caiu!</h2>
          <p className="derrota-fala">{falaDerrota(desafio.inimigo.nome)}</p>
          <BotaoPixel
            className="botao-avante botao-avante--roxo"
            classeMiolo="botao-avante-miolo botao-avante-miolo--roxo"
            onClick={tentarNovamente}
          >
            TENTAR NOVAMENTE
          </BotaoPixel>
        </div>
      );
    }

    if (venceu) {
      return (
        <div className="vitoria">
          <h2 className="vitoria-titulo">{desafio.inimigo.nome} derrotado!</h2>
          <p className="vitoria-fala">
            Golpe certeiro! O caminho à frente está livre.
          </p>

          {/* Só aparece quando o backend realmente concedeu XP agora (não
              conta em replays de um desafio já concluído antes) — ver
              xpConcedidoAgora em progresso.service.js. */}
          {recompensaApi?.xpConcedidoAgora > 0 && (
            <div className="vitoria-recompensa">
              <span className="vitoria-recompensa-rotulo">XP ganho</span>
              <span className="vitoria-recompensa-valor">
                +{recompensaApi.xpConcedidoAgora} XP • Tempo: {formatarTempo(recompensaApi.tempoSegundos ?? segundosDecorridos)}
                {recompensaApi.acertouDePrimeira ? " • Acertou de primeira!" : ""}
              </span>
            </div>
          )}

          <BotaoPixel
            className="botao-avante"
            classeMiolo="botao-avante-miolo"
            onClick={irParaRecompensa}
          >
            VER RECOMPENSA
          </BotaoPixel>
        </div>
      );
    }

    if (atacando) {
      return (
        <div className="acerto-banner">
          <h2 className="acerto-titulo">Acertou!</h2>
          <p className="acerto-fala">
            {ehOrdenarBlocos
              ? "Muito bem! Você organizou o código corretamente."
              : ehDissertativa
                ? feedbackDissertativa
                : `Golpe certeiro no ${desafio.inimigo.nome}!`}
          </p>
        </div>
      );
    }

    if (corrigindo) {
      return (
        <div className="corrigindo-banner">
          <h2 className="corrigindo-titulo">Avaliando</h2>
          <p className="corrigindo-fala">
            O mago está avaliando sua resposta
            <span className="corrigindo-pontos">...</span>
          </p>
        </div>
      );
    }

    // estado padrão: respondendo
    return (
      <>
        <h2 className="painel-titulo">
          {ehOrdenarBlocos
            ? "Monte o código:"
            : ehDissertativa
              ? "Escreva sua resposta:"
              : ehAvaliarCodigo
                ? "Avalie o código:"
                : "Escolha a resposta:"}
        </h2>
        <p className="painel-enunciado">{desafio.enunciado}</p>
        {ehDissertativa && desafio.codigo && (
          <pre className="dissertativa-codigo">
            <code>{desafio.codigo}</code>
          </pre>
        )}

        {ehOrdenarBlocos
          ? renderMontagemBlocos()
          : ehDissertativa
            ? renderRespostaDissertativa()
            : ehAvaliarCodigo
              ? renderAvaliarCodigo()
              : renderOpcoes()}

        {resultado === "erro" && (
          <div className="retorno retorno--erro">
            <p className="retorno-fala">
              {ehDissertativa
                ? feedbackDissertativa
                : ehAvaliarCodigo
                  ? desafio.cartas[indiceCartao].explicacao
                  : falaGolpe}
            </p>
            {mostrarDica && <p className="retorno-dica">Dica: {desafio.dica}</p>}
          </div>
        )}

        {/* No "avaliar_codigo" a resposta é o próprio arraste do cartão —
            só existe botão aqui quando estamos aguardando o jogador seguir
            pro próximo cartão depois de um acerto (ver aguardandoProximoCartao). */}
        {!(ehAvaliarCodigo && !aguardandoProximoCartao) && (
          <BotaoPixel
            className="botao-avante"
            classeMiolo="botao-avante-miolo"
            onClick={
              ehOrdenarBlocos
                ? verificarBlocos
                : ehDissertativa
                  ? responderDissertativa
                  : ehAvaliarCodigo
                    ? avancarCartao
                    : responderMultiplaEscolha
            }
            disabled={
              ehOrdenarBlocos
                ? blocosResposta.length !== desafio.blocos.length || travado
                : ehDissertativa
                  ? !respostaTexto.trim() || travado
                  : ehAvaliarCodigo
                    ? false
                    : !opcaoSelecionada || travado
            }
          >
            {ehOrdenarBlocos
              ? "VERIFICAR"
              : ehDissertativa
                ? "ATACAR"
                : ehAvaliarCodigo
                  ? "PRÓXIMO CARTÃO"
                  : "AVANTE!"}
          </BotaoPixel>
        )}
      </>
    );
  }

  function renderOpcoes() {
    return (
      <div className="lista-opcoes">
        {desafio.opcoes.map((opcao) => {
          const estado = estadoDaOpcao(opcao);
          return (
            <BotaoPixel
              key={opcao.id}
              className={`opcao ${estado && `opcao--${estado}`}`}
              classeMiolo={`opcao-miolo ${estado && `opcao-miolo--${estado}`}`}
              onClick={() => selecionarOpcao(opcao.id)}
              disabled={travado}
            >
              <span className="opcao-letra">{opcao.id.toUpperCase()}</span>
              <code className="opcao-codigo">{opcao.texto}</code>
            </BotaoPixel>
          );
        })}
      </div>
    );
  }

  function renderRespostaDissertativa() {
    return (
      <div className="dissertativa-area">
        <textarea
          className="dissertativa-textarea"
          placeholder="Escreva sua resposta com suas próprias palavras..."
          value={respostaTexto}
          onChange={(e) => alterarRespostaTexto(e.target.value)}
          disabled={travado}
          rows={5}
          maxLength={TAMANHO_MAXIMO_RESPOSTA}
        />
      </div>
    );
  }

  // Mecânica de arrastar ao estilo Tinder: um cartão com um bloco de
  // código por vez, que o jogador arrasta pra direita ("certo") ou pra
  // esquerda ("errado"). Os selos ✕/✓ atrás do cartão vão ficando visíveis
  // conforme o arraste se aproxima do limiar de cada lado (ver
  // LIMIAR_ARRASTE_CARTAO), pra dar a mesma sensação de "prévia da decisão"
  // de apps de arrastar.
  function renderAvaliarCodigo() {
    const carta = desafio.cartas[indiceCartao];

    if (aguardandoProximoCartao) {
      return (
        <div className="acerto-banner">
          <h2 className="acerto-titulo">Certo!</h2>
          <p className="acerto-fala">{carta.explicacao}</p>
        </div>
      );
    }

    const deslocamentoX =
      cartaoSolto === "certo" ? 480 : cartaoSolto === "errado" ? -480 : arrasteCartaoX;
    const opacidadeErrado = deslocamentoX < 0 ? Math.min(-deslocamentoX / LIMIAR_ARRASTE_CARTAO, 1) : 0;
    const opacidadeCerto = deslocamentoX > 0 ? Math.min(deslocamentoX / LIMIAR_ARRASTE_CARTAO, 1) : 0;

    return (
      <div className="avaliar-area">
        <span className="avaliar-progresso">
          Cartão {indiceCartao + 1} de {desafio.cartas.length}
        </span>

        <div className="avaliar-carta-wrapper">
          <span className="avaliar-selo avaliar-selo--errado" style={{ opacity: opacidadeErrado }}>
            <X size={22} strokeWidth={3} />
          </span>
          <span className="avaliar-selo avaliar-selo--certo" style={{ opacity: opacidadeCerto }}>
            <Check size={22} strokeWidth={3} />
          </span>

          <div
            className={`avaliar-carta ${cartaoSolto ? `avaliar-carta--${cartaoSolto}` : ""} ${
              arrastandoCartao ? "avaliar-carta--arrastando" : ""
            }`}
            style={{ transform: `translateX(${deslocamentoX}px) rotate(${deslocamentoX / 18}deg)` }}
            onPointerDown={iniciarArrasteCartao}
            onPointerMove={moverArrasteCartao}
            onPointerUp={soltarArrasteCartao}
            onPointerCancel={soltarArrasteCartao}
          >
            <code className="avaliar-carta-codigo">{carta.codigo}</code>
          </div>
        </div>

        <p className="avaliar-instrucao">
          Arraste para a direita se estiver <strong>certo</strong>, ou para a esquerda se estiver{" "}
          <strong>errado</strong>
        </p>
      </div>
    );
  }

  function renderMontagemBlocos() {
    return (
      <div className="blocos-area">
        <div className="blocos-secao">
          <span className="blocos-rotulo">Blocos disponíveis</span>
          <div
            className="blocos-pool"
            onDragOver={permitirSolto}
            onDrop={soltarNoPool}
          >
            {blocosDisponiveis.length === 0 && (
              <span className="blocos-vazio">Todos os blocos já estão na resposta.</span>
            )}
            {blocosDisponiveis.map((id) => {
              const bloco = blocosPorId[id];
              return (
                <button
                  key={id}
                  type="button"
                  className="bloco-codigo"
                  draggable={!travado}
                  onDragStart={(e) => iniciarArraste(e, id, "pool")}
                  onClick={() => moverParaResposta(id)}
                  disabled={travado}
                  aria-label={`Adicionar bloco: ${bloco.codigo}`}
                >
                  <code>{bloco.codigo}</code>
                </button>
              );
            })}
          </div>
        </div>

        <div className="blocos-secao">
          <span className="blocos-rotulo">Sua resposta</span>
          <div
            className={`blocos-resposta ${
              resultado === "erro" ? "blocos-resposta--erro" : ""
            }`}
            onDragOver={permitirSolto}
            onDrop={(e) => soltarNaResposta(e, blocosResposta.length)}
          >
            {blocosResposta.length === 0 && (
              <span className="blocos-vazio">Toque nos blocos acima para montar o código.</span>
            )}
            {blocosResposta.map((id, indice) => {
              const bloco = blocosPorId[id];
              return (
                <div
                  key={id}
                  className="bloco-codigo bloco-codigo--colocado"
                  draggable={!travado}
                  onDragStart={(e) => iniciarArraste(e, id, "resposta")}
                  onDragOver={permitirSolto}
                  onDrop={(e) => soltarNaResposta(e, indice)}
                  style={{ paddingLeft: 12 + (bloco.indent || 0) * 20 }}
                >
                  <code>{bloco.codigo}</code>
                  <span className="bloco-controles">
                    <button
                      type="button"
                      aria-label="Mover bloco para cima"
                      onClick={() => moverBloco(indice, -1)}
                      disabled={indice === 0 || travado}
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      aria-label="Mover bloco para baixo"
                      onClick={() => moverBloco(indice, 1)}
                      disabled={indice === blocosResposta.length - 1 || travado}
                    >
                      ▼
                    </button>
                    <button
                      type="button"
                      aria-label="Remover bloco da resposta"
                      onClick={() => removerDaResposta(id)}
                      disabled={travado}
                    >
                      ✕
                    </button>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="desafio-tela">
      <BotaoPixel
        className="desafio-voltar"
        classeMiolo="desafio-voltar-miolo"
        onClick={abrirConfirmarSair}
      >
        ← Voltar
      </BotaoPixel>

      {mostrarConfirmarSair && (
        <ConfirmarSairDesafio
          onManterDesafio={fecharConfirmarSair}
          onSairDesafio={confirmarSairDesafio}
        />
      )}

      {/* Cena da batalha — fundo agora usa a arte Fundo_batalha.png */}
      <section
        className={`cena ${tomandoGolpe ? "cena--golpe" : ""} ${
          focoSlime ? "cena--foco" : ""
        }`}
        style={{
          backgroundImage: `url(${desafio.fundo})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          imageRendering: "pixelated",
        }}
      >
        {/* palco = tudo que sofre o zoom da "câmera" */}
        <div className={`cena-palco ${focoSlime ? "cena-palco--foco" : ""}`}>
          {/* chão marrom antigo desligado — o fundo novo já traz o piso */}
          <div className="cena-chao" style={{ background: "transparent" }} />

          <img
            // key muda a cada golpe pra forçar o navegador a reiniciar o
            // GIF do quadro zero, e volta pra uma key fixa quando parado
            key={golpeHeroi ? `heroi-ataque-${cicloAtaque}` : "heroi-parado"}
            src={golpeHeroi ? guerreiroAtaque : guerreiro}
            alt="Guerreiro"
            className={`cena-heroi ${
              tomandoGolpe ? "cena-heroi--atingido" : ""
            } ${golpeHeroi ? "cena-heroi--golpeando" : ""}`}
            style={{ width: 120, imageRendering: "pixelated" }}
            draggable={false}
          />

          <img
            src={desafio.inimigo.imagem}
            alt={desafio.inimigo.nome}
            className={`cena-inimigo ${
              tomandoGolpe ? "cena-inimigo--atacando" : ""
            } ${slimeMorrendo ? "cena-inimigo--morrendo" : ""}`}
            style={{ width: desafio.inimigo.largura || 96, imageRendering: "pixelated" }}
            draggable={false}
          />
        </div>

        {/* HUD de vida e cronômetro ficam fora do zoom */}
        <div className="cena-vida" aria-label={`Vida: ${vida} de ${VIDA_MAXIMA}`}>
          {Array.from({ length: VIDA_MAXIMA }).map((_, i) => (
            <span
              key={i}
              className={`coracao ${i < vida ? "" : "coracao--vazio"}`}
              aria-hidden="true"
            >
              {i < vida ? "❤️" : "🖤"}
            </span>
          ))}
        </div>

        <div className="cena-cronometro" aria-label={`Tempo decorrido: ${formatarTempo(segundosDecorridos)}`}>
          ⏱ {formatarTempo(segundosDecorridos)}
        </div>

        {tomandoGolpe && <div className="cena-flash" />}
      </section>

      <section className="painel">{renderPainel()}</section>
    </div>
  );
}

export default ResolverDesafio;