// src/data/cenasPortal3.js
//
// Visual dos desafios do Portal 3 (Arena do Dragão): inimigo, fundo e as
// falas da introdução de cada desafio. O CONTEÚDO dos desafios (enunciados,
// etapas e gabaritos) não fica aqui — vem da API (ver
// backend/prisma/desafios/portal3.js) —, só a "cenografia".
//
// Cada desafio tem fundo e inimigo próprios (originais em
// frontend/arte-original/, WebP gerados por `npm run imagens:otimizar`).
// O inimigo do desafio 6 não é uma imagem: `clone: true` desenha uma cópia
// sombria do herói do jogador, com a aparência e os itens dele (ver
// pages/DesafioEtapas/SpriteInimigo.jsx).
import inimigo1Portal3 from "../assets/images/inimigo_1_portal3.webp";
import fundo1Portal3 from "../assets/images/fundo_batalha_1_portal_3.webp";
import inimigo2Portal3 from "../assets/images/inimigo_desafio2_p3.webp";
import fundo2Portal3 from "../assets/images/Fundo_desafio2_p3.webp";
import inimigo3Portal3 from "../assets/images/inimigo_desafio3_p3.webp";
import fundo3Portal3 from "../assets/images/fundo_desafio3_p3.webp";
import inimigo4Portal3 from "../assets/images/inimigo_desafio4_p3.webp";
import fundo4Portal3 from "../assets/images/fundo_desafio4_p3.webp";
import inimigo5Portal3 from "../assets/images/inimigo_desafio5_p3.webp";
import fundo5Portal3 from "../assets/images/fundo_desafio5_p3.webp";
import fundo6Portal3 from "../assets/images/fundo_desafio6_p3.webp";
// portal 2 (ver CENAS_PORTAL_2)
import esqueletoInimigo from "../assets/images/esqueleto_inimigo.webp";
import mercadorInimigo from "../assets/images/mercador_inimigo.webp";
import bruxaInimigo from "../assets/images/bruxa_inimigo.webp";
import slime from "../assets/images/Slime.png";
import goblinJS from "../assets/images/GoblinJS.png";
import fundoBatalha2 from "../assets/images/Fundo_batalha2.webp";

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
    // Sprites horizontais (668x373), iguais aos dos desafios 1 a 3.
    inimigo: { imagem: inimigo4Portal3, nome: "Escaravelho do Relógio", largura: 170, larguraIntro: 330 },
    fundo: fundo4Portal3,
    falas: [
      "Entre caveiras e cogumelos brilhantes, algo range como as engrenagens de um relógio.",
      "O Escaravelho do Relógio decide quando cada pedaço de código pode rodar.",
      "Síncrono, microtarefas, timers... quem não entende o event loop se perde no tempo.",
      "Ele vai pedir uma explicação escrita — e o mago vai avaliar suas palavras!",
    ],
  },
  5: {
    inimigo: { imagem: inimigo5Portal3, nome: "Morcego dos Ecos", largura: 170, larguraIntro: 330 },
    fundo: fundo5Portal3,
    falas: [
      "No fundo do poço em espiral, algo bate as asas na escuridão.",
      "O Morcego dos Ecos responde a tudo com um eco — mas nem todo eco é igual ao som original.",
      "Aqui nada é o que parece: valores se convertem sozinhos e objetos iguais são diferentes.",
      "Desconfie de cada reflexo e derrube o morcego!",
    ],
  },
  6: {
    // Chefe do portal: uma cópia do herói do jogador, criada pelo Dragão do
    // Código (ele dorme no trono, ao fundo). `clone` = desenhado a partir do
    // próprio personagem — ver pages/DesafioEtapas/SpriteInimigo.jsx.
    chefe: true,
    inimigo: { clone: true, nome: "Herói Sombrio" },
    fundo: fundo6Portal3,
    falas: [
      "No salão do trono, o Dragão do Código dorme... mas alguém desce a escadaria no lugar dele.",
      "Ele tem o seu rosto, a sua armadura e as suas armas — envolto numa aura roxa de bugs.",
      "\"Fui criado pelo Dragão do Código a partir de você. Sou a sua versão mais forte — sem dúvidas, sem erros de digitação.\"",
      "\"Juntos, eu e o Dragão vamos dominar o reino com bugs e erros. E você será o primeiro a cair!\"",
      "São 3 etapas — e a última é uma batalha direta contra a sua sombra. Prepare-se!",
    ],
  },
};

// ---- Portal 2 (Acampamento Goblin) ----
//
// Desafios 3 a 6 do portal 2 foram cadastrados pelo painel de admin e não
// têm tela própria no frontend (só o 1 e o 2 têm, em ResolverDesafio.jsx):
// eles são jogados na tela genérica (DesafioEtapas, conteúdo e correção
// vindos da API), com estas cenas. Antes caíam no conteúdo do desafio 1 do
// portal 1 e a vitória nunca era salva.
const CENAS_PORTAL_2 = {
  3: {
    inimigo: { imagem: esqueletoInimigo, nome: "Esqueleto do Laço", largura: 130, larguraIntro: 260 },
    fundo: fundoBatalha2,
    falas: [
      "Entre as tendas do acampamento, ossos começam a se mexer sozinhos...",
      "O Esqueleto do Laço repete os mesmos passos, de novo e de novo, sem parar.",
      "Entenda como o laço anda e quebre o ciclo dele!",
    ],
  },
  4: {
    inimigo: { imagem: mercadorInimigo, nome: "Mercador do Inventário", largura: 140, larguraIntro: 270 },
    fundo: fundoBatalha2,
    falas: [
      "Um mercador estende o tapete cheio de mercadorias... e de código suspeito.",
      "\"Metade do meu inventário funciona, metade não. Sabe dizer qual é qual?\"",
      "Avalie cada pedaço de código e não caia na lábia dele!",
    ],
  },
  5: {
    inimigo: { imagem: slime, nome: "Slime Feiticeiro", largura: 110, larguraIntro: 220 },
    fundo: fundoBatalha2,
    falas: [
      "Uma gosma brilhante borbulha perto da fogueira — é o Slime Feiticeiro!",
      "O feitiço dele só funciona com as linhas de código na ordem certa.",
      "Monte o programa antes que ele termine de conjurar!",
    ],
  },
  6: {
    chefe: true,
    inimigo: { imagem: bruxaInimigo, nome: "Bruxa Suprema", largura: 200, larguraIntro: 330 },
    fundo: fundoBatalha2,
    falas: [
      "No centro do acampamento, o caldeirão ferve e as tochas ficam roxas...",
      "A Bruxa Suprema governa os goblins com feitiços de código.",
      "Vença a batalha final do Acampamento Goblin e abra o caminho para a Arena do Dragão!",
    ],
  },
};

// Desafio sem cena própria (ex: um 7º desafio cadastrado no futuro) usa o
// visual do desafio 1 com o nome genérico, em vez de quebrar a tela.
// mundoId: 2 usa as cenas do portal 2; qualquer outro, as do portal 3.
export function cenaDoDesafio(numero, mundoId = 3) {
  if (Number(mundoId) === 2) {
    return (
      CENAS_PORTAL_2[numero] ?? {
        ...CENAS_PORTAL_2[3],
        inimigo: { ...CENAS_PORTAL_2[3].inimigo, nome: "Goblin do Acampamento", imagem: goblinJS },
      }
    );
  }
  return CENAS[numero] ?? { ...CENAS[1], inimigo: { ...CENAS[1].inimigo, nome: "Guardião da Arena" } };
}
