import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './components/ThemeProvider' // (Modo Escuro)
import { BackgroundProvider } from './contexts/BackgroundProvider' // (Temas de Fundo)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Envolve com o provedor de Modo Escuro */}
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {/* Envolve com o provedor de Tema de Fundo */}
      <BackgroundProvider>
        <App />
      </BackgroundProvider>
    </ThemeProvider>
  </StrictMode>,
)