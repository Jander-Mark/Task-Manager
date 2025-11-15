const fastify = require("fastify")({ logger: true });
const path = require("path");
const config = require("./config/config.js");
const { getFirestoreDb, getFirebaseAuth } = require("./config/firebase.js"); // Inicializa o Firebase

// Registrar plugins
fastify.register(require("@fastify/cors"), {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"], 
  allowedHeaders: ["Content-Type", "Authorization"], 
  credentials: true,
});

// REMOVEMOS O fastify.register(require("@fastify/jwt"))

// Decorator for authentication (NOVA VERSÃO)
fastify.decorate("authenticate", async function (request, reply) {
  try {
    if (!request.headers.authorization) {
      throw new Error("Sem token de autorização");
    }
    
    // Pega o token do cabeçalho "Bearer <token>"
    const token = request.headers.authorization.split('Bearer ')[1];
    if (!token) {
      throw new Error("Token mal formatado");
    }

    // Verifica o token usando o Firebase Admin
    const auth = getFirebaseAuth();
    const decodedToken = await auth.verifyIdToken(token);
    
    // Anexa o UID do usuário (do Firebase Auth) ao request
    request.user = { userId: decodedToken.uid };

  } catch (err) {
    fastify.log.warn("Falha na autenticação JWT do Firebase:", err.message);
    reply.code(401).send({ message: "Autenticação necessária ou token inválido." });
  }
});

// --- Rotas ---
fastify.get("/", async (request, reply) => {
  return { message: "Bem-vindo à API de Gerenciamento de Tarefas (Fastify)!" };
});

// Registrar rotas de arquivos separados
fastify.register(require("./routes/authRoutes"), { prefix: "/api/auth" });
fastify.register(require("./routes/taskRoutes"), { prefix: "/api/tasks" });
fastify.register(require("./routes/categoryRoutes"), { prefix: "/api/categories" });

// --- Iniciar Servidor ---
const start = async () => {
  try {
    getFirestoreDb(); // Verifica a conexão com o banco de dados
    getFirebaseAuth(); // Verifica a conexão com o Auth
    await fastify.listen({ port: config.port || 8000, host: "0.0.0.0" }); 
    fastify.log.info(`Servidor Fastify rodando na porta ${fastify.server.address().port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

module.exports = fastify;