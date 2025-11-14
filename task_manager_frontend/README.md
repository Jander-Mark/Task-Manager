# Frontend do Sistema de Gerenciamento de Tarefas

Este é o frontend em React para o Sistema de Gerenciamento de Tarefas, desenvolvido para integrar com a API Fastify criada anteriormente.

## Funcionalidades

* **Autenticação:** Registro de usuários, login com JWT (JSON Web Tokens).
* **Dashboard:** Visão geral das tarefas e categorias.
* **Tarefas:** Criação, visualização, edição e exclusão de tarefas, com filtros por status e categoria.
* **Categorias:** Criação, visualização, edição e exclusão de categorias.
* **Interface Responsiva:** Design adaptável para dispositivos móveis e desktop.

## Tecnologias Utilizadas

* React (TypeScript)
* React Router para navegação
* React Hook Form com Zod para validação de formulários
* Tailwind CSS para estilização
* Axios para comunicação com a API

## Estrutura do Projeto

```
/task_manager_frontend
|-- src/
|   |-- assets/       # Recursos estáticos como imagens
|   |-- components/   # Componentes reutilizáveis
|   |-- contexts/     # Contextos React (AuthContext)
|   |-- hooks/        # Hooks personalizados
|   |-- lib/          # Funções utilitárias
|   |-- pages/        # Páginas da aplicação
|   |   |-- auth/     # Páginas de autenticação (login, registro)
|   |   |-- dashboard/# Dashboard principal
|   |   |-- tasks/    # Gerenciamento de tarefas
|   |   |-- categories/# Gerenciamento de categorias
|   |-- services/     # Serviços para comunicação com a API
|   |-- App.tsx       # Componente principal com rotas
|   |-- main.tsx      # Ponto de entrada
|-- public/           # Arquivos públicos
|-- package.json      # Dependências e scripts
|-- tailwind.config.js# Configuração do Tailwind CSS
|-- tsconfig.json     # Configuração do TypeScript
```

## Pré-requisitos

* Node.js (versão 20 ou superior recomendada)
* pnpm (gerenciador de pacotes)
* API de backend rodando (Fastify)

## Configuração

1. **Clonar/Extrair o Projeto:** Obtenha o código-fonte (extraia o arquivo .zip fornecido).

2. **Instalar Dependências:** Navegue até o diretório raiz do projeto (`task_manager_frontend`) no terminal e execute:
   ```bash
   pnpm install
   ```

3. **Configurar URL da API:**
   * Abra o arquivo `src/services/api.ts`
   * Atualize a constante `API_URL` com o endereço da sua API backend

## Executando o Frontend

Com a configuração concluída, execute o seguinte comando no terminal a partir da raiz do projeto:

```bash
pnpm run dev
```

O servidor de desenvolvimento será iniciado (por padrão na porta 5173) e estará pronto para uso.

## Fluxo de Uso

1. **Autenticação:**
   * Registre-se com nome, email e senha
   * Faça login com email e senha
   * O token JWT é armazenado no localStorage

2. **Dashboard:**
   * Visualize um resumo das suas tarefas e categorias
   * Navegue para as seções de tarefas e categorias

3. **Gerenciamento de Tarefas:**
   * Crie novas tarefas com título, descrição, data de vencimento e categorias
   * Visualize todas as suas tarefas
   * Filtre tarefas por status (pendente/concluída) e categoria
   * Edite ou exclua tarefas existentes
   * Marque tarefas como concluídas/pendentes

4. **Gerenciamento de Categorias:**
   * Crie novas categorias
   * Visualize todas as suas categorias
   * Edite ou exclua categorias existentes

## Observações

* O frontend está integrado com a API Fastify desenvolvida anteriormente
* A autenticação é gerenciada através de tokens JWT
* As URLs públicas geradas pelo ambiente de desenvolvimento são temporárias e podem expirar
