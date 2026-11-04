import { Link, useNavigate } from "react-router-dom";
import {
  CADASTRO_NAO_CONFIRMADO_DIAS,
  CONTATO_PRIVACIDADE,
  CONTROLADOR,
  DATA_VIGENCIA,
  IDADE_MINIMA,
  RETENCAO_HISTORICO_LOGIN_DIAS,
  VERSAO_TERMOS,
} from "../../data/privacidade";
import "./Privacidade.css";

// Política de Privacidade e Termos de Uso (LGPD — Lei 13.709/2018).
// Linguagem simples de propósito: boa parte dos jogadores é adolescente
// (LGPD art. 14, §6º). O texto descreve o que o código FAZ — mudou o
// tratamento de dados no backend, atualize aqui (e VERSAO_TERMOS).
// Páginas públicas: abrem com ou sem login (links no cadastro, no login e
// nas configurações).

const MESES_HISTORICO = Math.round(RETENCAO_HISTORICO_LOGIN_DIAS / 30);

function Politica() {
  return (
    <>
      <h1>Política de Privacidade</h1>
      <p className="priv-vigencia">
        Vigente desde {DATA_VIGENCIA} (versão {VERSAO_TERMOS})
      </p>

      <section>
        <h2>Resumo rápido</h2>
        <ul>
          <li>Pedimos só o necessário para o jogo funcionar: nome de usuário, e-mail, idade e senha.</li>
          <li>Não vendemos seus dados, não mostramos anúncios e não usamos rastreadores.</li>
          <li>Você pode baixar uma cópia dos seus dados ou excluir sua conta quando quiser, em Configurações &gt; Conta.</li>
        </ul>
      </section>

      <section>
        <h2>1. Quem cuida dos seus dados</h2>
        <p>
          O Code Journey é um jogo educativo para aprender JavaScript, criado como Trabalho de Conclusão de Curso.
          O responsável pelos seus dados (o "controlador", na LGPD) é: <strong>{CONTROLADOR}</strong>.
        </p>
        <p>
          Dúvidas, pedidos ou reclamações sobre privacidade: <strong>{CONTATO_PRIVACIDADE}</strong> (encarregado
          pelo tratamento de dados pessoais).
        </p>
      </section>

      <section>
        <h2>2. Quais dados coletamos</h2>
        <h3>Quando você cria a conta</h3>
        <ul>
          <li><strong>Nome de usuário</strong>: aparece no jogo, no ranking e no seu perfil.</li>
          <li><strong>E-mail</strong>: para entrar, confirmar a conta e recuperar a senha. Não aparece para outros jogadores.</li>
          <li><strong>Idade</strong>: para conferir a idade mínima de {IDADE_MINIMA} anos e para estatísticas gerais (sem identificar ninguém).</li>
          <li><strong>Senha</strong>: guardada só de forma criptografada (hash). Nem a equipe consegue ver a sua senha.</li>
        </ul>
        <h3>Enquanto você joga</h3>
        <ul>
          <li>Seu progresso: desafios vencidos, tentativas, tempo de resposta, XP, moedas, itens e baús.</li>
          <li>Seu personagem: nome, aparência e itens equipados.</li>
          <li>Preferências: fundo do perfil, se a sua posição aparece no ranking, se você já viu o tutorial.</li>
          <li>
            Respostas escritas nos desafios dissertativos (veja a seção 4). <strong>Não escreva dados pessoais nas
            respostas.</strong>
          </li>
        </ul>
        <h3>Para a segurança da sua conta</h3>
        <ul>
          <li>
            Histórico de login: data e hora, endereço IP, navegador/dispositivo e se a tentativa deu certo. Serve para
            detectar invasões e atender à lei (Marco Civil da Internet, art. 15).
          </li>
        </ul>
        <h3>No seu navegador</h3>
        <ul>
          <li>
            Guardamos no armazenamento local do navegador (localStorage) o seu login e preferências como o volume da
            música. Não usamos cookies de propaganda nem de rastreamento.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. Para que usamos e com qual base legal</h2>
        <ul>
          <li>
            <strong>Fazer o jogo funcionar</strong> (conta, progresso, ranking, e-mails de confirmação e de
            recuperação de senha): execução do serviço que você pediu ao criar a conta (LGPD, art. 7º, V).
          </li>
          <li>
            <strong>Proteger sua conta e o jogo</strong> (histórico de login, limite de tentativas, prevenção de
            fraudes no ranking): cumprimento de obrigação legal (art. 7º, II) e legítimo interesse (art. 7º, IX).
          </li>
          <li>
            <strong>Melhorar o jogo</strong>: estatísticas gerais, sem identificar jogadores (quantos cadastros,
            faixas de idade, desafios mais difíceis), vistas só pela equipe no painel de administração.
          </li>
        </ul>
        <p>Não usamos seus dados para publicidade, não vendemos nem alugamos dados a ninguém.</p>
      </section>

      <section>
        <h2>4. Com quem os dados são compartilhados</h2>
        <p>Só com os serviços necessários para o jogo existir, que tratam os dados em nosso nome:</p>
        <ul>
          <li><strong>Vercel</strong> (hospedagem do site e do servidor). Os servidores do jogo ficam em São Paulo.</li>
          <li><strong>Neon</strong> (banco de dados), em servidores em São Paulo (Amazon Web Services).</li>
          <li><strong>Google (Gmail)</strong>, para enviar os e-mails de confirmação, recuperação de senha e troca de e-mail.</li>
          <li>
            <strong>Google (Gemini) ou Anthropic (Claude)</strong>, inteligências artificiais que corrigem as respostas
            escritas dos desafios dissertativos. Enviamos <strong>apenas o texto da resposta e o enunciado</strong>, sem
            seu nome, e-mail ou qualquer dado da conta.
          </li>
        </ul>
        <p>
          Algumas dessas empresas têm sede ou servidores fora do Brasil (principalmente nos Estados Unidos). Essa
          transferência internacional segue as garantias previstas no art. 33 da LGPD.
        </p>
        <p>
          <strong>Outros jogadores</strong> veem apenas: seu nome de usuário, seu @ (criado a partir do nome, nunca do
          e-mail), XP, posição no ranking (você pode esconder), conquistas e os itens do seu personagem.
        </p>
      </section>

      <section>
        <h2>5. Por quanto tempo guardamos</h2>
        <ul>
          <li><strong>Dados da conta e do jogo</strong>: enquanto a conta existir.</li>
          <li>
            <strong>Ao excluir a conta</strong>: nome, e-mail, idade e senha são apagados na hora, sem volta. O que
            sobra (XP e progresso) deixa de identificar você e vira só estatística.
          </li>
          <li>
            <strong>Histórico de login</strong>: {MESES_HISTORICO} meses (o mínimo exigido pelo Marco Civil da
            Internet). Depois disso, é apagado automaticamente.
          </li>
          <li>
            <strong>Cadastro nunca confirmado por e-mail</strong>: apagado depois de {CADASTRO_NAO_CONFIRMADO_DIAS} dias.
          </li>
          <li><strong>Códigos enviados por e-mail</strong>: valem 15 minutos e só podem ser usados uma vez.</li>
        </ul>
      </section>

      <section>
        <h2>6. Seus direitos</h2>
        <p>Pela LGPD (art. 18), você pode, a qualquer momento:</p>
        <ul>
          <li><strong>Ver e baixar seus dados</strong>: Configurações &gt; Conta &gt; "Baixar meus dados" (arquivo JSON, que também serve para levar seus dados para outro serviço).</li>
          <li><strong>Corrigir seus dados</strong>: mude nome e e-mail em Configurações &gt; Conta.</li>
          <li><strong>Excluir sua conta e seus dados</strong>: Configurações &gt; Conta &gt; Opções avançadas.</li>
          <li><strong>Esconder sua posição no ranking</strong>, no seu perfil.</li>
          <li><strong>Saber com quem compartilhamos</strong>: está na seção 4.</li>
          <li>
            <strong>Fazer qualquer outro pedido ou reclamação</strong>: escreva para {CONTATO_PRIVACIDADE}. Você também
            pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD), em gov.br/anpd.
          </li>
        </ul>
      </section>

      <section>
        <h2>7. Crianças e adolescentes</h2>
        <p>
          O Code Journey é para quem tem <strong>{IDADE_MINIMA} anos ou mais</strong>. Não aceitamos cadastro de
          pessoas mais novas. Se descobrirmos uma conta assim, ela será excluída.
        </p>
        <p>
          Para adolescentes, tratamos os dados sempre no seu melhor interesse (LGPD, art. 14): pedimos o mínimo, não
          mostramos anúncios, não fazemos perfil para propaganda e explicamos tudo nesta página em linguagem simples.
          Recomendamos que pais ou responsáveis conheçam esta política junto com o adolescente.
        </p>
      </section>

      <section>
        <h2>8. Como protegemos</h2>
        <ul>
          <li>Conexão sempre criptografada (HTTPS) e senhas guardadas só como hash.</li>
          <li>Limite de tentativas no login e nos códigos enviados por e-mail.</li>
          <li>Sessões encerradas automaticamente quando a senha é redefinida.</li>
          <li>Painel de administração restrito à equipe, com registro de cada ação feita.</li>
        </ul>
        <p>
          Se acontecer um incidente de segurança que possa causar risco a você, avisaremos os afetados e a ANPD
          (LGPD, art. 48).
        </p>
      </section>

      <section>
        <h2>9. Mudanças nesta política</h2>
        <p>
          Se esta política mudar de forma importante, avisaremos no jogo e a data de vigência acima será atualizada.
        </p>
      </section>
    </>
  );
}

