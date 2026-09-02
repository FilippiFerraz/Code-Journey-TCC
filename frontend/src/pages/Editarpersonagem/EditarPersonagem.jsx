import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./EditarPersonagem.css";
import api from "../../services/api";
import { resolverAvatarPersonagem } from "../../hooks/usePersonagemAvatar";
import IconeItem from "../../components/IconeItem";
import BotaoPixel from "../../components/BotaoPixel";

// Slots de equipamento ao redor do personagem. Os ids batem com Item.tipo
// no backend (ver schema.prisma) — é assim que um item entra no slot certo.
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

// Quantidade de espaços do inventário (visual) — cresce se o jogador tiver
// mais itens do que isso, pra nunca esconder um item real.
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

function Slot({ slot, itemPersonagem, ocupado, onClicar }) {
  const item = itemPersonagem?.item;

  return (
    <button
      type="button"
      className={`editar-slot ${item ? "editar-slot-ocupado" : ""}`}
      onClick={onClicar}
      disabled={!item || ocupado}
      title={item ? `${item.nome} — clique para desequipar` : `${slot.nome} vazio`}
    >
      <div className="editar-slot-caixa">
        {item ? (
          <IconeItem
            item={item}
            classeImagem="editar-slot-imagem"
            classeEmoji="editar-slot-icone editar-slot-icone-cheio"
          />
        ) : (
          <span className="editar-slot-icone">{slot.icone}</span>
        )}
      </div>
      <span className="editar-slot-nome">{slot.nome}</span>
    </button>
  );
}

// Clique seleciona o item e mostra o painel de detalhe, com um botão
// Equipar/Desequipar explícito — mais fácil que depender de duplo clique,
// que não é um gesto confiável em telas de toque.
function CelulaInventario({ itemPersonagem, ocupado, selecionado, onSelecionar }) {
  if (!itemPersonagem) {
    return <div className="editar-celula" />;
  }

  const { item, quantidade } = itemPersonagem;

  return (
    <button
      type="button"
      className={`editar-celula editar-celula-item ${itemPersonagem.equipado ? "editar-celula-equipado" : ""} ${
        selecionado ? "editar-celula-selecionado" : ""
      }`}
      onClick={onSelecionar}
      disabled={ocupado}
      title={`${item.nome}${quantidade > 1 ? ` x${quantidade}` : ""} — toque para ver detalhes`}
    >
      <IconeItem item={item} classeImagem="editar-celula-imagem" classeEmoji="editar-celula-icone" />
      {quantidade > 1 && <span className="editar-celula-quantidade">{quantidade}</span>}
    </button>
  );
}

