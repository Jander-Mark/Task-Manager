const userService = require("../services/userService");
// Removido: authService
const { findUserById } = require("../services/userService"); 

async function authRoutes(fastify, options) {

  // Rota de Registro (MODIFICADA)
  // O front-end irá primeiro criar o usuário no Firebase Auth,
  // e depois chamar esta rota para criar o perfil no Firestore.
  fastify.post("/register", { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { email, nome } = request.body;
      const uid = request.user.userId; // UID vindo do token verificado

      if (!email || !nome) {
        return reply.code(400).send({ message: "Email e nome são obrigatórios." });
      }

      // Passa o UID do Auth para criar o documento no Firestore
      const user = await userService.createUser(uid, { email, nome });
      reply.code(201).send(user);

    } catch (error) {
      if (error.message === "Email já registrado") {
        return reply.code(409).send({ message: error.message });
      }
      fastify.log.error(error, "Erro no registro do perfil no Firestore");
      reply.code(500).send({ message: "Erro interno ao registrar usuário." });
    }
  });

  // Rota de Login (REMOVIDA)
  // O login agora é tratado 100% pelo front-end com a SDK do Firebase.

  // Rota para obter informações do usuário autenticado (FUNCIONA COMO ANTES)
  // O decorator 'fastify.authenticate' agora coloca o UID do Auth em 'request.user.userId'
  fastify.get("/me", { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const userId = request.user.userId; 
    try {
        const userData = await findUserById(userId);
        if (!userData) {
            // Isso pode acontecer se o usuário existe no Auth mas não no Firestore
            // Poderia ser um gatilho para criar o perfil, se desejado.
            return reply.code(404).send({ message: "Perfil de usuário não encontrado." });
        }
        reply.send(userData);
    } catch (error) {
        fastify.log.error(error, "Erro ao buscar dados do usuário (/me)");
        reply.code(500).send({ message: "Erro interno ao buscar dados do usuário." });
    }
  });

}

module.exports = authRoutes;