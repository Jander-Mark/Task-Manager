# Gerenciador de Tarefas (Task Manager)

![Badge do Projeto](https://img.shields.io/badge/status-conclu%C3%ADdo-brightgreen)
![Badge da Licença](https://img.shields.io/badge/licen%C3%A7a-MIT-blue)

Um aplicativo full-stack de gerenciamento de tarefas, construído com um front-end moderno em React (Vite + TypeScript) e uma API robusta em Node.js (Fastify), utilizando o Firebase para autenticação e banco de dados.

## 🔗 Links do Projeto:
https://task-manager-97.netlify.app

## 📋 Funcionalidades Principais

* **Autenticação Segura:** Cadastro, login e redefinição de senha gerenciados pelo **Firebase Authentication**.
* **Gestão de Tarefas:** CRUD completo (Criar, Ler, Atualizar, Excluir) para tarefas.
* **Gestão de Categorias:** CRUD completo para categorias.
* **Dashboard Interativo:** Visão geral com contagem de tarefas e lista de tarefas mais urgentes (baseado na data de vencimento).
* **Sistema de Temas:**
    * **Modo Claro / Escuro:** Alternância de tema claro (light) e escuro (dark) com persistência.
    * **Temas de Fundo:** 5 opções de fundos de imagem para personalizar a experiência.
* **Interface Moderna:** Construído com **Tailwind CSS** e componentes **shadcn/ui**.
* **Validação de Dados:** Validação de formulários no front-end (com Zod) e no back-end.

## 🛠️ Stack de Tecnologias

O projeto é dividido em duas partes principais:

* **Front-end (`/task_manager_frontend`)**
    * [React](https://reactjs.org/) (com [Vite](https://vitejs.dev/))
    * [TypeScript](https://www.typescriptlang.org/)
    * [Tailwind CSS](https://tailwindcss.com/) (para estilização)
    * [shadcn/ui](https://ui.shadcn.com/) (para componentes)
    * [Firebase Client SDK](https://firebase.google.com/docs/web) (para autenticação)
    * [Axios](https://axios-http.com/) (para requisições à API)
    * [Zod](https://zod.dev/) & [React Hook Form](https://react-hook-form.com/) (para formulários)

* **Back-end (`/task_manager_api`)**
    * [Node.js](https://nodejs.org/)
    * [Fastify](https://www.fastify.io/) (Framework web)
    * [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup) (para autenticação de API e Firestore)
    * [Firestore](https://firebase.google.com/docs/firestore) (Banco de dados NoSQL)

## 📁 Estrutura de Pastas (Principal)

A estrutura de alto nível do projeto é um monorepo simples, separando claramente o front-end do back-end.

```
/
├── task_manager_api/       # (Back-end API Node.js/Fastify)
│   ├── src/                # Código-fonte da API
│   ├── firebase-credentials.json # (Chave de serviço)
│   ├── package.json
│   └── README.md           # Documentação específica da API
│
├── task_manager_frontend/  # (Front-end App React/Vite)
│   ├── public/             # Imagens de fundo e assets estáticos
│   ├── src/                # Código-fonte do React
│   ├── package.json
│   └── README.md           # Documentação específica do Front-end
│
└── README.md               # (Este README)
```

## 🚀 Como Executar o Projeto

Para rodar este projeto, você precisará configurar e executar o back-end (a API) e o front-end (o cliente React) separadamente.

### 1. Pré-requisitos

* [Node.js](https://nodejs.org/) (v18 ou superior)
* [npm](https://www.npmjs.com/) ou [pnpm](https://pnpm.io/)
* Uma conta no [Firebase](https://firebase.google.com/) com um projeto criado.

### 2. Configurando o Back-end (API)

Siga as instruções detalhadas no README do back-end:
* **[Instruções do Back-end](./task_manager_api/README.md)**

### 3. Configurando o Front-end

Siga as instruções detalhadas no README do front-end:
* **[Instruções do Front-end](./task_manager_frontend/README.md)**

### 4. Executando

Após configurar ambos, você precisará de dois terminais abertos:

1.  **Terminal 1 (Back-end):**
    ```bash
    cd task_manager_api
    npm start
    # A API estará rodando em http://localhost:8000
    ```

2.  **Terminal 2 (Front-end):**
    ```bash
    cd task_manager_frontend
    npm run dev
    # O aplicativo estará acessível em http://localhost:5173 (ou outra porta indicada pelo Vite)
    ```

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.
