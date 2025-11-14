const categoryService = require("../services/categoryService");

async function categoryRoutes(fastify, options) {
  // Verifica se o usuário está autenticado antes de acessar as rotas de categoria
  fastify.addHook("onRequest", fastify.authenticate);

  // Criar uma nova categoria
  fastify.post("/", async (request, reply) => {
    try {
      const userId = request.user.userId; // Obtém o userId do token JWT
      const categoryData = request.body;
      if (!categoryData.nome) {
        return reply.code(400).send({ message: "O nome da categoria é obrigatório." });
      }
      const newCategory = await categoryService.createCategory(categoryData, userId);
      reply.code(201).send(newCategory);
    } catch (error) {
      if (error.message.includes("já existe")) {
        return reply.code(409).send({ message: error.message });
      }
      fastify.log.error(error, "Erro ao criar categoria");
      reply.code(500).send({ message: "Erro interno ao criar categoria." });
    }
  });

  // Listar todas as categorias do usuário
  fastify.get("/", async (request, reply) => {
    try {
      const userId = request.user.userId;
      const categories = await categoryService.findCategoriesByUser(userId);
      reply.send(categories);
    } catch (error) {
      fastify.log.error(error, "Erro ao buscar categorias");
      reply.code(500).send({ message: "Erro interno ao buscar categorias." });
    }
  });

  // Obter uma categoria específica por ID
  fastify.get("/:categoryId", async (request, reply) => {
    try {
      const userId = request.user.userId;
      const { categoryId } = request.params;
      const category = await categoryService.findCategoryById(categoryId, userId);
      if (!category) {
        return reply.code(404).send({ message: "Categoria não encontrada ou não pertence ao usuário." });
      }
      reply.send(category);
    } catch (error) {
      fastify.log.error(error, "Erro ao buscar categoria por ID");
      reply.code(500).send({ message: "Erro interno ao buscar categoria." });
    }
  });

  // Atualizar uma categoria existente
  fastify.put("/:categoryId", async (request, reply) => {
    try {
      const userId = request.user.userId;
      const { categoryId } = request.params;
      const updateData = request.body;
      if (updateData.nome !== undefined && !updateData.nome) {
        return reply.code(400).send({ message: "O nome da categoria não pode ser vazio." });
      }
      delete updateData.usuario_id; // Não permitir atualização do ID do usuário
      delete updateData.id;

      const updatedCategory = await categoryService.updateCategory(categoryId, updateData, userId);
      if (!updatedCategory) {
        return reply.code(404).send({ message: "Categoria não encontrada ou não pertence ao usuário." });
      }
      reply.send(updatedCategory);
    } catch (error) {
      if (error.message.includes("já existe")) {
        return reply.code(409).send({ message: error.message });
      }
      fastify.log.error(error, "Erro ao atualizar categoria");
      reply.code(500).send({ message: "Erro interno ao atualizar categoria." });
    }
  });

  // Excluir uma categoria
  fastify.delete("/:categoryId", async (request, reply) => {
    try {
      const userId = request.user.userId;
      const { categoryId } = request.params;
      const deleted = await categoryService.deleteCategory(categoryId, userId);
      if (!deleted) {
        return reply.code(404).send({ message: "Categoria não encontrada ou não pertence ao usuário." });
      }
      reply.code(204).send();
    } catch (error) {
      fastify.log.error(error, "Erro ao deletar categoria");
      reply.code(500).send({ message: "Erro interno ao deletar categoria." });
    }
  });

}

module.exports = categoryRoutes;

