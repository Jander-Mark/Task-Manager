import React from 'react';
import { useBackground, BackgroundTheme } from '@/contexts/BackgroundProvider';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { ThemeSwitcher } from './ThemeSwitcher'; // O seletor que acabamos de criar

// Navbar que será usada em todas as páginas logadas
const AppNavbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation(); // Para destacar o link ativo

  const getLinkClass = (path: string) => {
    return location.pathname === path
      ? 'inline-flex items-center border-b-2 border-blue-500 px-1 pt-1 text-sm font-medium text-gray-900 dark:text-gray-100'
      : 'inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200';
  };

  return (
    <nav className="bg-white/80 shadow backdrop-blur-sm dark:bg-zinc-900/80 sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link to="/dashboard" className={getLinkClass("/dashboard")}>
                Dashboard
              </Link>
              <Link to="/tasks" className={getLinkClass("/tasks")}>
                Tarefas
              </Link>
              <Link to="/categories" className={getLinkClass("/categories")}>
                Categorias
              </Link>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center gap-4">
            {/* O seletor de temas fica aqui */}
            <ThemeSwitcher />
            
            <div className="relative ml-3">
              <div className="flex items-center">
                <span className="mr-4 text-sm font-medium text-gray-700 dark:text-gray-300">Olá, {user?.nome}</span>
                <button
                  onClick={logout}
                  className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                  Sair
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

// O Layout principal que aplica o fundo dinâmico
export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { background } = useBackground();

  // Mapeia o estado do contexto para as classes do Tailwind que você configurou
  const backgroundClasses: Record<BackgroundTheme, string> = {
    'default': 'bg-gray-50 dark:bg-zinc-950', // Cor sólida padrão
    'theme-1': 'bg-theme-1 bg-cover bg-center bg-fixed',
    'theme-2': 'bg-theme-2 bg-cover bg-center bg-fixed',
    'theme-3': 'bg-theme-3 bg-cover bg-center bg-fixed',
    'theme-4': 'bg-theme-4 bg-cover bg-center bg-fixed',
    'theme-5': 'bg-theme-5 bg-cover bg-center bg-fixed',
  };

  return (
    // Aplicamos a classe de fundo dinâmico aqui
    <div className={cn("min-h-screen", backgroundClasses[background])}>
      <AppNavbar />
      {children}
    </div>
  );
};