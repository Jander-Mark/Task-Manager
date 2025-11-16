# Front-end - Gerenciador de Tarefas (React + Vite)

Este é o aplicativo cliente (front-end) para o projeto Gerenciador de Tarefas. Ele é construído com React (usando Vite), TypeScript e estilizado com Tailwind CSS e shadcn/ui.

## 📋 Funcionalidades

* **Autenticação Completa:** Fluxos de Login, Cadastro e "Esqueci minha senha" integrados com o Firebase Auth.
* **Dashboard:** Visão geral com estatísticas e tarefas mais urgentes.
* **Gestão de Tarefas:** Interface com modais para Criar, Editar e Excluir tarefas, com validação de formulário.
* **Gestão de Categorias:** Interface com modais para Criar, Editar e Excluir categorias.
* **Temas:**
    * **Modo Claro / Escuro:** Alternância de tema gerenciada por `next-themes`.
    * **Fundos de Imagem:** 5 temas de fundo selecionáveis (estilo Trello) com persistência no LocalStorage.
* **Layout Responsivo:** Funciona em dispositivos móveis e desktop.

## 🛠️ Stack de Tecnologias

* **[Vite](https://vitejs.dev/)**: Build tool rápida para desenvolvimento front-end.
* **[React](https://reactjs.org/)**: Biblioteca principal da UI.
* **[TypeScript](https://www.typescriptlang.org/)**: Superset do JavaScript para tipagem estática.
* **[Tailwind CSS](https://tailwindcss.com/)**: Framework de estilização utility-first.
* **[shadcn/ui](https://ui.shadcn.com/)**: Coleção de componentes React acessíveis.
* **[Firebase Client SDK](https://firebase.google.com/docs/web)**: Para autenticação de usuário.
* **[Axios](https://axios-http.com/)**: Cliente HTTP para se comunicar com a API.
* **[Zod](https://zod.dev/) & [React Hook Form](https://react-hook-form.com/)**: Para validação de formulários.
* **[next-themes](https://github.com/pacocoursey/next-themes)**: Para gerenciamento de tema (Claro/Escuro).

## 📁 Estrutura de Pastas (Front-end)

```
task_manager_frontend/
├── public/                 # Assets estáticos
│   ├── auth-bg.jpg         # Fundo das telas de login/cadastro
│   ├── bg-theme-1.jpg
│   └── ... (outros temas)
│
├── src/
│   ├── components/
│   │   ├── ui/               # Componentes shadcn/ui (Button, Card, etc.)
│   │   ├── AppLayout.tsx     # Layout principal (Navbar + Container) para telas logadas
│   │   ├── ThemeProvider.tsx # Wrapper do next-themes (Modo Claro/Escuro)
│   │   └── ThemeSwitcher.tsx # Seletor de Modo e Tema
│   │
│   ├── contexts/
│   │   ├── AuthContext.tsx       # Contexto global para Autenticação
│   │   └── BackgroundProvider.tsx  # Contexto global para Temas de Fundo
│   │
│   ├── lib/
│   │   └── utils.ts        # Função helper `cn` do shadcn
│   │
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── Login.tsx
│   │   │   └── Register.tsx
│   │   ├── categories/
│   │   │   └── CategoryList.tsx
│   │   ├── dashboard/
│   │   │   └── Dashboard.tsx
│   │   └── tasks/
│   │       └── TaskList.tsx
│   │
│   ├── services/
│   │   ├── api.ts             # Instância configurada do Axios (com interceptors)
│   │   ├── categoryService.ts # Funções para API de categorias
│   │   └── taskService.ts     # Funções para API de tarefas
│   │
│   ├── App.tsx             # Configuração do React Router (Rotas)
│   ├── firebaseConfig.ts   # Configuração do Firebase Client SDK
│   ├── index.css           # Estilos globais do Tailwind
│   └── main.tsx            # Ponto de entrada da aplicação React
│
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## 🚀 Como Executar

### 1. Pré-requisitos

* [Node.js](https://nodejs.org/) (v18 ou superior)
* [npm](https://www.npmjs.com/) ou [pnpm](https://pnpm.io/)
* O **Back-end (API)** deve estar configurado e em execução. (Veja [../task_manager_api/README.md](../task_manager_api/README.md)).

### 2. Instalação

1.  Navegue até a pasta do front-end:
    ```bash
    cd task_manager_frontend
    ```

2.  Instale as dependências:
    ```bash
    npm install
    # ou
    pnpm install
    ```

### 3. Configuração do Firebase (Obrigatório)

O front-end precisa das credenciais **públicas** do Firebase para o cliente web (autenticação).

1.  Acesse o [Console do Firebase](https://console.firebase.google.com/).
2.  Abra seu projeto.
3.  Vá para **Configurações do Projeto** (ícone de engrenagem).
4.  Na aba **Geral**, role para baixo até **"Seus aplicativos"**.
5.  Selecione (ou crie) seu aplicativo Web (`</>`).
6.  Na seção **"SDK do Firebase"**, escolha a opção **"Config"**.
7.  Você verá um objeto `firebaseConfig`. Copie este objeto.
8.  Abra o arquivo `src/firebaseConfig.ts` no seu editor.
9.  **Cole** o objeto que você copiou, substituindo o placeholder:

    ```typescript
    // Em: src/firebaseConfig.ts

    // TODO: Substitua pelo objeto de configuração do seu App da Web do Firebase
    const firebaseConfig = {
      apiKey: "SUA_API_KEY",
      authDomain: "SEU_AUTH_DOMAIN",
      projectId: "SEU_PROJECT_ID",
      storageBucket: "SEU_STORAGE_BUCKET",
      messagingSenderId: "SEU_MESSAGING_SENDER_ID",
      appId: "SEU_APP_ID"
    };
    ```

### 4. Configuração do Ambiente (Opcional, mas Recomendado)

Atualmente, a URL da API está fixa no arquivo `src/services/api.ts`. Para uma configuração mais profissional, é recomendado usar um arquivo `.env`.

1.  Crie um arquivo chamado `.env` na raiz da pasta `task_manager_frontend/`.
2.  Adicione a seguinte linha:
    ```
    VITE_API_URL=http://localhost:8000/api
    ```
3.  Modifique o arquivo `src/services/api.ts` para usar esta variável:
    ```typescript
    // Em: src/services/api.ts
    
    // Altere esta linha:
    const API_URL = 'http://localhost:8000/api';
    
    // Para esta:
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    ```

### 5. Executando o Front-end

1.  Certifique-se de que a API (back-end) esteja em execução.
2.  Inicie o servidor de desenvolvimento do Vite:
    ```bash
    npm run dev
    ```
3.  Abra o navegador no endereço fornecido (geralmente `http://localhost:5173`).