function EditarPersonagem() {
  const navigate = useNavigate();

  const [personagem, setPersonagem] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [itemEmAcao, setItemEmAcao] = useState(null); // id do ItemPersonagem sendo (des)equipado
  const [itemSelecionado, setItemSelecionado] = useState(null); // item com descrição aberta

  useEffect(() => {
    let ativo = true;

    api
      .get("/personagem")
      .then((res) => ativo && setPersonagem(res.data))
      .catch(() => ativo && setErro("Não foi possível carregar seu personagem."))
      .finally(() => ativo && setCarregando(false));

    return () => {
      ativo = false;
    };
  }, []);

  async function alternarEquipamento(itemPersonagem) {
    if (itemEmAcao) return;

    const acao = itemPersonagem.equipado ? "desequipar" : "equipar";
    setItemEmAcao(itemPersonagem.id);
    setErro(null);

    try {
      await api.post(`/personagem/inventario/${itemPersonagem.id}/${acao}`);
      const resposta = await api.get("/personagem");
      setPersonagem(resposta.data);
      // mantém o painel de detalhe aberto, mas com o equipado/quantidade atualizados
      setItemSelecionado(
        (atual) => atual && resposta.data.itens.find((ip) => ip.id === atual.id)
      );
    } catch {
      setErro("Não foi possível atualizar o equipamento. Tente de novo.");
    } finally {
      setItemEmAcao(null);
    }
  }

  if (carregando) {
    return <div className="editar-estado">Carregando personagem…</div>;
  }

  if (erro && !personagem) {
    return <div className="editar-estado editar-estado-erro">{erro}</div>;
  }

  const itens = personagem.itens ?? [];
  const itemDoSlot = (slotId) => itens.find((ip) => ip.equipado && ip.item.tipo === slotId);
  const avatar = resolverAvatarPersonagem(itens);

  // itens reais primeiro, depois células vazias até completar a grade
  // (ou além dela, se o jogador tiver mais itens do que SLOTS_INVENTARIO)
  const totalCelulas = Math.max(SLOTS_INVENTARIO, itens.length);
  const celulas = Array.from({ length: totalCelulas }, (_, i) => itens[i] ?? null);

  return (
    <div className="editar">
      <BotaoPixel
        className="editar-voltar"
        classeMiolo="editar-voltar-miolo"
        onClick={() => navigate("/perfil")}
      >
        ← Voltar
      </BotaoPixel>

      {/* Cena de equipamento: personagem no centro, slots em volta */}
      <section className="editar-cena">
        <div className="editar-slots">
          {SLOTS_ESQUERDA.map((slot) => {
            const itemPersonagem = itemDoSlot(slot.id);
            return (
              <Slot
                key={slot.id}
                slot={slot}
                itemPersonagem={itemPersonagem}
                ocupado={itemEmAcao === itemPersonagem?.id}
                onClicar={() => itemPersonagem && alternarEquipamento(itemPersonagem)}
              />
            );
          })}
        </div>

        <img
          src={avatar}
          alt="Personagem"
          className="editar-avatar"
          draggable={false}
        />

        <div className="editar-slots">
          {SLOTS_DIREITA.map((slot) => {
            const itemPersonagem = itemDoSlot(slot.id);
            return (
              <Slot
                key={slot.id}
                slot={slot}
                itemPersonagem={itemPersonagem}
                ocupado={itemEmAcao === itemPersonagem?.id}
                onClicar={() => itemPersonagem && alternarEquipamento(itemPersonagem)}
              />
            );
          })}
        </div>
      </section>

      {/* Inventário */}
      <h2 className="editar-titulo">Seus itens</h2>
      <section className="editar-card">
        <header className="editar-card-topo">Inventário 🎒</header>
        <div className="editar-inventario">
          {erro && <p className="editar-inventario-erro">{erro}</p>}
          <div className="editar-madeira">
            <div className="editar-grid">
              {celulas.map((itemPersonagem, i) => (
                <CelulaInventario
                  key={itemPersonagem?.id ?? `vazio-${i}`}
                  itemPersonagem={itemPersonagem}
                  ocupado={itemEmAcao === itemPersonagem?.id}
                  selecionado={itemSelecionado?.id === itemPersonagem?.id}
                  onSelecionar={() => itemPersonagem && setItemSelecionado(itemPersonagem)}
                />
              ))}
            </div>
          </div>

          {itemSelecionado && (
            <div className="editar-item-detalhe">
              <BotaoPixel
                className="editar-item-detalhe-fechar"
                classeMiolo="editar-item-detalhe-fechar-miolo"
                onClick={() => setItemSelecionado(null)}
                aria-label="Fechar detalhes do item"
              >
                ✕
              </BotaoPixel>

              <IconeItem
                item={itemSelecionado.item}
                classeImagem="editar-item-detalhe-imagem"
                classeEmoji="editar-item-detalhe-icone"
              />

              <div className="editar-item-detalhe-texto">
                <strong className="editar-item-detalhe-nome">
                  {itemSelecionado.item.nome}
                  {itemSelecionado.quantidade > 1 && ` x${itemSelecionado.quantidade}`}
                </strong>
                <span className="editar-item-detalhe-raridade">
                  {itemSelecionado.item.raridade}
                  {itemSelecionado.equipado ? " • equipado" : ""}
                </span>
                <p className="editar-item-detalhe-descricao">
                  {itemSelecionado.item.descricao ?? "Sem descrição."}
                </p>

                <BotaoPixel
                  className={`editar-item-detalhe-botao ${
                    itemSelecionado.equipado ? "editar-item-detalhe-botao--desequipar" : ""
                  }`}
                  classeMiolo={`editar-item-detalhe-botao-miolo ${
                    itemSelecionado.equipado ? "editar-item-detalhe-botao-miolo--desequipar" : ""
                  }`}
                  onClick={() => alternarEquipamento(itemSelecionado)}
                  disabled={itemEmAcao === itemSelecionado.id}
                >
                  {itemEmAcao === itemSelecionado.id
                    ? "Aguarde..."
                    : itemSelecionado.equipado
                      ? "Desequipar"
                      : "Equipar"}
                </BotaoPixel>
              </div>
            </div>
          )}
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
