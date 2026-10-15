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

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
