import React from 'react';
import { useBackground, BackgroundTheme } from '@/contexts/BackgroundProvider';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { ThemeSwitcher } from './ThemeSwitcher';
import { Menu } from 'lucide-react'; // Ícone do menu
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden'; // Para acessibilidade do Sheet

const AppNavbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const getLinkClass = (path: string) => {
    return location.pathname === path
      ? 'inline-flex items-center border-b-2 border-blue-500 px-1 pt-1 text-sm font-medium text-gray-900 dark:text-gray-100'
      : 'inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200';
  };

  const getMobileLinkClass = (path: string) => {
    return location.pathname === path
      ? 'block px-3 py-2 rounded-md text-base font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
      : 'block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-zinc-800';
  };

  const NavLinks = () => (
    <>
      <Link to="/dashboard" className={getLinkClass("/dashboard")}>
        Dashboard
      </Link>
      <Link to="/tasks" className={getLinkClass("/tasks")}>
        Tarefas
      </Link>
      <Link to="/categories" className={getLinkClass("/categories")}>
        Categorias
      </Link>
    </>
  );

  return (
    <nav className="bg-white/80 shadow backdrop-blur-sm dark:bg-zinc-900/80 sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          
          {/* Lado Esquerdo (Desktop) */}
          <div className="flex">
            {/* Logo ou Nome do App (Opcional) */}
            <div className="flex flex-shrink-0 items-center mr-4">
               <span className="font-bold text-xl text-blue-600 dark:text-blue-400">TM</span>
            </div>
            
            {/* Links Desktop (Somente visível em telas sm ou maiores) */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <NavLinks />
            </div>
          </div>

          {/* Lado Direito (Desktop) */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center gap-4">
            <ThemeSwitcher />
            <div className="relative ml-3">
              <div className="flex items-center">
                <span className="mr-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                  {user?.nome?.split(' ')[0]} {/* Mostra só o primeiro nome */}
                </span>
                <button
                  onClick={logout}
                  className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
                >
                  Sair
                </button>
              </div>
            </div>
          </div>

          {/* MENU MOBILE (Visível apenas em telas pequenas) */}
          <div className="flex items-center sm:hidden">
             <ThemeSwitcher /> {/* Mantém o switcher acessível no mobile fora do menu */}
             
             <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="ml-2">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Abrir menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                {/* Título oculto para acessibilidade (obrigatório no shadcn novo) */}
                <VisuallyHidden.Root>
                    <SheetTitle>Menu de Navegação</SheetTitle>
                    <SheetDescription>Links para navegar no aplicativo</SheetDescription>
                </VisuallyHidden.Root>

                <div className="mt-6 flex flex-col space-y-4">
                    <div className="px-3 mb-4">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Olá, {user?.nome}
                        </p>
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                        <Link to="/dashboard" className={getMobileLinkClass("/dashboard")}>
                            Dashboard
                        </Link>
                        <Link to="/tasks" className={getMobileLinkClass("/tasks")}>
                            Tarefas
                        </Link>
                        <Link to="/categories" className={getMobileLinkClass("/categories")}>
                            Categorias
                        </Link>
                    </div>

                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                            onClick={logout}
                            className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                        >
                            Sair
                        </button>
                    </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

        </div>
      </div>
    </nav>
  );
};

// O Layout principal que aplica o fundo dinâmico
export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { background } = useBackground();

  const backgroundClasses: Record<BackgroundTheme, string> = {
    'default': 'bg-gray-50 dark:bg-zinc-950',
    'theme-1': 'bg-theme-1 bg-cover bg-center bg-fixed',
    'theme-2': 'bg-theme-2 bg-cover bg-center bg-fixed',
    'theme-3': 'bg-theme-3 bg-cover bg-center bg-fixed',
    'theme-4': 'bg-theme-4 bg-cover bg-center bg-fixed',
    'theme-5': 'bg-theme-5 bg-cover bg-center bg-fixed',
  };

  return (
    <div className={cn("min-h-screen flex flex-col", backgroundClasses[background])}>
      <AppNavbar />
      {/* Adicionamos flex-1 para garantir que o conteúdo ocupe a altura restante */}
      <div className="flex-1 w-full">
          {children}
      </div>
    </div>
  );
};