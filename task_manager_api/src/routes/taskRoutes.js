const taskService = require("../services/taskService");

async function taskRoutes(fastify, options) {

  // Verifica se o usuário está autenticado antes de acessar as rotas de tarefa
  fastify.addHook("onRequest", fastify.authenticate);

  // Criar uma nova tarefa
  fastify.post("/", async (request, reply) => {
    try {
      const userId = request.user.userId; // Obtém o userId do token JWT
      const taskData = request.body;
      if (!taskData.titulo) {
        return reply.code(400).send({ message: "O título da tarefa é obrigatório." });
      }
      const newTask = await taskService.createTask(taskData, userId);
      reply.code(201).send(newTask);
    } catch (error) {
      fastify.log.error(error, "Erro ao criar tarefa");
      reply.code(500).send({ message: "Erro interno ao criar tarefa." });
    }
  });

  // Listar todas as tarefas do usuário
  fastify.get("/", async (request, reply) => {
    try {
      const userId = request.user.userId;
      const tasks = await taskService.findTasksByUser(userId);
      reply.send(tasks);
    } catch (error) {
      fastify.log.error(error, "Erro ao buscar tarefas");
      reply.code(500).send({ message: "Erro interno ao buscar tarefas." });
    }
  });

  // Obter uma tarefa específica por ID
  fastify.get("/:taskId", async (request, reply) => {
    try {
      const userId = request.user.userId;
      const { taskId } = request.params;
      const task = await taskService.findTaskById(taskId, userId);
      if (!task) {
        return reply.code(404).send({ message: "Tarefa não encontrada ou não pertence ao usuário." });
      }
      reply.send(task);
    } catch (error) {
      fastify.log.error(error, "Erro ao buscar tarefa por ID");
      reply.code(500).send({ message: "Erro interno ao buscar tarefa." });
    }
  });

  // Atualizar uma tarefa existente
  fastify.put("/:taskId", async (request, reply) => {
    try {
      const userId = request.user.userId;
      const { taskId } = request.params;
      const updateData = request.body;
      delete updateData.usuario_id; // Não permitir atualização do ID do usuário
      delete updateData.id;

      const updatedTask = await taskService.updateTask(taskId, updateData, userId);
      if (!updatedTask) {
        return reply.code(404).send({ message: "Tarefa não encontrada ou não pertence ao usuário." });
      }
      reply.send(updatedTask);
    } catch (error) {
      fastify.log.error(error, "Erro ao atualizar tarefa");
      reply.code(500).send({ message: "Erro interno ao atualizar tarefa." });
    }
  });

  // Excluir uma tarefa
  fastify.delete("/:taskId", async (request, reply) => {
    try {
      const userId = request.user.userId;
      const { taskId } = request.params;
      const deleted = await taskService.deleteTask(taskId, userId);
      if (!deleted) {
        return reply.code(404).send({ message: "Tarefa não encontrada ou não pertence ao usuário." });
      }
      reply.code(204).send(); 
    } catch (error) {
      fastify.log.error(error, "Erro ao deletar tarefa");
      reply.code(500).send({ message: "Erro interno ao deletar tarefa." });
    }
  });

}

module.exports = taskRoutes;

