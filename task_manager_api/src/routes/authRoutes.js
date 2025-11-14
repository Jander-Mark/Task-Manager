const userService = require("../services/userService");
const authService = require("../services/authService");
const { findUserById } = require("../services/userService"); 

async function authRoutes(fastify, options) {

  // Rota de Registro
  fastify.post("/register", async (request, reply) => {
    try {
      const { email, nome, senha } = request.body;
      if (!email || !nome || !senha) {
        return reply.code(400).send({ message: "Todos os campos são obrigatórios: email, nome, senha." });
      }
      const user = await userService.createUser({ email, nome, senha });
      reply.code(201).send(user);
    } catch (error) {
      if (error.message === "Email já registrado") {
        return reply.code(409).send({ message: error.message });
      }
      fastify.log.error(error, "Erro no registro");
      reply.code(500).send({ message: "Erro interno ao registrar usuário." });
    }
  });

  // Rota de Login
  fastify.post("/login", async (request, reply) => {
    try {
      const { email, senha } = request.body;
      if (!email || !senha) {
        return reply.code(400).send({ message: "Email e senha são obrigatórios." });
      }
      const user = await authService.authenticateUser(email, senha);
      if (!user) {
        return reply.code(401).send({ message: "Email ou senha inválidos." });
      }
      // Gera JWT token usando o fastify.jwt
      const token = fastify.jwt.sign({ userId: user.id }); // userID
      reply.send({ 
        message: "Login bem-sucedido!",
        token: token,
        user: { id: user.id, email: user.email, nome: user.nome }
      });
    } catch (error) {
      fastify.log.error(error, "Erro no login");
      reply.code(500).send({ message: "Erro interno ao tentar fazer login." });
    }
  });

  // Rota para obter informações do usuário autenticado
  fastify.get("/me", { onRequest: [fastify.authenticate] }, async (request, reply) => {
    // fastify.authenticate Verifica o token.
    // Precisamos do user ID do token payload para receber as informações.
    const userId = request.user.userId; 
    try {
        const userData = await findUserById(userId);
        if (!userData) {
            return reply.code(404).send({ message: "Usuário não encontrado." });
        }
        reply.send(userData);
    } catch (error) {
        fastify.log.error(error, "Erro ao buscar dados do usuário (/me)");
        reply.code(500).send({ message: "Erro interno ao buscar dados do usuário." });
    }
  });

}

module.exports = authRoutes;

