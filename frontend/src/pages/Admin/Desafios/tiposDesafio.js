// Dados compartilhados pela gestão de desafios do admin (AdminDesafios.jsx,
// EditarDesafioAdmin.jsx e EditorExercicio.jsx).

// Nome de cada portal do mapa — mesmos de PORTAIS em pages/Home/Home.jsx.
export const PORTAIS = {
  1: "Vila Inicial",
  2: "Acampamento Goblin",
  3: "Arena do Dragão",
};

export const nomePortal = (mundoId) => PORTAIS[mundoId] ?? `Mundo ${mundoId}`;

export const DIFICULDADES = {
  iniciante: "Iniciante",
  guerreiro: "Guerreiro",
};

export const nomeDificuldade = (dificuldade) => DIFICULDADES[dificuldade] ?? dificuldade;

// Tipos de exercício aceitos pelo backend (ver
// backend/src/services/etapas.service.js::validarExercicio) + "etapas"
// (desafio com várias etapas, portal 3).
export const TIPOS = {
  multipla_escolha: { rotulo: "Múltipla escolha", icone: "hn-check-list" },
  ordenar_blocos: { rotulo: "Ordenar blocos", icone: "hn-sort" },
  avaliar_codigo: { rotulo: "Avaliar código", icone: "hn-code" },
  montar_pocao: { rotulo: "Montar poção", icone: "hn-fire" },
  batalha_chefe: { rotulo: "Batalha de chefe", icone: "hn-crown" },
  dissertativa: { rotulo: "Dissertativa (IA)", icone: "hn-pencil" },
  etapas: { rotulo: "Várias etapas", icone: "hn-numbered-list" },
};

export const rotuloTipo = (tipo) => TIPOS[tipo]?.rotulo ?? tipo ?? "Desconhecido";

// Tipo de um conteúdo (alternativas em array = múltipla escolha antiga).
export function tipoDoConteudo(conteudo) {
  if (Array.isArray(conteudo)) return "multipla_escolha";
  return conteudo?.tipo;
}

// Próximo id livre numa lista: prefixo + (maior número já usado + 1).
// Ex.: ["b1", "b2"] -> "b3". Alternativas usam letras (a, b, c...).
export function novoId(prefixo, lista) {
  const numeros = lista
    .map((item) => Number(String(item.id).replace(prefixo, "")))
    .filter((n) => Number.isInteger(n));
  return `${prefixo}${numeros.length ? Math.max(...numeros) + 1 : 1}`;
}

export function novaLetra(opcoes) {
  const usadas = new Set(opcoes.map((op) => op.id));
  for (let i = 0; i < 26; i++) {
    const letra = String.fromCharCode(97 + i);
    if (!usadas.has(letra)) return letra;
  }
  return novoId("op", opcoes);
}

// Troca um item da lista com o vizinho (direcao -1 = sobe, 1 = desce).
export function mover(lista, indice, direcao) {
  const destino = indice + direcao;
  if (destino < 0 || destino >= lista.length) return lista;
  const copia = [...lista];
  [copia[indice], copia[destino]] = [copia[destino], copia[indice]];
  return copia;
}

// Conteúdo inicial de cada tipo, usado ao criar uma etapa nova.
export function modeloExercicio(tipo) {
  switch (tipo) {
    case "multipla_escolha":
      return {
        tipo,
        opcoes: [
          { id: "a", texto: "", correta: true },
          { id: "b", texto: "", correta: false },
        ],
      };
    case "ordenar_blocos":
      return { tipo, blocos: [{ id: "b1", codigo: "" }], ordemCorreta: ["b1"] };
    case "avaliar_codigo":
      return { tipo, cartas: [{ id: "c1", codigo: "", correta: true, explicacao: "" }] };
    case "montar_pocao":
      return { tipo, ingredientesCorretos: [{ id: "i1", codigo: "" }] };
    case "batalha_chefe":
      return {
        tipo,
        vidasNecessarias: 3,
        perguntas: [
          {
            id: "p1",
            enunciado: "",
            opcoes: [
              { id: "a", texto: "", correta: true },
              { id: "b", texto: "", correta: false },
            ],
          },
        ],
      };
    case "dissertativa":
      return { tipo, criterios: [""], respostaReferencia: "" };
    default:
      return { tipo };
  }
}
