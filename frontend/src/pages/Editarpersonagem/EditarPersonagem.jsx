import { useNavigate } from "react-router-dom";
import "./EditarPersonagem.css";
// Avatar provisório — troque pela arte real do personagem no futuro.
import avatar from "../../assets/images/Guerreiro_simples.png";

// Slots de equipamento ao redor do personagem.
// Por enquanto vazios; no futuro cada slot recebe o item equipado.
const SLOTS_ESQUERDA = [
  { id: "capacete", nome: "Capacete", icone: "🪖" },
  { id: "peitoral", nome: "Peitoral", icone: "🛡️" },
  { id: "sapato", nome: "Sapato", icone: "🥾" },
];

const SLOTS_DIREITA = [
  { id: "arma", nome: "Arma", icone: "⚔️" },
  { id: "costas", nome: "Costas", icone: "🧥" },
  { id: "acessorios", nome: "Acessórios", icone: "💍" },
];

// Quantidade de espaços do inventário (visual, ainda sem itens reais).
const SLOTS_INVENTARIO = 24;

// Conquistas de exemplo, no espírito do protótipo.
// TODO: substituir por GET no backend quando o sistema de conquistas existir.
const CONQUISTAS = [
  {
    id: 1,
    icone: "🥈",
    texto:
      "50 perguntas respondidas com sucesso. Esta conquista mostra o quanto você evoluiu e domina os desafios do jogo.",
  },
  {
    id: 2,
    icone: "🥇",
    texto:
      "Você conquistou a Trilha da Sabedoria ao responder 100 perguntas com sucesso. Sua jornada está só começando!",
  },
  {
    id: 3,
    icone: "🐉",
    texto:
      "A Cabeça do Dragão é sua recompensa por vencer 200 perguntas com precisão.",
  },
];

function Slot({ slot }) {
  return (
    <div className="editar-slot">
      <div className="editar-slot-caixa">
        <span className="editar-slot-icone">{slot.icone}</span>
      </div>
      <span className="editar-slot-nome">{slot.nome}</span>
    </div>
  );
}

function EditarPersonagem() {
  const navigate = useNavigate();

  return (
    <div className="editar">
      <button
        type="button"
        className="editar-voltar"
        onClick={() => navigate("/perfil")}
      >
        ← Voltar
      </button>

      {/* Cena de equipamento: personagem no centro, slots em volta */}
      <section className="editar-cena">
        <div className="editar-slots">
          {SLOTS_ESQUERDA.map((slot) => (
            <Slot key={slot.id} slot={slot} />
          ))}
        </div>

        <img
          src={avatar}
          alt="Personagem"
          className="editar-avatar"
          draggable={false}
        />

        <div className="editar-slots">
          {SLOTS_DIREITA.map((slot) => (
            <Slot key={slot.id} slot={slot} />
          ))}
        </div>
      </section>

      {/* Inventário */}
      <h2 className="editar-titulo">Seus itens</h2>
      <section className="editar-card">
        <header className="editar-card-topo">Inventário 🎒</header>
        <div className="editar-inventario">
          <div className="editar-madeira">
            <div className="editar-grid">
              {Array.from({ length: SLOTS_INVENTARIO }).map((_, i) => (
                <div className="editar-celula" key={i} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Conquistas */}
      <h2 className="editar-titulo">Suas conquistas</h2>
      <section className="editar-conquistas">
        {CONQUISTAS.map((c) => (
          <div className="editar-conquista" key={c.id}>
            <div className="editar-conquista-icone">{c.icone}</div>
            <p className="editar-conquista-texto">{c.texto}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

export default EditarPersonagem;
