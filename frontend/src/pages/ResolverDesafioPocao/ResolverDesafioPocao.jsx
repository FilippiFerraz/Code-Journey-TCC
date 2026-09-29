import { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import api from "../../services/api";
import { useCronometro } from "../../hooks/useCronometro";
import { formatarTempo } from "../../utils/tempo";
import { tocarSom } from "../../utils/sons";
import BotaoPixel from "../../components/BotaoPixel";
import ConfirmarSairDesafio from "../../components/ConfirmarSairDesafio";
import caldeirao from "../../assets/images/caldeirao.png";
import "./ResolverDesafioPocao.css";

// Enquanto a rota de desafios não existe no backend, o conteúdo fica aqui —
// mesmo padrão mock já usado em ResolverDesafio.jsx. Formato pensado pra já
// ficar parecido com Desafio.alternativas quando esse tipo de desafio for
// migrado pro banco (ver progresso.service.js e o comentário sobre os
// formatos de "alternativas" em schema.prisma): um objeto com "tipo" (aqui
// seria "montar_pocao"), a lista de ingredientes CORRETOS já na ordem certa
// (equivalente ao ordemCorreta do tipo "ordenar_blocos", só que com o
// código de cada ingrediente junto, não só o id) e a lista de DISTRATORES —
// ingredientes errados que entram misturados no monte, mas nunca são
// aceitos pelo caldeirão.
//
const DESAFIOS_POCAO = {
  1: {
    5: {
      numero: 5,
      titulo: "Monte a Poção",
      enunciado:
        "Arraste cada ingrediente até o caldeirão, na ordem certa, para completar a poção da Bruxa Sintática. Nem todo ingrediente do monte serve — os que não fazem parte da receita são cuspidos de volta.",
      dica:
        'primeiro crie a variável vazia com aspas (""), depois vá somando cada ingrediente com +=, e só no final mostre o resultado com console.log().',
      personagem: { nome: "Bruxa Sintática" },
      caldeiraoImagem: caldeirao,
      ingredientesCorretos: [
        { id: "i1", codigo: 'let pocao = "";' },
        { id: "i2", codigo: 'pocao += "3 pitadas de erva-lua, ";' },
        { id: "i3", codigo: 'pocao += "1 lágrima de fênix, ";' },
        { id: "i4", codigo: 'pocao += "2 escamas de dragão.";' },
        { id: "i5", codigo: "console.log(pocao);" },
      ],
      distratores: [
        { id: "d1", codigo: "let pocao = 0;" },
        { id: "d2", codigo: 'pocao.add("pó de unicórnio");' },
        { id: "d3", codigo: "console.log(receita);" },
      ],
    },
  },
};

// Embaralha uma lista sem alterar a original (Fisher-Yates) — mesma função
// usada em ResolverDesafio.jsx, repetida aqui porque cada tela mock carrega
// seu próprio conteúdo hardcoded.
function embaralhar(lista) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

function ResolverDesafioPocao() {
  const { mundoId, dificuldade, desafioId } = useParams();
  const navigate = useNavigate();

  const desafio = DESAFIOS_POCAO[mundoId]?.[desafioId] || DESAFIOS_POCAO[1][5];
  const totalIngredientesCorretos = desafio.ingredientesCorretos.length;

  // Monte de ingredientes ainda disponíveis (corretos + distratores,
  // embaralhados) — um ingrediente aceito pelo caldeirão sai daqui de vez;
  // um rejeitado continua disponível pra tentar de novo, em outra ordem.
  const [ingredientesDisponiveis, setIngredientesDisponiveis] = useState(() =>
    embaralhar([...desafio.ingredientesCorretos, ...desafio.distratores])
  );

  // Quantos ingredientes certos já entraram no caldeirão, NA ORDEM certa —
  // é o índice do próximo ingrediente esperado em desafio.ingredientesCorretos.
  const [progresso, setProgresso] = useState(0);

  // Estado do arraste (Pointer Events nativos — funciona igual em mouse e
  // toque): id do ingrediente sendo arrastado, posição atual do ponteiro
  // (usada pra desenhar o "fantasma" flutuante e pra checar se soltou em
  // cima do caldeirão), e qual ingrediente acabou de ser rejeitado (dispara
  // a animação de "cuspir fora" por um instante).
  const [idArrastando, setIdArrastando] = useState(null);
  const [posicaoArraste, setPosicaoArraste] = useState({ x: 0, y: 0 });
  const [idRejeitado, setIdRejeitado] = useState(null);

  const [sucesso, setSucesso] = useState(false);
  // Resposta de POST /api/progresso, levada pra tela de recompensa — mesmo
  // padrão de ResolverDesafio.jsx. Hoje o backend ainda não conhece o tipo
  // "montar_pocao" (ver TODO no topo do arquivo), então essa chamada tende
  // a falhar por enquanto — o catch já trata isso sem travar o jogo.
  const [recompensaApi, setRecompensaApi] = useState(null);

  // Popup de confirmação do botão "Voltar" — mesmo padrão de
  // ResolverDesafio.jsx e DesafioChefe.jsx.
  const [mostrarConfirmarSair, setMostrarConfirmarSair] = useState(false);

  const caldeiraoRef = useRef(null);
  const telaRef = useRef(null);
  const timeoutRejeicaoRef = useRef(null);

  const cronometroAtivo = !sucesso;
  const [segundosDecorridos] = useCronometro(cronometroAtivo);

  const ingredienteArrastando = ingredientesDisponiveis.find((i) => i.id === idArrastando);

  async function registrarVitoria() {
    try {
      const resposta = await api.post("/progresso", {
        mundoId: Number(mundoId),
        dificuldade,
        numero: Number(desafioId),
        tempoSegundos: segundosDecorridos,
        ingredientes: desafio.ingredientesCorretos.map((i) => i.id),
      });
      setRecompensaApi(resposta.data);
    } catch (erro) {
      console.error("Não foi possível registrar o progresso no servidor:", erro);
    }
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

  function iniciarArrasteIngrediente(e, id) {
    if (sucesso) return;
    setIdArrastando(id);
    setPosicaoArraste({ x: e.clientX, y: e.clientY });
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function moverArrasteIngrediente(e) {
    if (!idArrastando) return;
    setPosicaoArraste({ x: e.clientX, y: e.clientY });
  }

  function soltarArrasteIngrediente() {
    if (!idArrastando) return;
    const idSolto = idArrastando;
    const posicaoSolta = posicaoArraste;
    setIdArrastando(null);

    const zona = caldeiraoRef.current?.getBoundingClientRect();
    const soltouNoCaldeirao =
      zona &&
      posicaoSolta.x >= zona.left &&
      posicaoSolta.x <= zona.right &&
      posicaoSolta.y >= zona.top &&
      posicaoSolta.y <= zona.bottom;

    // Soltou fora do caldeirão -> o ingrediente só volta pro monte, sem
    // contar como tentativa certa nem errada.
    if (soltouNoCaldeirao) {
      processarIngrediente(idSolto);
    }
  }

  // Confere se o ingrediente solto é exatamente o próximo da receita, na
  // ordem certa — um ingrediente correto fora de ordem é rejeitado igual a
  // um distrator, porque a ordem faz parte da resposta certa.
  function processarIngrediente(id) {
    const proximoCorreto = desafio.ingredientesCorretos[progresso];

    if (proximoCorreto && id === proximoCorreto.id) {
      tocarSom("acerto");
      setIngredientesDisponiveis((atual) => atual.filter((i) => i.id !== id));
      const novoProgresso = progresso + 1;
      setProgresso(novoProgresso);

      if (novoProgresso === totalIngredientesCorretos) {
        registrarVitoria();
        setSucesso(true);
      }
    } else {
      tocarSom("erro");
      setIdRejeitado(id);
      clearTimeout(timeoutRejeicaoRef.current);
      timeoutRejeicaoRef.current = setTimeout(() => setIdRejeitado(null), 500);
    }
  }

  function irParaRecompensa() {
    navigate(`/recompensa/${mundoId}/${dificuldade}/${desafioId}`, {
      state: { resultado: recompensaApi },
    });
  }

  // O fantasma que segue o ponteiro usa position:absolute relativo a esta
  // tela (não position:fixed com as coordenadas cruas do ponteiro) porque
  // .app-frame tem um transform que a torna o "containing block" de
  // qualquer elemento fixed dela pra baixo (ver comentário em App.css) —
  // em telas largas de desktop, a moldura fica centralizada com margens
  // laterais, então clientX/clientY brutos ficavam bem deslocados do
  // caldeirão de verdade. Convertendo pra coordenadas relativas à própria
  // tela do desafio, a posição fica correta em qualquer largura de tela.
  const retanguloTela = telaRef.current?.getBoundingClientRect();
  const posicaoFantasma = retanguloTela
    ? { x: posicaoArraste.x - retanguloTela.left, y: posicaoArraste.y - retanguloTela.top }
    : posicaoArraste;

  return (
    <div className="pocao-tela" ref={telaRef}>
      <BotaoPixel
        className="pocao-voltar"
        classeMiolo="pocao-voltar-miolo"
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

      {!sucesso && (
        <div
          className="pocao-cronometro"
          aria-label={`Tempo decorrido: ${formatarTempo(segundosDecorridos)}`}
        >
          ⏱ {formatarTempo(segundosDecorridos)}
        </div>
      )}

      {sucesso ? (
        <div className="pocao-sucesso">
          <motion.div
            className="pocao-sucesso-caldeirao"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 12 }}
          >
            <img
              src={desafio.caldeiraoImagem}
              alt=""
              className="pocao-sucesso-caldeirao-img"
              draggable={false}
            />
            <motion.span
              className="pocao-sucesso-brilho"
              aria-hidden="true"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: [0, 1, 0], scale: [0.5, 1.8, 2.4] }}
              transition={{ duration: 1.1, ease: "easeOut" }}
            >
              ✨
            </motion.span>
          </motion.div>

          <motion.h2
            className="pocao-sucesso-titulo"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Poção pronta!
          </motion.h2>

          <motion.p
            className="pocao-sucesso-fala"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
          >
            {desafio.personagem.nome} sorri — você montou a receita certinha, na ordem certa.
          </motion.p>

          {/* Só aparece quando o backend realmente concedeu XP agora — hoje
              só acontece quando esse desafio já tiver um Desafio cadastrado
              no banco (ver TODO no topo do arquivo). */}
          {recompensaApi?.xpConcedidoAgora > 0 && (
            <div className="pocao-sucesso-recompensa">
              <span className="pocao-sucesso-recompensa-rotulo">XP ganho</span>
              <span className="pocao-sucesso-recompensa-valor">
                +{recompensaApi.xpConcedidoAgora} XP • Tempo:{" "}
                {formatarTempo(recompensaApi.tempoSegundos ?? segundosDecorridos)}
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
      ) : (
        <>
          <div className="pocao-cabecalho">
            <h2 className="pocao-titulo">{desafio.titulo}</h2>
            <p className="pocao-enunciado">{desafio.enunciado}</p>
            <span className="pocao-progresso">
              Ingredientes: {progresso} de {totalIngredientesCorretos}
            </span>
          </div>

          <div className="pocao-caldeirao-area">
            <div ref={caldeiraoRef} className="pocao-caldeirao">
              <motion.img
                src={desafio.caldeiraoImagem}
                alt="Caldeirão"
                className="pocao-caldeirao-imagem"
                draggable={false}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              />

              {/* Efeito de "borbulhar" — dispara de novo a cada acerto
                  (key={progresso} força o Framer Motion a montar um novo
                  elemento e animar do zero) */}
              <AnimatePresence>
                {progresso > 0 && (
                  <motion.span
                    key={progresso}
                    className="pocao-caldeirao-burst"
                    aria-hidden="true"
                    initial={{ opacity: 0.9, scale: 0.6 }}
                    animate={{ opacity: 0, scale: 2.2 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  >
                    ✨
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            <p className="pocao-caldeirao-dica">arraste um ingrediente até aqui</p>
          </div>

          <div className="pocao-ingredientes-pool">
            <AnimatePresence>
              {ingredientesDisponiveis.map((ingrediente) => (
                <motion.button
                  key={ingrediente.id}
                  type="button"
                  className={`pocao-ingrediente ${
                    idArrastando === ingrediente.id ? "pocao-ingrediente--fantasma" : ""
                  }`}
                  onPointerDown={(e) => iniciarArrasteIngrediente(e, ingrediente.id)}
                  onPointerMove={moverArrasteIngrediente}
                  onPointerUp={soltarArrasteIngrediente}
                  onPointerCancel={soltarArrasteIngrediente}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={
                    idRejeitado === ingrediente.id
                      ? { x: [0, -10, 10, -8, 8, 0], opacity: 1, scale: 1 }
                      : { opacity: 1, scale: 1, x: 0 }
                  }
                  exit={{ opacity: 0, scale: 0.4, y: -60 }}
                  transition={{ duration: idRejeitado === ingrediente.id ? 0.45 : 0.25 }}
                >
                  <code>{ingrediente.codigo}</code>
                </motion.button>
              ))}
            </AnimatePresence>

            {ingredientesDisponiveis.length === 0 && (
              <span className="pocao-ingredientes-vazio">
                Todos os ingredientes já foram usados.
              </span>
            )}
          </div>

          {/* "Fantasma" flutuante que segue o ponteiro durante o arraste —
              o ingrediente original fica com opacidade 0 (ver
              .pocao-ingrediente--fantasma) mas continua no lugar, então o
              monte não pula de layout quando o arraste começa. */}
          {idArrastando && ingredienteArrastando && (
            <motion.div
              className="pocao-ingrediente pocao-ingrediente--arrastando"
              style={{ left: posicaoFantasma.x, top: posicaoFantasma.y }}
              initial={{ scale: 0.95 }}
              animate={{ scale: 1.08 }}
            >
              <code>{ingredienteArrastando.codigo}</code>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}

export default ResolverDesafioPocao;
