import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import BotaoPixel from "../../components/BotaoPixel";
import IconePixel from "../../components/IconePixel";
import { tocarSom } from "../../utils/sons";
import fundoLoja from "../../assets/images/fundo_loja.webp";
import mago from "../../assets/images/Mago.webp";
import { Coins } from "pixelarticons/react/Coins.js";
import { Gift } from "pixelarticons/react/Gift.js";
import { Hourglass } from "pixelarticons/react/Hourglass.js";
import { Potion } from "pixelarticons/react/Potion.js";
import { Script } from "pixelarticons/react/Script.js";
import "./Loja.css";

// Lojinha do Mago (casinha do canto do mapa da Home): tela cheia, sem
// MainLayout. Em cima a cena da loja — o fundo é a arte do balcão com o
// mago pintado apagado, e o vendedor é o Mago.webp por cima, no mesmo
// lugar —, embaixo a fala do Mago e a vitrine com os 4 itens.
//
// Preço, limite e descrição vêm do backend (GET /api/loja — ver
// ITENS_LOJA em backend/src/services/loja.service.js); aqui só ficam o
// visual de cada item e as falas do Mago.

const VISUAL_ITENS = {
  congelar: { icone: Hourglass, cor: "gelo", ondeUsar: "Use pela mochila durante um desafio." },
  elixir: { icone: Potion, cor: "verde", ondeUsar: "Beba pela mochila durante um desafio." },
  pular: { icone: Script, cor: "roxo", ondeUsar: "Use pela mochila ou na lista de desafios." },
  bau: { icone: Gift, cor: "dourado", ondeUsar: "Abre na hora!" },
};

const FALAS_BOAS_VINDAS = [
  "Bem-vindo, aventureiro! Moedas tilintando no bolso? Dê uma olhada nas minhas raridades.",
  "Ah, um cliente! Cada desafio vencido enche sua bolsa — e minha vitrine está cheia de truques.",
  "Psiu... tenho itens que nenhum goblin conhece. Escolha com sabedoria, as moedas não caem do céu!",
];

const FALAS_COMPRA = {
  congelar: "Uma Ampulheta Congelada! Está na sua mochila — abra-a durante um desafio quando precisar de um respiro.",
  elixir: "Um Elixir do Sábio! Beba pela mochila num desafio novo e o XP dele vale em dobro.",
  pular: "Pergaminho do Atalho na mochila! Use durante um desafio difícil (menos no chefe) para seguir em frente.",
};

function falaInicial() {
  return FALAS_BOAS_VINDAS[Math.floor(Math.random() * FALAS_BOAS_VINDAS.length)];
}

// Por que o botão de comprar está desligado (null = pode comprar).
function motivoBloqueio(item, moedas) {
  if (item.esgotado) return "Esgotado";
  if (item.maximo && item.quantidade >= item.maximo) return item.maximo === 1 ? "Ativo" : "Mochila cheia";
  if (moedas < item.preco) return `Faltam ${item.preco - moedas}`;
  return null;
}

