import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@hackernoon/pixel-icon-library/fonts/iconfont.css'
import '@fontsource/silkscreen/latin-400.css'
import '@fontsource/silkscreen/latin-700.css'
import './index.css'
// Todo o CSS, na ordem de sempre (ver estilos.js)
import './estilos'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
