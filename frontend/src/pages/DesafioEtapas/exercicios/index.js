// Um componente por tipo de exercício, cada um no visual dos desafios
// prontos dos outros portais. Todos recebem da página (DesafioEtapas.jsx):
//   etapa            dados públicos da etapa (sem gabarito), vindos da API
//   travado          true durante animações/envio
//   emErro           a última resposta foi errada (destaque visual)
//   responder(r)     envia a resposta completa da etapa (POST /api/progresso)
//   verificar(d)     confere UMA ação no servidor -> Promise<true|false|null>
//                    (null = falha de conexão, já avisada pela página)
//   sofrerGolpe()    tira uma vida do jogador (erro que penaliza)
//   limparErro()     tira o destaque de erro quando o jogador mexe de novo
// Pra redesenhar um tipo, basta trocar o componente dele aqui.
import MultiplaEscolha from "./MultiplaEscolha";
import OrdenarBlocos from "./OrdenarBlocos";
import AvaliarCodigo from "./AvaliarCodigo";
import MontarPocao from "./MontarPocao";
import BatalhaChefe from "./BatalhaChefe";
import Dissertativa from "./Dissertativa";

export const EXERCICIOS = {
  multipla_escolha: MultiplaEscolha,
  ordenar_blocos: OrdenarBlocos,
  avaliar_codigo: AvaliarCodigo,
  montar_pocao: MontarPocao,
  batalha_chefe: BatalhaChefe,
  dissertativa: Dissertativa,
};

// Título do painel de cada tipo — mesmos textos de ResolverDesafio.jsx.
export const TITULO_PAINEL = {
  multipla_escolha: "Escolha a resposta:",
  ordenar_blocos: "Monte o código:",
  avaliar_codigo: "Avalie o código:",
  montar_pocao: "Monte a poção:",
  batalha_chefe: "Batalha contra o chefe:",
  dissertativa: "Escreva sua resposta:",
};
