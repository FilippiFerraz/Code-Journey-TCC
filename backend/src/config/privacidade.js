// Regras de privacidade (LGPD — Lei 13.709/2018) usadas pelo backend. O
// texto que o jogador lê fica no frontend (pages/Privacidade) e PRECISA
// bater com estes números — mudou aqui, atualize lá e suba VERSAO_TERMOS.

// Versão dos Termos de Uso / Política de Privacidade aceita no cadastro.
// Mudança relevante no texto = nova versão (data da publicação).
const VERSAO_TERMOS = "2026-11-04";

// Histórico de login (data/hora, IP, navegador): o Marco Civil da Internet
// (Lei 12.965/2014, art. 15) obriga a guardar registros de acesso por 6
// meses; a LGPD (art. 15 e 16) manda apagar quando a finalidade acaba.
// Guardamos exatamente o mínimo legal e apagamos depois.
const RETENCAO_HISTORICO_LOGIN_DIAS = 180;

// Cadastro nunca confirmado por e-mail: a pessoa não chegou a usar o jogo,
// então os dados dela (nome, e-mail, idade) não têm mais finalidade.
const CADASTRO_NAO_CONFIRMADO_DIAS = 30;

module.exports = { VERSAO_TERMOS, RETENCAO_HISTORICO_LOGIN_DIAS, CADASTRO_NAO_CONFIRMADO_DIAS };
