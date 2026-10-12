import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { tocarSom } from "../../../utils/sons";
import caldeirao from "../../../assets/images/caldeirao.png";
import "../../ResolverDesafioPocao/ResolverDesafioPocao.css";

// Montar poção — mesmo visual e mecânica de ResolverDesafioPocao.jsx:
// arrastar ingredientes (Pointer Events, mouse e toque) até o caldeirão, na
// ordem certa. Cada ingrediente é conferido no servidor na hora (verificar):
// o certo entra e borbulha; o errado (distrator ou fora de ordem) é
// "cuspido" de volta — como no portal 1, sem tirar vida. Com todos dentro,
// a etapa vai pra POST /api/progresso ({ ingredientes }).
export default function MontarPocao({ etapa, travado, verificar, responder }) {
  const [disponiveis, setDisponiveis] = useState(etapa.ingredientes);
  const [aceitos, setAceitos] = useState([]);
  const [idArrastando, setIdArrastando] = useState(null);
  const [posicao, setPosicao] = useState({ x: 0, y: 0 });
  const [idRejeitado, setIdRejeitado] = useState(null);
  const [conferindo, setConferindo] = useState(false);

  // O fantasma do arraste é absolute relativo a este container (e não
  // position:fixed com as coordenadas cruas do ponteiro) — o .app-frame
  // cria um containing block próprio em telas largas, ver
  // ResolverDesafioPocao.jsx.
  const areaRef = useRef(null);
  const caldeiraoRef = useRef(null);
  const timeoutRejeicaoRef = useRef(null);

  const total = etapa.quantidadeIngredientes;
  const bloqueado = travado || conferindo;
  const arrastando = disponiveis.find((i) => i.id === idArrastando);

  function iniciarArraste(e, id) {
    if (bloqueado) return;
    setIdArrastando(id);
    setPosicao({ x: e.clientX, y: e.clientY });
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function moverArraste(e) {
    if (!idArrastando) return;
    setPosicao({ x: e.clientX, y: e.clientY });
  }

  function soltarArraste() {
    if (!idArrastando) return;
    const id = idArrastando;
    setIdArrastando(null);
    const zona = caldeiraoRef.current?.getBoundingClientRect();
    const soltouNoCaldeirao =
      zona && posicao.x >= zona.left && posicao.x <= zona.right && posicao.y >= zona.top && posicao.y <= zona.bottom;
    if (soltouNoCaldeirao) processar(id);
  }

  async function processar(id) {
    setConferindo(true);
    const correto = await verificar({ posicao: aceitos.length, ingredienteId: id });
    setConferindo(false);
    if (correto === null) return; // falha de conexão: aviso já mostrado

    if (correto) {
      tocarSom("acerto");
      const novos = [...aceitos, id];
      setAceitos(novos);
      setDisponiveis((atual) => atual.filter((i) => i.id !== id));
      if (novos.length === total) responder({ ingredientes: novos });
    } else {
      tocarSom("erro");
      setIdRejeitado(id);
      clearTimeout(timeoutRejeicaoRef.current);
      timeoutRejeicaoRef.current = setTimeout(() => setIdRejeitado(null), 500);
    }
  }

  const area = areaRef.current?.getBoundingClientRect();
  const fantasma = area ? { x: posicao.x - area.left, y: posicao.y - area.top } : posicao;

  return (
    <div className="etapas-pocao" ref={areaRef}>
      <span className="pocao-progresso">
        Ingredientes: {aceitos.length} de {total}
      </span>

      <div className="pocao-caldeirao-area">
        <div ref={caldeiraoRef} className="pocao-caldeirao">
          <motion.img
            src={caldeirao}
            alt="Caldeirão"
            className="pocao-caldeirao-imagem"
            draggable={false}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
          <AnimatePresence>
            {aceitos.length > 0 && (
              <motion.span
                key={aceitos.length}
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

      {aceitos.length > 0 && (
        <pre className="dissertativa-codigo etapas-pocao-receita">
          <code>{aceitos.map((id) => etapa.ingredientes.find((i) => i.id === id)?.codigo).join("\n")}</code>
        </pre>
      )}

      <div className="pocao-ingredientes-pool">
        <AnimatePresence>
          {disponiveis.map((ingrediente) => (
            <motion.button
              key={ingrediente.id}
              type="button"
              className={`pocao-ingrediente ${idArrastando === ingrediente.id ? "pocao-ingrediente--fantasma" : ""}`}
              onPointerDown={(e) => iniciarArraste(e, ingrediente.id)}
              onPointerMove={moverArraste}
              onPointerUp={soltarArraste}
              onPointerCancel={soltarArraste}
              disabled={bloqueado}
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
      </div>

      {idArrastando && arrastando && (
        <motion.div
          className="pocao-ingrediente pocao-ingrediente--arrastando"
          style={{ left: fantasma.x, top: fantasma.y }}
          initial={{ scale: 0.95 }}
          animate={{ scale: 1.08 }}
        >
          <code>{arrastando.codigo}</code>
        </motion.div>
      )}
    </div>
  );
}
