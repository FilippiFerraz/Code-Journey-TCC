import { mover, novaLetra, novoId } from "./tiposDesafio";

// Formulário do CONTEÚDO de um exercício, conforme o tipo (múltipla escolha,
// ordenar blocos, avaliar código, montar poção, batalha de chefe ou
// dissertativa). Usado tanto no desafio de etapa única quanto em cada etapa
// dos desafios do portal 3 (ver EditarDesafioAdmin.jsx).
//
// Recebe o exercício já com `tipo` (múltipla escolha antiga, em array, chega
// convertida pra { tipo: "multipla_escolha", opcoes }) e devolve o objeto
// inteiro atualizado em onChange. Campos que o formulário não conhece são
// mantidos — editar nunca apaga dado que já estava no banco.
//
// A validação de verdade é a do backend (etapas.service.js) — os erros dela
// voltam com a etapa e o item problemático ("Etapa 2: ...").

// ---------- peças reutilizáveis ----------

export function BotoesItem({ indice, total, onMover, onRemover, rotuloRemover }) {
  return (
    <div className="admin-ex-botoes">
      <button
        type="button"
        className="admin-ex-botao"
        onClick={() => onMover(indice, -1)}
        disabled={indice === 0}
        aria-label="Mover para cima"
        title="Mover para cima"
      >
        <i className="hn hn-arrow-up" aria-hidden="true" />
      </button>
      <button
        type="button"
        className="admin-ex-botao"
        onClick={() => onMover(indice, 1)}
        disabled={indice === total - 1}
        aria-label="Mover para baixo"
        title="Mover para baixo"
      >
        <i className="hn hn-arrow-down" aria-hidden="true" />
      </button>
      <button
        type="button"
        className="admin-ex-botao admin-ex-botao--remover"
        onClick={() => onRemover(indice)}
        aria-label={rotuloRemover}
        title={rotuloRemover}
      >
        <i className="hn hn-trash" aria-hidden="true" />
      </button>
    </div>
  );
}

