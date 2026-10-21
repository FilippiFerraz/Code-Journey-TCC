// src/data/cenasPortal3.js
//
// Visual dos desafios do Portal 3 (Arena do Dragão): inimigo, fundo e as
// falas da introdução de cada desafio. O CONTEÚDO dos desafios (enunciados,
// etapas e gabaritos) não fica aqui — vem da API (ver
// backend/prisma/desafios/portal3.js) —, só a "cenografia".
//
// ARTES PROVISÓRIAS: o portal 3 ainda não tem inimigos nem cenários
// próprios, então reaproveita os do Portal 1. Quando as artes existirem,
// basta trocar os imports abaixo — nenhuma tela precisa mudar.
import inimigo1Portal3 from "../assets/images/inimigo_1_portal3.webp";
import fundo1Portal3 from "../assets/images/fundo_batalha_1_portal_3.webp";
import inimigo2Portal3 from "../assets/images/inimigo_desafio2_p3.webp";
import fundo2Portal3 from "../assets/images/Fundo_desafio2_p3.webp";
import inimigo3Portal3 from "../assets/images/inimigo_desafio3_p3.webp";
import fundo3Portal3 from "../assets/images/fundo_desafio3_p3.webp";
import bruxaInimigo from "../assets/images/bruxa_inimigo.webp";
import slime from "../assets/images/Slime.png";
import reiGoblinInimigo from "../assets/images/rei_goblin_inimigo.webp";
import fundoBatalha from "../assets/images/Fundo_batalha.png";
import fundoBatalha2 from "../assets/images/Fundo_batalha2.webp";
import fundoDesafio6P1 from "../assets/images/Fundo_desafio_6_P1.webp";

// Por número do desafio (1 a 6). "chefe: true" usa a arena de chefe (sprite
// grande, barra de vida no topo) — mesmo visual de DesafioChefe.jsx.
const CENAS = {
  1: {
    // Arte própria do portal 3. O sprite é HORIZONTAL (676x369), então a
    // largura é maior que a dos sprites quadrados: `largura` na batalha e
    // `larguraIntro` na introdução (que por padrão é 200px).
    inimigo: { imagem: inimigo1Portal3, nome: "Guardião do Labirinto", largura: 170, larguraIntro: 330 },
    fundo: fundo1Portal3,
    falas: [
      "Você atravessa o portal e chega à Arena do Dragão...",
      "Na entrada, um labirinto onde as variáveis aparecem e somem sem aviso.",
      "O Guardião do Labirinto bloqueia a passagem. Ele conhece cada truque do escopo.",
      "Aqui os desafios são mais duros: cada um tem 3 etapas. Vença todas para derrotá-lo!",
    ],
  },
  2: {
    // Arte própria (masmorra e aranha de pedra e cristal). Sprite horizontal
    // (668x373), igual ao do desafio 1 — mesmas larguras.
    inimigo: { imagem: inimigo2Portal3, nome: "Aranha das Garras", largura: 170, larguraIntro: 330 },
    fundo: fundo2Portal3,
    falas: [
      "Das sombras da masmorra, uma aranha de pedra e cristal desce pela teia!",
      "Dizem que ela nunca esquece nada do lugar onde nasceu...",
      "...assim como uma closure lembra das variáveis do escopo onde foi criada.",
      "Prove que entende closures para cortar as garras dela!",
    ],
  },
  3: {
    // Arte própria (masmorra alagada e lagarto de escamas negras). Sprite
    // horizontal (668x373), igual aos dos desafios 1 e 2 — mesmas larguras.
    inimigo: { imagem: inimigo3Portal3, nome: "Mestre dos Arrays", largura: 170, larguraIntro: 330 },
    fundo: fundo3Portal3,
    falas: [
      "Das águas escuras da masmorra, um lagarto de escamas negras ergue a cabeça.",
      "\"Filtro, transformo e somo tudo com um só encadeamento\", ele rosna.",
      "Para passar, você vai precisar dominar map, filter e reduce.",
    ],
  },
  4: {
    inimigo: { imagem: bruxaInimigo, nome: "Bruxa do Relógio" },
    fundo: fundoBatalha2,
    falas: [
      "No alto da torre, um relógio gigante gira fora de ordem.",
      "A Bruxa do Relógio controla quando cada pedaço de código pode rodar.",
      "Síncrono, microtarefas, timers... quem não entende o event loop se perde no tempo.",
      "Ela vai pedir uma explicação escrita — e o mago vai avaliar suas palavras!",
    ],
  },
  5: {
    inimigo: { imagem: slime, nome: "Slime dos Espelhos" },
    fundo: fundoBatalha,
    falas: [
      "Você entra num salão cheio de espelhos.",
      "Um Slime se multiplica nos reflexos — qual deles é o verdadeiro?",
      "Aqui nada é o que parece: valores se convertem sozinhos e objetos iguais são diferentes.",
      "Desconfie de tudo e quebre os espelhos!",
    ],
  },
  6: {
    chefe: true,
    inimigo: { imagem: reiGoblinInimigo, nome: "Dragão do Código" },
    fundo: fundoDesafio6P1,
    falas: [
      "O chão treme. O centro da arena se abre em chamas...",
      "O Dragão do Código desperta, guardião final do Portal 3.",
      "\"Recursão, this, coerção... vamos ver se você aprendeu de verdade.\"",
      "São 3 etapas — e a última é uma batalha direta contra ele. Prepare-se!",
    ],
  },
};

// Desafio sem cena própria (ex: um 7º desafio cadastrado no futuro) usa o
// visual do desafio 1 com o nome genérico, em vez de quebrar a tela.
export function cenaDoDesafio(numero) {
  return CENAS[numero] ?? { ...CENAS[1], inimigo: { ...CENAS[1].inimigo, nome: "Guardião da Arena" } };
}
