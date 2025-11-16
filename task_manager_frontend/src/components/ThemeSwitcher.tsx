import React from 'react';
import { useTheme } from 'next-themes';
import { useBackground, BackgroundTheme } from '@/contexts/BackgroundProvider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { background, setBackground } = useBackground();

  const backgroundThemes: { value: BackgroundTheme, label: string }[] = [
    { value: 'default', label: 'Padrão' },
    { value: 'theme-1', label: 'Tema 1' },
    { value: 'theme-2', label: 'Tema 2' },
    { value: 'theme-3', label: 'Tema 3' },
    { value: 'theme-4', label: 'Tema 4' },
    { value: 'theme-5', label: 'Tema 5' },
  ];

  return (
    <div className="flex items-center gap-2">
      {/* Seletor de Modo (Light/Dark) */}
      <Select value={theme} onValueChange={setTheme}>
        <SelectTrigger className="w-[110px] bg-white/50 dark:bg-zinc-800/50">
          <SelectValue placeholder="Modo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="light">Claro</SelectItem>
          <SelectItem value="dark">Escuro</SelectItem>
          <SelectItem value="system">Sistema</SelectItem>
        </SelectContent>
      </Select>
      
      {/* Seletor de Background */}
      <Select value={background} onValueChange={(value) => setBackground(value as BackgroundTheme)}>
        <SelectTrigger className="w-[130px] bg-white/50 dark:bg-zinc-800/50">
          <SelectValue placeholder="Fundo" />
        </SelectTrigger>
        <SelectContent>
          {backgroundThemes.map((bg) => (
            <SelectItem key={bg.value} value={bg.value}>{bg.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};