// Alternativas com uma correta (radio). `nome` separa os grupos de radio
// quando há várias listas na mesma tela (perguntas do chefe, etapas).
function ListaOpcoes({ opcoes, onChange, nome }) {
  const atualizar = (indice, campos) =>
    onChange(opcoes.map((op, i) => (i === indice ? { ...op, ...campos } : op)));

  return (
    <div className="admin-ex-lista">
      {opcoes.map((opcao, indice) => (
        <div className="admin-desafios-opcao" key={indice}>
          <input
            type="radio"
            name={nome}
            checked={Boolean(opcao.correta)}
            onChange={() => onChange(opcoes.map((op, i) => ({ ...op, correta: i === indice })))}
            title="Marcar como correta"
            aria-label={`Alternativa ${opcao.id} é a correta`}
          />
          <span className="admin-ex-id">{opcao.id}</span>
          <input
            type="text"
            className="admin-desafios-input admin-desafios-opcao-texto"
            placeholder="Texto da alternativa"
            value={opcao.texto ?? ""}
            onChange={(e) => atualizar(indice, { texto: e.target.value })}
          />
          <button
            type="button"
            className="admin-desafios-opcao-remover"
            onClick={() => onChange(opcoes.filter((_, i) => i !== indice))}
            aria-label="Remover alternativa"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        className="admin-desafios-adicionar"
        onClick={() => onChange([...opcoes, { id: novaLetra(opcoes), texto: "", correta: false }])}
      >
        + Adicionar alternativa
      </button>
    </div>
  );
}

// Lista de trechos de código ({ id, codigo, ... }), com reordenar/remover.
// `extra(item, atualizar)` desenha campos a mais de cada item (ex.: "código
// correto?" das cartas).
function ListaCodigos({ itens, onChange, prefixo, rotuloItem, rotuloAdicionar, novoItem = {}, extra }) {
  const atualizar = (indice, campos) =>
    onChange(itens.map((item, i) => (i === indice ? { ...item, ...campos } : item)));

  return (
    <div className="admin-ex-lista">
      {itens.length === 0 && <p className="admin-desafios-dica">Nenhum item ainda.</p>}
      {itens.map((item, indice) => (
        <div className="admin-ex-item" key={indice}>
          <div className="admin-ex-item-topo">
            <span className="admin-ex-item-titulo">
              {rotuloItem} {indice + 1} <span className="admin-ex-id">{item.id}</span>
            </span>
            <BotoesItem
              indice={indice}
              total={itens.length}
              onMover={(i, d) => onChange(mover(itens, i, d))}
              onRemover={(i) => onChange(itens.filter((_, j) => j !== i))}
              rotuloRemover={`Remover ${rotuloItem.toLowerCase()}`}
            />
          </div>
          <textarea
            className="admin-desafios-textarea admin-desafios-json"
            rows={Math.min(8, Math.max(2, String(item.codigo ?? "").split("\n").length + 1))}
            placeholder="Código"
            spellCheck={false}
            value={item.codigo ?? ""}
            onChange={(e) => atualizar(indice, { codigo: e.target.value })}
          />
          {extra?.(item, (campos) => atualizar(indice, campos))}
        </div>
      ))}
      <button
        type="button"
        className="admin-desafios-adicionar"
        onClick={() => onChange([...itens, { id: novoId(prefixo, itens), codigo: "", ...novoItem }])}
      >
        {rotuloAdicionar}
      </button>
    </div>
  );
}

// ---------- um editor por tipo ----------

function EditorMultipla({ exercicio, onChange, nome }) {
  return (
    <>
      <p className="admin-desafios-dica">Marque a bolinha da alternativa correta.</p>
      <ListaOpcoes opcoes={exercicio.opcoes ?? []} nome={nome} onChange={(opcoes) => onChange({ ...exercicio, opcoes })} />
    </>
  );
}

// Os blocos aparecem aqui NA ORDEM CORRETA (é isso que o admin edita). No
// banco, `blocos` guarda a ordem em que o jogo mostra e `ordemCorreta` o
// gabarito — os blocos já existentes mantêm a posição de exibição deles.
function EditorOrdenarBlocos({ exercicio, onChange }) {
  const blocos = exercicio.blocos ?? [];
  const porId = new Map(blocos.map((b) => [b.id, b]));
  const ordem = exercicio.ordemCorreta ?? [];
  const naOrdemCerta = [
    ...ordem.map((id) => porId.get(id)).filter(Boolean),
    ...blocos.filter((b) => !ordem.includes(b.id)),
  ];

  function alterar(lista) {
    const atualizados = new Map(lista.map((b) => [b.id, b]));
    const mantidos = blocos.filter((b) => atualizados.has(b.id)).map((b) => atualizados.get(b.id));
    const novos = lista.filter((b) => !porId.has(b.id));
    onChange({ ...exercicio, blocos: [...mantidos, ...novos], ordemCorreta: lista.map((b) => b.id) });
  }

  return (
    <>
      <p className="admin-desafios-dica">
        Cadastre os blocos <strong>na ordem correta</strong> — o jogo embaralha na hora de mostrar.
      </p>
      <ListaCodigos
        itens={naOrdemCerta}
        onChange={alterar}
        prefixo="b"
        rotuloItem="Bloco"
        rotuloAdicionar="+ Adicionar bloco"
        extra={(item, atualizar) => (
          <label className="admin-ex-linha">
            Nível de recuo (0 = sem recuo, 1 = dentro de um bloco)
            <input
              type="number"
              min="0"
              className="admin-desafios-input admin-desafios-input--curto"
              value={item.indent ?? 0}
              onChange={(e) => {
                const valor = Math.max(0, Number(e.target.value) || 0);
                atualizar({ indent: valor || undefined });
              }}
            />
          </label>
        )}
      />
    </>
  );
}

function EditorAvaliarCodigo({ exercicio, onChange }) {
  return (
    <>
      <p className="admin-desafios-dica">Cada carta é um código que o jogador julga como certo ou errado.</p>
      <ListaCodigos
        itens={exercicio.cartas ?? []}
        onChange={(cartas) => onChange({ ...exercicio, cartas })}
        prefixo="c"
        rotuloItem="Carta"
        rotuloAdicionar="+ Adicionar carta"
        novoItem={{ correta: true, explicacao: "" }}
        extra={(carta, atualizar) => (
          <>
            <label className="admin-ex-linha">
              <input
                type="checkbox"
                checked={carta.correta === true}
                onChange={(e) => atualizar({ correta: e.target.checked })}
              />
              Este código está <strong>{carta.correta ? "CORRETO" : "ERRADO"}</strong>
            </label>
            <textarea
              className="admin-desafios-textarea"
              rows={2}
              placeholder="Explicação mostrada depois da resposta (opcional)"
              value={carta.explicacao ?? ""}
              onChange={(e) => atualizar({ explicacao: e.target.value })}
            />
          </>
        )}
      />
    </>
  );
}

function EditorPocao({ exercicio, onChange }) {
  return (
    <>
      <p className="admin-desafios-label">Ingredientes corretos (na ordem da receita)</p>
      <ListaCodigos
        itens={exercicio.ingredientesCorretos ?? []}
        onChange={(ingredientesCorretos) => onChange({ ...exercicio, ingredientesCorretos })}
        prefixo="i"
        rotuloItem="Ingrediente"
        rotuloAdicionar="+ Adicionar ingrediente"
      />
      <p className="admin-desafios-label admin-ex-separador">Distratores (ingredientes errados)</p>
      <ListaCodigos
        itens={exercicio.distratores ?? []}
        // sem distratores = campo fora do objeto (o backend recusa lista vazia)
        onChange={(distratores) => onChange({ ...exercicio, distratores: distratores.length ? distratores : undefined })}
        prefixo="d"
        rotuloItem="Distrator"
        rotuloAdicionar="+ Adicionar distrator"
      />
    </>
  );
}

function EditorChefe({ exercicio, onChange, nome }) {
  const perguntas = exercicio.perguntas ?? [];
  const atualizarPergunta = (indice, campos) =>
    onChange({ ...exercicio, perguntas: perguntas.map((p, i) => (i === indice ? { ...p, ...campos } : p)) });

  return (
    <>
      <label className="admin-desafios-label" htmlFor={`${nome}-vidas`}>
        Acertos necessários para vencer o chefe
      </label>
      <input
        id={`${nome}-vidas`}
        type="number"
        min="1"
        className="admin-desafios-input admin-desafios-input--curto"
        value={exercicio.vidasNecessarias ?? ""}
        onChange={(e) => onChange({ ...exercicio, vidasNecessarias: Number(e.target.value) || 0 })}
      />
      {perguntas.map((pergunta, indice) => (
        <div className="admin-ex-item" key={indice}>
          <div className="admin-ex-item-topo">
            <span className="admin-ex-item-titulo">
              Pergunta {indice + 1} <span className="admin-ex-id">{pergunta.id}</span>
            </span>
            <BotoesItem
              indice={indice}
              total={perguntas.length}
              onMover={(i, d) => onChange({ ...exercicio, perguntas: mover(perguntas, i, d) })}
              onRemover={(i) => onChange({ ...exercicio, perguntas: perguntas.filter((_, j) => j !== i) })}
              rotuloRemover="Remover pergunta"
            />
          </div>
          <input
            type="text"
            className="admin-desafios-input"
            placeholder="Enunciado da pergunta"
            value={pergunta.enunciado ?? ""}
            onChange={(e) => atualizarPergunta(indice, { enunciado: e.target.value })}
          />
          <textarea
            className="admin-desafios-textarea admin-desafios-json"
            rows={2}
            placeholder="Código mostrado na pergunta (opcional)"
            spellCheck={false}
            value={pergunta.codigo ?? ""}
            onChange={(e) => atualizarPergunta(indice, { codigo: e.target.value || undefined })}
          />
          <ListaOpcoes
            opcoes={pergunta.opcoes ?? []}
            nome={`${nome}-p${indice}`}
            onChange={(opcoes) => atualizarPergunta(indice, { opcoes })}
          />
        </div>
      ))}
      <button
        type="button"
        className="admin-desafios-adicionar"
        onClick={() =>
          onChange({
            ...exercicio,
            perguntas: [
              ...perguntas,
              {
                id: novoId("p", perguntas),
                enunciado: "",
                opcoes: [
                  { id: "a", texto: "", correta: true },
                  { id: "b", texto: "", correta: false },
                ],
              },
            ],
          })
        }
      >
        + Adicionar pergunta
      </button>
    </>
  );
}

function EditorDissertativa({ exercicio, onChange }) {
  const criterios = exercicio.criterios ?? [];
  const alterarCriterios = (lista) => onChange({ ...exercicio, criterios: lista });

  return (
    <>
      <p className="admin-desafios-dica">
        A resposta do jogador é corrigida pela IA com base nestes critérios (eles nunca aparecem pro jogador).
      </p>
      <p className="admin-desafios-label">Critérios de correção</p>
      {criterios.map((criterio, indice) => (
        <div className="admin-desafios-opcao" key={indice}>
          <span className="admin-ex-id">{indice + 1}</span>
          <textarea
            className="admin-desafios-textarea admin-desafios-opcao-texto"
            rows={2}
            value={criterio}
            onChange={(e) => alterarCriterios(criterios.map((c, i) => (i === indice ? e.target.value : c)))}
          />
          <button
            type="button"
            className="admin-desafios-opcao-remover"
            onClick={() => alterarCriterios(criterios.filter((_, i) => i !== indice))}
            aria-label="Remover critério"
          >
            ✕
          </button>
        </div>
      ))}
      <button type="button" className="admin-desafios-adicionar" onClick={() => alterarCriterios([...criterios, ""])}>
        + Adicionar critério
      </button>

      <label className="admin-desafios-label admin-ex-separador">Resposta de referência (para a IA)</label>
      <textarea
        className="admin-desafios-textarea"
        rows={4}
        value={exercicio.respostaReferencia ?? ""}
        onChange={(e) => onChange({ ...exercicio, respostaReferencia: e.target.value })}
      />
    </>
  );
}

const EDITORES = {
  multipla_escolha: EditorMultipla,
  ordenar_blocos: EditorOrdenarBlocos,
  avaliar_codigo: EditorAvaliarCodigo,
  montar_pocao: EditorPocao,
  batalha_chefe: EditorChefe,
  dissertativa: EditorDissertativa,
};

// `mostrarCodigo`: campo "código mostrado ao jogador" (etapas do portal 3 e
// dissertativas usam; as telas de etapa única do portal 1 não).
export default function EditorExercicio({ exercicio, onChange, nome, mostrarCodigo = false }) {
  const Editor = EDITORES[exercicio?.tipo];

  return (
    <>
      {mostrarCodigo && (
        <>
          <label className="admin-desafios-label" htmlFor={`${nome}-codigo`}>
            Código mostrado ao jogador (opcional)
          </label>
          <textarea
            id={`${nome}-codigo`}
            className="admin-desafios-textarea admin-desafios-json"
            rows={Math.min(10, Math.max(3, String(exercicio.codigo ?? "").split("\n").length + 1))}
            spellCheck={false}
            value={exercicio.codigo ?? ""}
            onChange={(e) => onChange({ ...exercicio, codigo: e.target.value || undefined })}
          />
        </>
      )}
      {Editor ? (
        <Editor exercicio={exercicio} onChange={onChange} nome={nome} />
      ) : (
        <p className="admin-desafios-mensagem--erro">
          Tipo de exercício desconhecido ("{String(exercicio?.tipo)}") — use o modo JSON para editar.
        </p>
      )}
    </>
  );
}
