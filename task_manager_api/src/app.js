const fastify = require("fastify")({ logger: true });
const path = require("path");
const config = require("./config/config.js");
const { getFirestoreDb } = require("./config/firebase.js"); // Inicializa o Firebase

// Registrar plugins
fastify.register(require("@fastify/cors"), {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"], 
  allowedHeaders: ["Content-Type", "Authorization"], 
  credentials: true, // Permite cookies, se necessário no futuro
});

fastify.register(require("@fastify/jwt"), {
  secret: config.jwt.secret,
});

// Decorator for authentication
fastify.decorate("authenticate", async function (request, reply) {
  try {
    await request.jwtVerify();
    // Anexar dados do usuário à requisição (opcional, requer buscar o usuário com base no payload do token)
    // Examplo: const user = await findUserById(request.user.userId);
    // request.userData = user;
  } catch (err) {
    fastify.log.warn("JWT Authentication failed:", err.message);
    reply.code(401).send({ message: "Autenticação necessária." });
  }
});

// --- Rotas ---
fastify.get("/", async (request, reply) => {
  return { message: "Bem-vindo à API de Gerenciamento de Tarefas (Fastify)!" };
});

// Registrar rotas de arquivos separados (serão criados em seguida)
fastify.register(require("./routes/authRoutes"), { prefix: "/api/auth" });
fastify.register(require("./routes/taskRoutes"), { prefix: "/api/tasks" });
fastify.register(require("./routes/categoryRoutes"), { prefix: "/api/categories" });

// --- Iniciar Servidor ---
const start = async () => {
  try {
    getFirestoreDb(); // Verifica a conexão com o banco de dados ao iniciar
    await fastify.listen({ port: config.port || 8000, host: "0.0.0.0" }); 
    fastify.log.info(`Servidor Fastify rodando na porta ${fastify.server.address().port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

module.exports = fastify;