function Termos() {
  return (
    <>
      <h1>Termos de Uso</h1>
      <p className="priv-vigencia">
        Vigentes desde {DATA_VIGENCIA} (versão {VERSAO_TERMOS})
      </p>

      <section>
        <h2>1. O que é o Code Journey</h2>
        <p>
          Um jogo educativo e gratuito para aprender JavaScript, desenvolvido como Trabalho de Conclusão de Curso. Ao
          criar uma conta, você concorda com estes termos e com a <Link to="/privacidade">Política de Privacidade</Link>.
        </p>
      </section>

      <section>
        <h2>2. Sua conta</h2>
        <ul>
          <li>Você precisa ter pelo menos {IDADE_MINIMA} anos.</li>
          <li>Use informações verdadeiras e um e-mail que seja seu.</li>
          <li>A conta é pessoal: não compartilhe sua senha. Se desconfiar de algo, redefina a senha.</li>
        </ul>
      </section>

      <section>
        <h2>3. Regras de convivência</h2>
        <ul>
          <li>Não use nomes ofensivos, discriminatórios ou que se passem por outra pessoa.</li>
          <li>Não tente burlar o jogo (explorar falhas, automatizar respostas, inflar o ranking).</li>
          <li>Não escreva conteúdo ofensivo nem dados pessoais nas respostas dos desafios.</li>
          <li>Encontrou uma falha de segurança? Conte para a equipe em vez de explorá-la.</li>
        </ul>
        <p>Quem descumprir as regras pode ter a conta desativada pela equipe.</p>
      </section>

      <section>
        <h2>4. Moedas, itens e ranking</h2>
        <p>
          Moedas, XP, itens e baús são virtuais, existem só dentro do jogo e não têm valor em dinheiro. Nada no jogo é
          vendido por dinheiro real.
        </p>
      </section>

      <section>
        <h2>5. Conteúdo educativo</h2>
        <p>
          Os desafios e as correções feitas por inteligência artificial têm fins de aprendizado e podem conter erros. O
          jogo pode mudar, ficar fora do ar ou ser encerrado, por ser um projeto acadêmico.
        </p>
      </section>

      <section>
        <h2>6. Excluir a conta</h2>
        <p>
          Você pode excluir sua conta quando quiser, em Configurações &gt; Conta. Seus dados pessoais são apagados como
          explicado na <Link to="/privacidade">Política de Privacidade</Link>.
        </p>
      </section>

      <section>
        <h2>7. Contato e lei aplicável</h2>
        <p>
          Dúvidas: {CONTATO_PRIVACIDADE}. Estes termos seguem as leis brasileiras, incluindo a Lei Geral de Proteção de
          Dados (Lei 13.709/2018) e o Marco Civil da Internet (Lei 12.965/2014).
        </p>
      </section>
    </>
  );
}

export default function Privacidade({ documento = "politica" }) {
  const navigate = useNavigate();
  return (
    <div className="priv-tela">
      <article className="priv-cartao">
        <nav className="priv-topo" aria-label="Documentos">
          <button type="button" className="priv-voltar" onClick={() => navigate(-1)}>
            ← Voltar
          </button>
          <span className="priv-abas">
            <Link to="/privacidade" className={documento === "politica" ? "priv-aba priv-aba--ativa" : "priv-aba"}>
              Privacidade
            </Link>
            <Link to="/termos" className={documento === "termos" ? "priv-aba priv-aba--ativa" : "priv-aba"}>
              Termos de Uso
            </Link>
          </span>
        </nav>
        {documento === "termos" ? <Termos /> : <Politica />}
      </article>
    </div>
  );
}
