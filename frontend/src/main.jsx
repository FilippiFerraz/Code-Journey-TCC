import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@hackernoon/pixel-icon-library/fonts/iconfont.css'
import '@fontsource/silkscreen/latin-400.css'
import '@fontsource/silkscreen/latin-700.css'
import './index.css'
// Todo o CSS, na ordem de sempre (ver estilos.js)
import './estilos'
import App from './App.jsx'
import { carregarTela } from './telas'
import { adiantarLeituras } from './services/adiantarLeituras'
import { iniciarMusica } from './utils/musica'

// Quem já está logado e abre direto na Home: começa a baixar o código da tela
// JÁ, em paralelo com o resto (antes era em fila: este pacote -> checagem da
// sessão -> código da Home). O mapa NÃO é adiantado aqui de propósito: medido
// em 4G lenta, baixá-lo cedo disputava a rede com a prévia de 7 KB do mapa e a
// tela ficava vazia por mais tempo (prévia em 2,3 s virava tela vazia até 4,7 s).
function temToken() {
  try {
    return Boolean(localStorage.getItem('token'))
  } catch {
    return false
  }
}
if (temToken() && window.location.pathname === '/home') {
  carregarTela('Home')
}
// Logado: as leituras da API que a tela vai fazer saem agora, em paralelo
// com o download do código dela (ver services/adiantarLeituras.js).
if (temToken()) {
  adiantarLeituras(window.location.pathname)
}

// Música de fundo: os navegadores só deixam tocar som depois de uma
// interação do jogador — começa no primeiro clique/toque/tecla (ver
// utils/musica.js).
function comecarMusica() {
  iniciarMusica()
  window.removeEventListener('pointerdown', comecarMusica)
  window.removeEventListener('keydown', comecarMusica)
}
window.addEventListener('pointerdown', comecarMusica)
window.addEventListener('keydown', comecarMusica)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
