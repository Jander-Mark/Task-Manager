# API de Gerenciamento de Tarefas (Node.js/Fastify)

Esta é uma API RESTful para gerenciamento de tarefas, desenvolvida em Node.js com o framework Fastify e utilizando o Firebase Firestore como banco de dados NoSQL.

## Funcionalidades

*   **Autenticação:** Registro de usuários, login com JWT (JSON Web Tokens).
*   **Tarefas:** Criação, leitura, atualização e exclusão (CRUD) de tarefas.
*   **Categorias:** Criação, leitura, atualização e exclusão (CRUD) de categorias para organizar tarefas.
*   **Relacionamentos:** Associação de tarefas a categorias (armazenado como um array de IDs de categoria na tarefa).

## Estrutura do Projeto

```
/task_manager_api_js_v2
|-- src/
|   |-- config/         # Configurações (Firebase, variáveis de ambiente)
|   |-- services/       # Lógica de negócio (interação com Firestore)
|   |-- routes/         # Definição das rotas da API (Fastify)
|   |-- hooks/          # Hooks do Fastify (ex: autenticação)
|   |-- app.js          # Arquivo principal da aplicação Fastify
|-- .env              # Arquivo para variáveis de ambiente (NÃO INCLUÍDO NO ZIP)
|-- firebase-credentials.json # Credenciais do Firebase (NÃO INCLUÍDO NO ZIP)
|-- package.json
|-- package-lock.json
|-- todo.md           # Checklist do desenvolvimento
|-- README.md         # Este arquivo
```

## Pré-requisitos

*   Node.js (versão 20 ou superior recomendada)
*   npm (geralmente instalado com o Node.js)
*   Conta no Firebase com um projeto criado e o Firestore habilitado.

## Configuração

1.  **Clonar/Extrair o Projeto:** Obtenha o código-fonte (extraia o arquivo .zip fornecido).
2.  **Instalar Dependências:** Navegue até o diretório raiz do projeto (`task_manager_api_js_v2`) no terminal e execute:
    ```bash
    npm install
    ```
3.  **Credenciais do Firebase:**
    *   Faça o download do arquivo JSON da chave da conta de serviço do seu projeto Firebase.
    *   Renomeie este arquivo para `firebase-credentials.json`.
    *   Coloque o arquivo `firebase-credentials.json` na raiz do diretório do projeto (`task_manager_api_js_v2`). **Importante:** Este arquivo contém informações sensíveis e não deve ser versionado publicamente.
4.  **Variáveis de Ambiente:**
    *   Crie um arquivo chamado `.env` na raiz do projeto.
    *   Adicione as seguintes variáveis (ajuste os valores conforme necessário):
        ```dotenv
        PORT=8000
        JWT_SECRET=sua_chave_secreta_super_segura_aqui_trocar_em_producao
        JWT_EXPIRES_IN=30m
        # Adicione outras variáveis se necessário
        ```
    *   **Importante:** Substitua `sua_chave_secreta_super_segura_aqui_trocar_em_producao` por uma chave secreta forte e única para seus tokens JWT.

## Executando a API

Com a configuração concluída, execute o seguinte comando no terminal a partir da raiz do projeto:

```bash
node src/app.js
```

O servidor Fastify será iniciado (por padrão na porta 8000) e estará pronto para receber requisições.

## Endpoints da API

O prefixo base para todas as rotas é `/api`.

**Autenticação (`/api/auth`)**

*   `POST /register`: Registra um novo usuário.
    *   Corpo: `{ "email": "user@example.com", "nome": "Nome Usuario", "senha": "password123" }`
*   `POST /login`: Autentica um usuário e retorna um token JWT.
    *   Corpo: `{ "email": "user@example.com", "senha": "password123" }`
*   `GET /me`: Retorna informações do usuário autenticado (requer token JWT no header `Authorization: Bearer <token>`).

**Tarefas (`/api/tasks`)** (Requer autenticação JWT)

*   `POST /`: Cria uma nova tarefa.
    *   Corpo: `{ "titulo": "Nova Tarefa", "descricao": "Detalhes", "data_vencimento": "YYYY-MM-DD", "status": "pendente", "categoria_ids": ["id_categoria1", "id_categoria2"] }`
*   `GET /`: Lista todas as tarefas do usuário.
*   `GET /:taskId`: Obtém detalhes de uma tarefa específica.
*   `PUT /:taskId`: Atualiza uma tarefa existente.
    *   Corpo: Campos a serem atualizados (ex: `{ "status": "concluída" }`)
*   `DELETE /:taskId`: Exclui uma tarefa.

**Categorias (`/api/categories`)** (Requer autenticação JWT)

*   `POST /`: Cria uma nova categoria.
    *   Corpo: `{ "nome": "Nome da Categoria" }`
*   `GET /`: Lista todas as categorias do usuário.
*   `GET /:categoryId`: Obtém detalhes de uma categoria específica.
*   `PUT /:categoryId`: Atualiza uma categoria existente.
    *   Corpo: `{ "nome": "Novo Nome" }`
*   `DELETE /:categoryId`: Exclui uma categoria.

## Observações

*   A implementação inicial com Express apresentou problemas de roteamento no ambiente de desenvolvimento específico (sandbox), levando à migração para Fastify, que se mostrou funcional.
*   Os testes locais dos endpoints foram bem-sucedidos.
*   Endpoints públicos gerados pelo ambiente de desenvolvimento são temporários e podem expirar.

