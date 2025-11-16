# API - Gerenciador de Tarefas (Node.js + Fastify)

Esta é a API de back-end para o projeto Gerenciador de Tarefas. Ela é construída com Node.js e Fastify, e utiliza o Firebase Admin SDK para se conectar ao Firestore e verificar a autenticação dos usuários.

## 🛠️ Stack de Tecnologias

* **[Node.js](https://nodejs.org/)**: Ambiente de execução.
* **[Fastify](https://www.fastify.io/)**: Framework web de alta performance.
* **[Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)**: Para verificar tokens de autenticação do Firebase e acessar o Firestore.
* **[Firestore](https://firebase.google.com/docs/firestore)**: Banco de dados NoSQL.

## 📁 Estrutura de Pastas (API)

```
task_manager_api/
├── src/
│   ├── app.js            # Ponto de entrada principal da aplicação Fastify (servidor, plugins, rotas)
│   ├── config/
│   │   ├── config.js     # Configurações gerais (porta, etc.)
│   │   └── firebase.js   # Inicialização do Firebase Admin SDK
│   │
│   ├── routes/
│   │   ├── authRoutes.js     # Rotas de Autenticação (ex: /register, /me)
│   │   ├── categoryRoutes.js # Rotas de CRUD para Categorias
│   │   └── taskRoutes.js     # Rotas de CRUD para Tarefas
│   │
│   └── services/
│       ├── categoryS_ervice.js # Lógica de negócio para Categorias (interação com o Firestore)
│       ├── taskService.js      # Lógica de negócio para Tarefas
│       └── userService.js      # Lógica de negócio para Usuários (criar perfil, buscar)
│
├── firebase-credentials.json # (Chave de serviço - NÃO SUBIR NO GIT)
├── node_modules/
├── package.json
├── package-lock.json
└── README.md                 # (Este README)
```

## 🚀 Como Executar

### 1. Pré-requisitos

* [Node.js](https://nodejs.org/) (v18 ou superior)
* [npm](https://www.npmjs.com/) ou [pnpm](https://pnpm.io/)
* Um projeto Firebase criado.

### 2. Instalação

1.  Navegue até a pasta da API:
    ```bash
    cd task_manager_api
    ```

2.  Instale as dependências:
    ```bash
    npm install
    # ou
    pnpm install
    ```

### 3. Configuração do Firebase (Obrigatório)

Esta API requer uma **chave de conta de serviço** do Firebase para funcionar.

1.  Acesse o [Console do Firebase](https://console.firebase.google.com/).
2.  Abra seu projeto.
3.  Vá para **Configurações do Projeto** (ícone de engrenagem).
4.  Clique na aba **Contas de serviço**.
5.  Clique em **"Gerar nova chave privada"** e confirme.
6.  Um arquivo `.json` será baixado (ex: `meu-projeto-firebase-adminsdk.json`).
7.  **Renomeie** este arquivo para `firebase-credentials.json`.
8.  **Mova** este arquivo para a raiz da pasta `task_manager_api/`.

O arquivo `src/config/firebase.js` está configurado para ler este arquivo.

### 4. Executando a API

Após instalar as dependências e adicionar o `firebase-credentials.json`, inicie o servidor:

```bash
npm start
```

O servidor será iniciado em `http://localhost:8000`.

## 🔒 Endpoints da API

Todas as rotas (exceto a raiz `/`) são protegidas e exigem um Token JWT (Firebase Auth) válido no cabeçalho `Authorization: Bearer <token>`.

### Autenticação (`/api/auth`)

* `POST /api/auth/register`: (Protegida) Cria o perfil de um novo usuário no Firestore após ele ter sido criado no Firebase Auth pelo front-end.
* `GET /api/auth/me`: (Protegida) Retorna os dados do perfil do usuário atualmente autenticado.

### Tarefas (`/api/tasks`)

* `GET /`: Retorna todas as tarefas do usuário autenticado.
* `POST /`: Cria uma nova tarefa.
* `PUT /:id`: Atualiza uma tarefa existente.
* `DELETE /:id`: Exclui uma tarefa.
* `PATCH /:id/complete`: Marca uma tarefa como 'concluída'.
* `PATCH /:id/pending`: Marca uma tarefa como 'pendente'.

### Categorias (`/api/categories`)

* `GET /`: Retorna todas as categorias do usuário autenticado.
* `POST /`: Cria uma nova categoria.
* `PUT /:id`: Atualiza uma categoria existente.
* `DELETE /:id`: Exclui uma categoria.