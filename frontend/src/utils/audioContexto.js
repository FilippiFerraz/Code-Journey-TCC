// AudioContext único do app (Web Audio), usado pela cutscene de introdução.
//
// Navegadores só deixam tocar som depois de uma interação do jogador. A
// cutscene abre na Home logo depois do clique em "Entrar" / "Confirmar
// e-mail" — então essas telas chamam desbloquearAudio() DENTRO do clique,
// e a cutscene encontra o contexto já liberado (no iPhone isso é obrigatório:
// lá o "desbloqueio" só vale se acontecer no próprio evento de clique).
let contexto = null;

export function obterAudioContexto() {
  if (!contexto) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      contexto = new AC();
    } catch {
      return null;
    }
  }
  return contexto;
}

// Chamar dentro de um evento de clique/tecla. Toca um buffer mudo de 1
// amostra só pra "acordar" o contexto. Nunca lança erro: som é enfeite.
export function desbloquearAudio() {
  try {
    const ac = obterAudioContexto();
    if (!ac) return;
    if (ac.state === "suspended") ac.resume().catch(() => {});
    const fonte = ac.createBufferSource();
    fonte.buffer = ac.createBuffer(1, 1, 22050);
    fonte.connect(ac.destination);
    fonte.start(0);
  } catch {
    // ignora
  }
}
