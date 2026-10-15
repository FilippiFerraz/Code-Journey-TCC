import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Crown } from "pixelarticons/react/Crown.js";
import { DiamondGem } from "pixelarticons/react/DiamondGem.js";
import { Feather } from "pixelarticons/react/Feather.js";
import { Package } from "pixelarticons/react/Package.js";
import { Shield } from "pixelarticons/react/Shield.js";
import { ShieldSharp } from "pixelarticons/react/ShieldSharp.js";
import { Sword } from "pixelarticons/react/Sword.js";
import api from "../services/api";
import { definirAparenciaPropria } from "../hooks/usePersonagemAvatar";
import AvatarPersonagem from "./AvatarPersonagem";
import IconeItem from "./IconeItem";
import IconePixel from "./IconePixel";
import "./PerfilJogadorCard.css";

// Card de Perfil do Jogador, no topo da coluna direita do layout desktop
// (MainLayout.jsx). Lê tudo de GET /api/perfil (que passa pelo cache curto
// de cacheApi.js, então não repete a chamada que a Home já faz): nome,
// nível, título, ofensiva, ouro, cristais e os itens equipados. Nível,
// ofensiva, ouro, cristais e título são calculados no backend a partir do
// progresso — ver backend/src/services/resumoJogador.service.js.

// Slots na ordem do Editar Personagem; o ícone aparece quando o slot está vazio.
const SLOTS = [
  { tipo: "capacete", nome: "Capacete", icone: Crown },
  { tipo: "peitoral", nome: "Peitoral", icone: Shield },
  { tipo: "escudo", nome: "Escudo", icone: ShieldSharp },
  { tipo: "arma", nome: "Arma", icone: Sword },
  { tipo: "costas", nome: "Costas", icone: Feather },
  { tipo: "botas", nome: "Botas", icone: Package },
];

const RARIDADES = { comum: "Comum", raro: "Raro", epico: "Épico", lendario: "Lendário" };

// Ícone de cada título (a chave vem do backend, em resumoJogador.service.js).
function IconeTitulo({ icone }) {
  const hn = { dragao: "hn-trophy-solid", fogo: "hn-fire-solid", coroa: "hn-crown-solid", livro: "hn-book-solid" }[icone];
  if (hn) return <i className={`hn ${hn}`} aria-hidden="true" />;
  const pixel = { cristal: DiamondGem, espada: Sword, escudo: Shield }[icone];
  return pixel ? <IconePixel icone={pixel} /> : null;
}

function formatarNumero(n) {
  return new Intl.NumberFormat("pt-BR").format(n ?? 0);
}

export default function PerfilJogadorCard() {
  const [perfil, setPerfil] = useState(null);
  const [falhou, setFalhou] = useState(false);

  useEffect(() => {
    let ativo = true;
    api
      .get("/perfil")
      .then((res) => {
        if (!ativo) return;
        // aparência do herói vem junto do perfil: já serve pra todo avatar do jogador
        if (res.data.aparencia) definirAparenciaPropria(res.data.aparencia);
        setPerfil(res.data);
      })
      .catch(() => ativo && setFalhou(true));
    return () => {
      ativo = false;
    };
  }, []);

  if (falhou) return null; // sem perfil (ex: offline): a coluna só fica vazia

  if (!perfil) {
    return (
      <section className="pjc pjc--carregando" aria-busy="true" aria-label="Carregando seu perfil">
        <div className="pjc-esqueleto pjc-esqueleto--topo" />
        <div className="pjc-esqueleto pjc-esqueleto--linha" />
        <div className="pjc-esqueleto pjc-esqueleto--linha" />
      </section>
    );
  }

  const equipados = perfil.itensEquipados ?? [];
  const dias = perfil.diasOfensiva ?? 0;

  return (
    <section className="pjc" aria-label="Seu perfil">
      <div className="pjc-topo">
        <Link to="/perfil" className="pjc-moldura" aria-label="Abrir seu perfil">
          <AvatarPersonagem itensEquipados={equipados} className="pjc-avatar" alt={`Personagem de ${perfil.nome}`} />
          <span className="pjc-nivel">Lvl. {perfil.nivel ?? 1}</span>
        </Link>

        <div className="pjc-identidade">
          <strong className="pjc-nome" title={perfil.nome}>
            {perfil.nome}
          </strong>
          {perfil.titulo && (
            <span className="pjc-titulo">
              <IconeTitulo icone={perfil.titulo.icone} />
              {perfil.titulo.nome}
            </span>
          )}
          <span className={`pjc-ofensiva ${dias > 0 ? "pjc-ofensiva--acesa" : ""}`}>
            <i className="hn hn-fire-solid" aria-hidden="true" />
            {dias === 1 ? "1 dia seguido" : `${dias} dias seguidos`}
          </span>
        </div>
      </div>

      <div className="pjc-recursos">
        <div className="pjc-recurso pjc-recurso--ouro">
          <i className="hn hn-coin-solid pjc-recurso-icone" aria-hidden="true" />
          <span className="pjc-recurso-rotulo">Ouro</span>
          <strong className="pjc-recurso-valor">{formatarNumero(perfil.ouro)}</strong>
        </div>
        <div className="pjc-recurso pjc-recurso--cristais">
          <IconePixel icone={DiamondGem} className="pjc-recurso-icone" />
          <span className="pjc-recurso-rotulo">Cristais</span>
          <strong className="pjc-recurso-valor">{formatarNumero(perfil.cristais)}</strong>
        </div>
      </div>

      <div className="pjc-equipamentos">
        <div className="pjc-secao">
          <span>Equipamentos</span>
          <Link to="/editar-personagem" className="pjc-secao-link">
            Trocar
          </Link>
        </div>
        <ul className="pjc-slots">
          {SLOTS.map((slot, i) => {
            const item = equipados.find((it) => it.tipo === slot.tipo);
            const lado = i === 0 ? "pjc-dica--esquerda" : i === SLOTS.length - 1 ? "pjc-dica--direita" : "";
            return (
              <li
                key={slot.tipo}
                className={`pjc-slot ${item ? `pjc-slot--${item.raridade ?? "comum"}` : "pjc-slot--vazio"}`}
                tabIndex={0}
                aria-label={item ? `${slot.nome}: ${item.nome}` : `${slot.nome}: vazio`}
              >
                {item ? (
                  <IconeItem item={item} classeImagem="pjc-slot-imagem" classeEmoji="pjc-slot-emoji" />
                ) : (
                  <IconePixel icone={slot.icone} className="pjc-slot-vazio-icone" />
                )}
                <span className={`pjc-dica ${lado}`} role="tooltip">
                  <span className="pjc-dica-slot">{slot.nome}</span>
                  {item ? (
                    <>
                      <strong className="pjc-dica-nome">{item.nome}</strong>
                      {item.raridade && (
                        <span className={`pjc-dica-raridade pjc-dica-raridade--${item.raridade}`}>{RARIDADES[item.raridade] ?? item.raridade}</span>
                      )}
                    </>
                  ) : (
                    <strong className="pjc-dica-nome">Vazio — disponível</strong>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
