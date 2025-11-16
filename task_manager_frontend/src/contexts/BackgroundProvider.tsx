import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

// Define os nomes dos temas que você usará.
export type BackgroundTheme = 'default' | 'theme-1' | 'theme-2' | 'theme-3' | 'theme-4' | 'theme-5';

interface BackgroundContextType {
  background: BackgroundTheme;
  setBackground: (theme: BackgroundTheme) => void;
}

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined);

export const BackgroundProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [background, setBackground] = useState<BackgroundTheme>(() => {
    // Tenta carregar o tema salvo no localStorage
    return (localStorage.getItem('background-theme') as BackgroundTheme) || 'default';
  });

  // Salva a escolha no localStorage sempre que ela mudar
  useEffect(() => {
    localStorage.setItem('background-theme', background);
  }, [background]);

  return (
    <BackgroundContext.Provider value={{ background, setBackground }}>
      {children}
    </BackgroundContext.Provider>
  );
};

// Hook customizado para facilitar o uso do contexto
export const useBackground = (): BackgroundContextType => {
  const context = useContext(BackgroundContext);
  if (!context) {
    throw new Error('useBackground deve ser usado dentro de um BackgroundProvider');
  }
  return context;
};