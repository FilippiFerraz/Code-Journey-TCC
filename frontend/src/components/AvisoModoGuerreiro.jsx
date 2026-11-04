import { Skull } from "pixelarticons/react/Skull.js";
import IconePixel from "./IconePixel";
import { regrasDaDificuldade } from "../data/dificuldades";
import "./AvisoModoGuerreiro.css";

// Aparece no card do enunciado, no lugar da dica, quando o desafio está
// sendo jogado no modo Guerreiro (difícil): lembra o jogador das regras e
// da recompensa maior. "className" é a classe do bloco de dica da tela
// (mesmo espaçamento/fundo), pra o aviso ocupar o mesmo lugar.
function AvisoModoGuerreiro({ className = "" }) {
  const { vidaMaxima, multiplicadorXp, multiplicadorMoedas } = regrasDaDificuldade("guerreiro");
  return (
    <p className={`${className} aviso-modo-guerreiro`}>
      <IconePixel icone={Skull} className="aviso-modo-guerreiro-icone" />{" "}
      <strong>Modo Guerreiro:</strong> sem dicas e só {vidaMaxima} corações. Vencendo, você ganha{" "}
      <strong>XP x{multiplicadorXp}</strong> no ranking e <strong>ouro x{multiplicadorMoedas}</strong>.
    </p>
  );
}

export default AvisoModoGuerreiro;