function Loja() {
  const navigate = useNavigate();
  // "carregando" | "pronta" | "erro"
  const [fase, setFase] = useState("carregando");
  const [moedas, setMoedas] = useState(0);
  const [itens, setItens] = useState([]);
  const [fala, setFala] = useState(falaInicial);
  const [comprando, setComprando] = useState(null);
  // Cada "TENTAR DE NOVO" incrementa isso e refaz a busca.
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let ativo = true;
    setFase("carregando");
    api
      .get("/loja")
      .then((res) => {
        if (!ativo) return;
        setMoedas(res.data.moedas);
        setItens(res.data.itens);
        setFase("pronta");
      })
      .catch(() => ativo && setFase("erro"));
    return () => {
      ativo = false;
    };
  }, [tentativa]);

  async function comprar(item) {
    if (comprando) return;
    setComprando(item.chave);
    try {
      const { data } = await api.post("/loja/comprar", { chave: item.chave });
      setMoedas(data.moedas);

      if (item.chave === "bau") {
        // A roleta do BauDaSorte gira até o prêmio que o servidor já sorteou.
        try {
          sessionStorage.setItem("bauPendente:loja", JSON.stringify({ itemGanho: data.itemGanho }));
        } catch {
          // sem sessionStorage a roleta mostra o aviso; o item já está no inventário
        }
        navigate("/bau-loja");
        return;
      }

      setItens((atuais) =>
        atuais.map((atual) => (atual.chave === item.chave ? { ...atual, quantidade: data.quantidade } : atual))
      );
      setFala(FALAS_COMPRA[item.chave]);
      tocarSom("recompensa");
    } catch (erro) {
      setFala(erro.response?.data?.erro || "Hmm, minha magia falhou... tente de novo.");
      tocarSom("erro");
    } finally {
      setComprando(null);
    }
  }

  function renderVitrine() {
    if (fase === "carregando") {
      return <p className="loja-aviso">O Mago está arrumando a vitrine...</p>;
    }
    if (fase === "erro") {
      return (
        <div className="loja-aviso">
          <p>A porta da loja emperrou! Tente novamente.</p>
          <BotaoPixel
            className="loja-comprar"
            classeMiolo="loja-comprar-miolo"
            onClick={() => setTentativa((t) => t + 1)}
          >
            TENTAR DE NOVO
          </BotaoPixel>
        </div>
      );
    }

    return (
      <ul className="loja-itens">
        {itens.map((item) => {
          const visual = VISUAL_ITENS[item.chave] ?? VISUAL_ITENS.bau;
          const bloqueio = motivoBloqueio(item, moedas);
          return (
            <li key={item.chave} className={`loja-item loja-item--${visual.cor}`}>
              <div className="loja-item-topo">
                <span className="loja-item-icone" aria-hidden="true">
                  <IconePixel icone={visual.icone} />
                </span>
                <div className="loja-item-titulos">
                  <h2 className="loja-item-nome">{item.nome}</h2>
                  {item.maximo ? (
                    <span className="loja-item-estoque">
                      {item.maximo === 1
                        ? item.quantidade > 0
                          ? "Ativo agora"
                          : "Nenhum ativo"
                        : `Na mochila: ${item.quantidade}/${item.maximo}`}
                    </span>
                  ) : (
                    <span className="loja-item-estoque">{visual.ondeUsar}</span>
                  )}
                </div>
              </div>

              <p className="loja-item-descricao">{item.descricao}</p>
              {item.maximo ? <p className="loja-item-uso">{visual.ondeUsar}</p> : null}

              <BotaoPixel
                className="loja-comprar"
                classeMiolo="loja-comprar-miolo"
                onClick={() => comprar(item)}
                disabled={Boolean(bloqueio) || comprando !== null}
                aria-label={`Comprar ${item.nome} por ${item.preco} moedas${bloqueio ? ` (${bloqueio})` : ""}`}
              >
                <span className="loja-preco">
                  <IconePixel icone={Coins} className="loja-moeda" />
                  {item.preco}
                </span>
                <span className="loja-comprar-texto">
                  {comprando === item.chave ? "..." : bloqueio ?? "Comprar"}
                </span>
              </BotaoPixel>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div className="loja-tela">
      <section className="loja-cena" style={{ backgroundImage: `url(${fundoLoja})` }}>
        <BotaoPixel
          className="loja-voltar"
          classeMiolo="loja-voltar-miolo"
          onClick={() => navigate("/home")}
          aria-label="Voltar para o mapa"
        >
          <i className="hn hn-arrow-left" aria-hidden="true" />
        </BotaoPixel>

        <img src={mago} alt="O Mago, dono da loja" className="loja-mago" draggable={false} />

        {/* mesmo saldo do "Ouro" do card de perfil */}
        <div className="loja-bolsa" aria-label={`Você tem ${moedas} moedas de ouro`}>
          <IconePixel icone={Coins} className="loja-moeda" />
          <span>{fase === "pronta" ? moedas : "..."}</span>
        </div>
      </section>

      <main className="loja-balcao">
        <h1 className="loja-titulo">Lojinha do Mago</h1>

        <p className="loja-fala" aria-live="polite">
          {fala}
        </p>

        {renderVitrine()}

        <p className="loja-dica">
          <IconePixel icone={Coins} className="loja-moeda" /> Vença desafios para ganhar moedas de ouro: +10 por
          desafio, +5 se vencer sem errar.
        </p>
      </main>
    </div>
  );
}

export default Loja;
